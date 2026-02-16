/**
 * Netflix-Style Card Focus Overlay for Jellyfin webOS
 * Adds animated overlays with title, rating, and progress on card focus
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        animationDuration: 200,
        marqueeDelay: 1000,
        maxTitleLength: 25
    };

    // Cache for rating data
    const ratingsCache = new Map();

    /**
     * Create overlay elements for a card
     */
    function createCardOverlay(card) {
        if (card.querySelector('.netflix-card-overlay')) {
            return; // Already has overlay
        }

        const overlay = document.createElement('div');
        overlay.className = 'netflix-card-overlay';

        const title = document.createElement('div');
        title.className = 'netflix-card-title';
        overlay.appendChild(title);

        const cardImageContainer = card.querySelector('.cardImageContainer');
        if (cardImageContainer) {
            cardImageContainer.appendChild(overlay);
        }
    }

    /**
     * Create rating badge for a card
     */
    function createRatingBadge(card, rating) {
        let badge = card.querySelector('.netflix-rating-badge');

        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'netflix-rating-badge';

            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = '\u2605'; // Star symbol
            badge.appendChild(star);

            const ratingText = document.createElement('span');
            ratingText.className = 'rating-text';
            badge.appendChild(ratingText);

            const cardImageContainer = card.querySelector('.cardImageContainer');
            if (cardImageContainer) {
                cardImageContainer.appendChild(badge);
            }
        }

        if (rating && rating > 0) {
            badge.querySelector('.rating-text').textContent = rating.toFixed(1);
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    }

    /**
     * Create progress bar for a card
     */
    function createProgressBar(card, progress) {
        if (progress === undefined || progress <= 0) {
            const existing = card.querySelector('.netflix-progress-bar');
            if (existing) existing.remove();
            return;
        }

        let progressBar = card.querySelector('.netflix-progress-bar');

        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'netflix-progress-bar';

            const progressFill = document.createElement('div');
            progressFill.className = 'progress';
            progressBar.appendChild(progressFill);

            const cardImageContainer = card.querySelector('.cardImageContainer');
            if (cardImageContainer) {
                cardImageContainer.appendChild(progressBar);
            }
        }

        progressBar.querySelector('.progress').style.width = `${Math.min(100, progress)}%`;
    }

    /**
     * Create watched/unplayed badge
     */
    function createWatchedBadge(card, userData) {
        // Remove existing badges
        const existingWatched = card.querySelector('.netflix-watched-badge');
        const existingUnplayed = card.querySelector('.netflix-unplayed-badge');
        if (existingWatched) existingWatched.remove();
        if (existingUnplayed) existingUnplayed.remove();

        if (!userData) return;

        const cardImageContainer = card.querySelector('.cardImageContainer');
        if (!cardImageContainer) return;

        if (userData.Played) {
            const watchedBadge = document.createElement('div');
            watchedBadge.className = 'netflix-watched-badge';
            watchedBadge.innerHTML = '\u2713'; // Checkmark
            cardImageContainer.appendChild(watchedBadge);
        } else if (userData.UnplayedItemCount && userData.UnplayedItemCount > 0) {
            const unplayedBadge = document.createElement('div');
            unplayedBadge.className = 'netflix-unplayed-badge';
            unplayedBadge.textContent = userData.UnplayedItemCount;
            cardImageContainer.appendChild(unplayedBadge);
        }
    }

    /**
     * Update card overlay with item data
     */
    function updateCardOverlay(card, itemData) {
        const overlay = card.querySelector('.netflix-card-overlay');
        if (!overlay) return;

        const titleElement = overlay.querySelector('.netflix-card-title');
        if (titleElement && itemData) {
            const title = itemData.Name || '';
            titleElement.textContent = title;

            // Add marquee class for long titles
            if (title.length > CONFIG.maxTitleLength) {
                titleElement.classList.add('marquee');
            } else {
                titleElement.classList.remove('marquee');
            }
        }

        // Update rating badge
        if (itemData && itemData.CommunityRating) {
            createRatingBadge(card, itemData.CommunityRating);
        }

        // Update progress bar
        if (itemData && itemData.UserData) {
            const playedPercentage = itemData.UserData.PlayedPercentage;
            createProgressBar(card, playedPercentage);
            createWatchedBadge(card, itemData.UserData);
        }
    }

    /**
     * Extract item data from card element
     */
    function getItemDataFromCard(card) {
        // Try to get data from data attributes
        const itemId = card.getAttribute('data-id') ||
                       card.getAttribute('data-itemid') ||
                       card.querySelector('[data-id]')?.getAttribute('data-id');

        // Try to get title from existing elements
        const cardText = card.querySelector('.cardText');
        const name = cardText ? cardText.textContent : '';

        // Try to get progress from indicator
        const progressIndicator = card.querySelector('.cardProgress, .itemProgressBarForeground');
        let progress = 0;
        if (progressIndicator) {
            const width = progressIndicator.style.width;
            if (width) {
                progress = parseFloat(width);
            }
        }

        return {
            Id: itemId,
            Name: name,
            UserData: {
                PlayedPercentage: progress
            }
        };
    }

    /**
     * Handle card focus
     */
    function handleCardFocus(event) {
        const card = event.target.closest('.card');
        if (!card) return;

        // Ensure overlay exists
        createCardOverlay(card);

        // Get item data and update overlay
        const itemData = getItemDataFromCard(card);
        updateCardOverlay(card, itemData);

        // Add focused class
        card.classList.add('focused');
    }

    /**
     * Handle card blur
     */
    function handleCardBlur(event) {
        const card = event.target.closest('.card');
        if (!card) return;

        card.classList.remove('focused');
    }

    /**
     * Process all cards on the page
     */
    function processCards() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            if (!card.hasAttribute('data-netflix-processed')) {
                createCardOverlay(card);
                card.setAttribute('data-netflix-processed', 'true');

                // Add focus/blur listeners
                card.addEventListener('focus', handleCardFocus, true);
                card.addEventListener('blur', handleCardBlur, true);
                card.addEventListener('mouseenter', handleCardFocus);
                card.addEventListener('mouseleave', handleCardBlur);
            }
        });
    }

    /**
     * Initialize card enhancements
     */
    function init() {
        console.log('[NetflixCards] Initializing');

        // Process existing cards
        processCards();

        // Watch for new cards
        const observer = new MutationObserver(function(mutations) {
            let hasNewCards = false;
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.classList && node.classList.contains('card')) {
                            hasNewCards = true;
                        } else if (node.querySelector && node.querySelector('.card')) {
                            hasNewCards = true;
                        }
                    });
                }
            });

            if (hasNewCards) {
                // Debounce processing
                clearTimeout(window._netflixCardsTimeout);
                window._netflixCardsTimeout = setTimeout(processCards, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[NetflixCards] Initialization complete');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose API
    window.NetflixCards = {
        processCards: processCards,
        updateCardOverlay: updateCardOverlay
    };
})();
