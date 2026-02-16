/**
 * Custom TV Keyboard for Jellyfin webOS
 * Netflix-style grid keyboard with D-pad navigation
 */

(function() {
    'use strict';

    // Keyboard layout
    const KEYBOARD_ROWS = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    const SPECIAL_KEYS = [
        { key: 'DEL', action: 'backspace', flex: 1.5 },
        { key: 'SPACE', action: 'space', flex: 3 },
        { key: 'CLEAR', action: 'clear', flex: 1.5 }
    ];

    // Configuration
    const CONFIG = {
        debounceMs: 300,
        maxResults: 20,
        resultTypes: ['Movie', 'Series']
    };

    // State
    let isSearchOpen = false;
    let searchTimeout = null;
    let currentFocusRow = 0;
    let currentFocusCol = 0;
    let focusedElement = null;
    let searchOverlay = null;
    let apiClient = null;

    /**
     * Create the search overlay HTML
     */
    function createSearchOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'tv-search-overlay';
        overlay.innerHTML = `
            <button class="tv-search-close" tabindex="-1">&times;</button>
            <div class="tv-search-keyboard-panel">
                <div class="tv-search-input-container">
                    <input type="text" class="tv-search-input" placeholder="Search movies & shows..." readonly>
                </div>
                <div class="tv-keyboard"></div>
            </div>
            <div class="tv-search-results-panel">
                <div class="tv-search-results-title">Results</div>
                <div class="tv-search-results-grid"></div>
            </div>
        `;

        // Build keyboard
        const keyboardContainer = overlay.querySelector('.tv-keyboard');
        buildKeyboard(keyboardContainer);

        // Add event listeners
        overlay.querySelector('.tv-search-close').addEventListener('click', closeSearch);

        document.body.appendChild(overlay);
        return overlay;
    }

    /**
     * Build the keyboard grid
     */
    function buildKeyboard(container) {
        KEYBOARD_ROWS.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'tv-keyboard-row';
            rowDiv.setAttribute('data-row', rowIndex);

            row.forEach((key, colIndex) => {
                const keyButton = createKeyButton(key, rowIndex, colIndex);
                rowDiv.appendChild(keyButton);
            });

            container.appendChild(rowDiv);
        });

        // Special keys row
        const specialRow = document.createElement('div');
        specialRow.className = 'tv-keyboard-row';
        specialRow.setAttribute('data-row', KEYBOARD_ROWS.length);

        SPECIAL_KEYS.forEach((specialKey, colIndex) => {
            const keyButton = document.createElement('button');
            keyButton.className = `tv-key ${specialKey.action}`;
            keyButton.textContent = specialKey.key;
            keyButton.style.flex = specialKey.flex;
            keyButton.setAttribute('data-action', specialKey.action);
            keyButton.setAttribute('data-row', KEYBOARD_ROWS.length);
            keyButton.setAttribute('data-col', colIndex);
            keyButton.tabIndex = -1;

            keyButton.addEventListener('click', () => handleKeyPress(specialKey.action));

            specialRow.appendChild(keyButton);
        });

        container.appendChild(specialRow);
    }

    /**
     * Create a key button
     */
    function createKeyButton(key, row, col) {
        const button = document.createElement('button');
        button.className = 'tv-key';
        button.textContent = key;
        button.setAttribute('data-key', key);
        button.setAttribute('data-row', row);
        button.setAttribute('data-col', col);
        button.tabIndex = -1;

        button.addEventListener('click', () => handleKeyPress(key));

        return button;
    }

    /**
     * Handle key press
     */
    function handleKeyPress(key) {
        const input = searchOverlay.querySelector('.tv-search-input');

        switch (key) {
            case 'backspace':
                input.value = input.value.slice(0, -1);
                break;
            case 'space':
                input.value += ' ';
                break;
            case 'clear':
                input.value = '';
                break;
            default:
                input.value += key.toLowerCase();
                break;
        }

        // Trigger search with debounce
        debounceSearch(input.value);
    }

    /**
     * Debounced search
     */
    function debounceSearch(query) {
        clearTimeout(searchTimeout);

        if (!query || query.length < 2) {
            clearResults();
            return;
        }

        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, CONFIG.debounceMs);
    }

    /**
     * Perform search
     */
    async function performSearch(query) {
        const resultsGrid = searchOverlay.querySelector('.tv-search-results-grid');
        resultsGrid.innerHTML = '<div class="tv-search-loading"><div class="tv-search-spinner"></div></div>';

        try {
            // Get API client from Jellyfin
            if (!apiClient && window.ApiClient) {
                apiClient = window.ApiClient;
            }

            if (!apiClient) {
                throw new Error('API client not available');
            }

            const userId = apiClient.getCurrentUserId();
            const results = await apiClient.getSearchHints({
                searchTerm: query,
                limit: CONFIG.maxResults,
                includeItemTypes: CONFIG.resultTypes.join(','),
                userId: userId
            });

            displayResults(results.SearchHints || []);
        } catch (error) {
            console.error('[TVKeyboard] Search error:', error);
            resultsGrid.innerHTML = '<div class="tv-search-no-results">Search failed. Please try again.</div>';
        }
    }

    /**
     * Display search results
     */
    function displayResults(results) {
        const resultsGrid = searchOverlay.querySelector('.tv-search-results-grid');

        if (!results || results.length === 0) {
            resultsGrid.innerHTML = '<div class="tv-search-no-results">No results found</div>';
            return;
        }

        resultsGrid.innerHTML = '';

        results.forEach((item, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'tv-search-result-item';
            resultItem.tabIndex = 0;
            resultItem.setAttribute('data-item-id', item.Id || item.ItemId);
            resultItem.setAttribute('data-result-index', index);

            // Get poster URL
            const itemId = item.Id || item.ItemId;
            let posterUrl = '';
            if (apiClient) {
                posterUrl = apiClient.getImageUrl(itemId, {
                    type: 'Primary',
                    maxHeight: 300,
                    quality: 90
                });
            }

            const typeClass = item.Type === 'Series' ? 'series' : '';

            resultItem.innerHTML = `
                <img class="tv-search-result-poster" src="${posterUrl}" alt="${item.Name}" onerror="this.src='assets/icon-80.png'">
                <div class="tv-search-result-info">
                    <div class="tv-search-result-title">${item.Name}</div>
                    <span class="tv-search-result-type ${typeClass}">${item.Type}</span>
                </div>
            `;

            resultItem.addEventListener('click', () => navigateToItem(item));
            resultItem.addEventListener('keydown', (e) => {
                if (e.keyCode === 13) { // Enter
                    navigateToItem(item);
                }
            });

            resultsGrid.appendChild(resultItem);
        });
    }

    /**
     * Clear search results
     */
    function clearResults() {
        const resultsGrid = searchOverlay.querySelector('.tv-search-results-grid');
        resultsGrid.innerHTML = '';
    }

    /**
     * Navigate to item detail page
     */
    function navigateToItem(item) {
        closeSearch();

        const itemId = item.Id || item.ItemId;
        if (itemId && window.Emby && window.Emby.Page) {
            window.Emby.Page.show(`/details?id=${itemId}`);
        } else if (itemId) {
            // Fallback navigation
            window.location.hash = `#/details?id=${itemId}`;
        }
    }

    /**
     * Open search overlay
     */
    function openSearch() {
        if (!searchOverlay) {
            searchOverlay = createSearchOverlay();
        }

        searchOverlay.classList.add('active');
        isSearchOpen = true;

        // Focus first key
        currentFocusRow = 0;
        currentFocusCol = 0;
        focusKey(0, 0);

        // Clear previous search
        const input = searchOverlay.querySelector('.tv-search-input');
        input.value = '';
        clearResults();
    }

    /**
     * Close search overlay
     */
    function closeSearch() {
        if (searchOverlay) {
            searchOverlay.classList.remove('active');
        }
        isSearchOpen = false;
        clearTimeout(searchTimeout);
    }

    /**
     * Focus a key by row and column
     */
    function focusKey(row, col) {
        // Remove previous focus
        if (focusedElement) {
            focusedElement.classList.remove('focused');
        }

        // Get the key at position
        const keyboard = searchOverlay.querySelector('.tv-keyboard');
        const rowElement = keyboard.querySelector(`[data-row="${row}"]`);

        if (!rowElement) return;

        const keys = rowElement.querySelectorAll('.tv-key');
        const maxCol = keys.length - 1;

        // Clamp column
        col = Math.max(0, Math.min(col, maxCol));

        const key = keys[col];
        if (key) {
            key.classList.add('focused');
            key.focus();
            focusedElement = key;
            currentFocusRow = row;
            currentFocusCol = col;
        }
    }

    /**
     * Handle D-pad navigation
     */
    function handleNavigation(direction) {
        if (!isSearchOpen) return;

        const totalRows = KEYBOARD_ROWS.length + 1; // +1 for special keys row
        const resultsGrid = searchOverlay.querySelector('.tv-search-results-grid');
        const resultItems = resultsGrid.querySelectorAll('.tv-search-result-item');
        const isInResults = document.activeElement?.classList.contains('tv-search-result-item');

        switch (direction) {
            case 'up':
                if (isInResults) {
                    // Move from results to keyboard
                    focusKey(currentFocusRow, currentFocusCol);
                } else if (currentFocusRow > 0) {
                    focusKey(currentFocusRow - 1, currentFocusCol);
                }
                break;

            case 'down':
                if (currentFocusRow < totalRows - 1) {
                    focusKey(currentFocusRow + 1, currentFocusCol);
                } else if (resultItems.length > 0) {
                    // Move to results
                    resultItems[0].focus();
                }
                break;

            case 'left':
                if (isInResults) {
                    const currentIndex = parseInt(document.activeElement.getAttribute('data-result-index'));
                    if (currentIndex > 0) {
                        resultItems[currentIndex - 1].focus();
                    }
                } else if (currentFocusCol > 0) {
                    focusKey(currentFocusRow, currentFocusCol - 1);
                }
                break;

            case 'right':
                if (isInResults) {
                    const currentIndex = parseInt(document.activeElement.getAttribute('data-result-index'));
                    if (currentIndex < resultItems.length - 1) {
                        resultItems[currentIndex + 1].focus();
                    }
                } else {
                    focusKey(currentFocusRow, currentFocusCol + 1);
                }
                break;
        }
    }

    /**
     * Global keyboard handler
     */
    function handleKeyDown(event) {
        if (!isSearchOpen) return;

        switch (event.keyCode) {
            case 37: // Left
                handleNavigation('left');
                event.preventDefault();
                break;
            case 38: // Up
                handleNavigation('up');
                event.preventDefault();
                break;
            case 39: // Right
                handleNavigation('right');
                event.preventDefault();
                break;
            case 40: // Down
                handleNavigation('down');
                event.preventDefault();
                break;
            case 13: // Enter/OK
                if (focusedElement && !document.activeElement?.classList.contains('tv-search-result-item')) {
                    focusedElement.click();
                }
                event.preventDefault();
                break;
            case 461: // Back button
            case 27: // Escape
                closeSearch();
                event.preventDefault();
                break;
        }
    }

    /**
     * Hook into Jellyfin search button
     */
    function hookSearchButton() {
        // Watch for search button clicks
        document.addEventListener('click', function(event) {
            const searchButton = event.target.closest('.headerSearchButton, [data-action="search"], .searchButton');
            if (searchButton) {
                event.preventDefault();
                event.stopPropagation();
                openSearch();
            }
        }, true);

        // Also intercept search hotkey
        document.addEventListener('keydown', function(event) {
            // S key or Search remote button
            if (!isSearchOpen && (event.keyCode === 83 || event.keyCode === 112)) {
                event.preventDefault();
                openSearch();
            }
        });
    }

    /**
     * Initialize
     */
    function init() {
        console.log('[TVKeyboard] Initializing');

        // Hook search button
        hookSearchButton();

        // Global key handler
        document.addEventListener('keydown', handleKeyDown);

        // Expose API
        window.TVKeyboard = {
            open: openSearch,
            close: closeSearch,
            isOpen: function() { return isSearchOpen; }
        };

        console.log('[TVKeyboard] Initialization complete');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
