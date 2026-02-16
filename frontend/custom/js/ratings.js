/**
 * Custom Ratings Plugin Integration for Jellyfin webOS
 * Interactive star ratings (1-10) on detail screens
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        maxRating: 10,
        endpoints: {
            stats: '/Ratings/Items/{itemId}/Stats',
            rate: '/Ratings/Items/{itemId}/Rating',
            delete: '/Ratings/Items/{itemId}/Rating'
        }
    };

    // Cache for rating stats
    const ratingsCache = new Map();

    // State
    let apiClient = null;
    let currentItemId = null;
    let currentUserRating = null;
    let previewRating = null;

    /**
     * Get API client
     */
    function getApiClient() {
        if (!apiClient && window.ApiClient) {
            apiClient = window.ApiClient;
        }
        return apiClient;
    }

    /**
     * Fetch rating stats for an item
     */
    async function fetchRatingStats(itemId) {
        const client = getApiClient();
        if (!client) return null;

        // Check cache first
        if (ratingsCache.has(itemId)) {
            return ratingsCache.get(itemId);
        }

        try {
            const url = client.getUrl(CONFIG.endpoints.stats.replace('{itemId}', itemId));
            const response = await fetch(url, {
                headers: {
                    'X-Emby-Authorization': client._serverInfo.AccessToken ?
                        `MediaBrowser Client="${client.appName()}", Device="${client.deviceName()}", DeviceId="${client.deviceId()}", Version="${client.appVersion()}", Token="${client._serverInfo.AccessToken}"` : ''
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // Plugin not installed or no ratings
                    return null;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const stats = await response.json();
            ratingsCache.set(itemId, stats);
            return stats;
        } catch (error) {
            console.warn('[Ratings] Failed to fetch stats:', error);
            return null;
        }
    }

    /**
     * Submit a rating
     */
    async function submitRating(itemId, rating) {
        const client = getApiClient();
        if (!client) return false;

        try {
            const url = client.getUrl(CONFIG.endpoints.rate.replace('{itemId}', itemId)) + `?rating=${rating}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-Emby-Authorization': `MediaBrowser Client="${client.appName()}", Device="${client.deviceName()}", DeviceId="${client.deviceId()}", Version="${client.appVersion()}", Token="${client._serverInfo.AccessToken}"`
                }
            });

            if (response.ok) {
                // Invalidate cache
                ratingsCache.delete(itemId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Ratings] Failed to submit rating:', error);
            return false;
        }
    }

    /**
     * Delete a rating
     */
    async function deleteRating(itemId) {
        const client = getApiClient();
        if (!client) return false;

        try {
            const url = client.getUrl(CONFIG.endpoints.delete.replace('{itemId}', itemId));
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'X-Emby-Authorization': `MediaBrowser Client="${client.appName()}", Device="${client.deviceName()}", DeviceId="${client.deviceId()}", Version="${client.appVersion()}", Token="${client._serverInfo.AccessToken}"`
                }
            });

            if (response.ok) {
                // Invalidate cache
                ratingsCache.delete(itemId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Ratings] Failed to delete rating:', error);
            return false;
        }
    }

    /**
     * Create rating component HTML
     */
    function createRatingComponent(itemId) {
        const container = document.createElement('div');
        container.className = 'custom-rating-container';
        container.setAttribute('data-item-id', itemId);

        // Stars container
        const starsContainer = document.createElement('div');
        starsContainer.className = 'custom-rating-stars';

        for (let i = 1; i <= CONFIG.maxRating; i++) {
            const star = document.createElement('button');
            star.className = 'custom-rating-star empty';
            star.setAttribute('data-rating', i);
            star.innerHTML = '\u2606'; // Empty star
            star.tabIndex = 0;

            star.addEventListener('click', () => handleStarClick(itemId, i));
            star.addEventListener('focus', () => handleStarFocus(i));
            star.addEventListener('blur', () => handleStarBlur());
            star.addEventListener('mouseenter', () => handleStarFocus(i));
            star.addEventListener('mouseleave', () => handleStarBlur());

            starsContainer.appendChild(star);
        }

        container.appendChild(starsContainer);

        // Stats container
        const statsContainer = document.createElement('div');
        statsContainer.className = 'custom-rating-stats';
        statsContainer.innerHTML = '<span class="custom-rating-loading">Loading ratings...</span>';
        container.appendChild(statsContainer);

        return container;
    }

    /**
     * Update rating display
     */
    function updateRatingDisplay(container, stats) {
        const stars = container.querySelectorAll('.custom-rating-star');
        const statsElement = container.querySelector('.custom-rating-stats');

        if (!stats) {
            statsElement.innerHTML = '<span class="custom-rating-error">Ratings plugin not available</span>';
            return;
        }

        const averageRating = stats.averageRating || 0;
        const totalRatings = stats.totalRatings || 0;
        const userRating = stats.userRating;

        currentUserRating = userRating;

        // Update stars
        stars.forEach((star, index) => {
            const rating = index + 1;
            star.classList.remove('empty', 'filled', 'user-rated', 'preview');

            if (previewRating !== null && rating <= previewRating) {
                star.classList.add('preview');
                star.innerHTML = '\u2605'; // Filled star
            } else if (userRating && rating <= userRating) {
                star.classList.add('user-rated');
                star.innerHTML = '\u2605'; // Filled star
            } else if (rating <= Math.round(averageRating)) {
                star.classList.add('filled');
                star.innerHTML = '\u2605'; // Filled star
            } else {
                star.classList.add('empty');
                star.innerHTML = '\u2606'; // Empty star
            }
        });

        // Update stats text
        let statsHtml = '';
        if (totalRatings > 0) {
            statsHtml = `
                <span class="custom-rating-average">${averageRating.toFixed(1)}</span>
                <span class="custom-rating-count">(${totalRatings} rating${totalRatings !== 1 ? 's' : ''})</span>
            `;
        } else {
            statsHtml = '<span class="custom-rating-count">No ratings yet</span>';
        }

        if (userRating) {
            statsHtml += `<span class="custom-rating-user">Your rating: <strong>${userRating}</strong></span>`;
        }

        statsElement.innerHTML = statsHtml;
    }

    /**
     * Handle star click
     */
    async function handleStarClick(itemId, rating) {
        const container = document.querySelector(`.custom-rating-container[data-item-id="${itemId}"]`);
        if (!container) return;

        // If clicking the same rating, delete it
        if (currentUserRating === rating) {
            const success = await deleteRating(itemId);
            if (success) {
                currentUserRating = null;
                const stats = await fetchRatingStats(itemId);
                updateRatingDisplay(container, stats);
            }
        } else {
            const success = await submitRating(itemId, rating);
            if (success) {
                currentUserRating = rating;
                const stats = await fetchRatingStats(itemId);
                updateRatingDisplay(container, stats);
            }
        }
    }

    /**
     * Handle star focus (preview)
     */
    function handleStarFocus(rating) {
        previewRating = rating;

        // Find container and update display
        const container = document.querySelector('.custom-rating-container');
        if (container) {
            const stars = container.querySelectorAll('.custom-rating-star');
            stars.forEach((star, index) => {
                if (index + 1 <= rating) {
                    star.classList.add('preview');
                    star.innerHTML = '\u2605';
                }
            });
        }
    }

    /**
     * Handle star blur
     */
    function handleStarBlur() {
        previewRating = null;

        // Find container and refresh display
        const container = document.querySelector('.custom-rating-container');
        if (container && currentItemId) {
            const stats = ratingsCache.get(currentItemId);
            if (stats) {
                updateRatingDisplay(container, stats);
            }
        }
    }

    /**
     * Inject rating component into detail page
     */
    async function injectRatingComponent(itemId) {
        if (!itemId) return;

        currentItemId = itemId;

        // Check if already injected
        const existing = document.querySelector('.custom-rating-container');
        if (existing) {
            if (existing.getAttribute('data-item-id') === itemId) {
                return; // Same item, already injected
            }
            existing.remove();
        }

        // Find injection point (after title or in detail section)
        const detailSection = document.querySelector('.detailPagePrimaryContainer, .detailSection, .itemDetailPage');
        if (!detailSection) {
            console.log('[Ratings] Detail section not found');
            return;
        }

        // Create and inject component
        const component = createRatingComponent(itemId);

        // Try to inject after the title
        const titleElement = detailSection.querySelector('.itemName, .itemDetailPageTitle');
        if (titleElement && titleElement.parentNode) {
            titleElement.parentNode.insertBefore(component, titleElement.nextSibling);
        } else {
            detailSection.insertBefore(component, detailSection.firstChild);
        }

        // Fetch and display stats
        const stats = await fetchRatingStats(itemId);
        updateRatingDisplay(component, stats);
    }

    /**
     * Extract item ID from URL
     */
    function getItemIdFromUrl() {
        const url = window.location.href;
        const match = url.match(/[?&]id=([^&]+)/);
        return match ? match[1] : null;
    }

    /**
     * Watch for page navigation
     */
    function watchNavigation() {
        // Watch for URL changes
        let lastUrl = window.location.href;

        const checkUrl = () => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                handlePageChange();
            }
        };

        // Check periodically
        setInterval(checkUrl, 500);

        // Also watch for hash changes
        window.addEventListener('hashchange', handlePageChange);
        window.addEventListener('popstate', handlePageChange);
    }

    /**
     * Handle page change
     */
    function handlePageChange() {
        const url = window.location.href;

        // Check if this is a detail page
        if (url.includes('/details') || url.includes('itemdetail')) {
            const itemId = getItemIdFromUrl();
            if (itemId) {
                // Delay to allow page to render
                setTimeout(() => injectRatingComponent(itemId), 500);
            }
        } else {
            currentItemId = null;
            currentUserRating = null;
        }
    }

    /**
     * Initialize
     */
    function init() {
        console.log('[Ratings] Initializing');

        // Watch for navigation
        watchNavigation();

        // Check current page
        handlePageChange();

        // Watch for DOM changes (for SPA navigation)
        const observer = new MutationObserver(function(mutations) {
            const hasDetailPage = document.querySelector('.detailPagePrimaryContainer, .detailSection, .itemDetailPage');
            const hasRatingComponent = document.querySelector('.custom-rating-container');

            if (hasDetailPage && !hasRatingComponent) {
                const itemId = getItemIdFromUrl();
                if (itemId && itemId !== currentItemId) {
                    injectRatingComponent(itemId);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Expose API
        window.JellyfinRatings = {
            fetchStats: fetchRatingStats,
            submitRating: submitRating,
            deleteRating: deleteRating,
            clearCache: () => ratingsCache.clear()
        };

        console.log('[Ratings] Initialization complete');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
