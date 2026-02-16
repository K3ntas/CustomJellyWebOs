/**
 * Jellyfin webOS Netflix - Main Entry Point
 * Loads all custom features and integrations
 */

(function() {
    'use strict';

    console.log('[JellyfinNetflix] Initializing custom features...');

    // Feature flags - can be configured
    window.JellyfinNetflixConfig = {
        enableNetflixCards: true,
        enableTVKeyboard: true,
        enableRatings: true,
        enableSubtitlesOctopus: true,
        debug: false
    };

    /**
     * Load CSS dynamically
     */
    function loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    /**
     * Load JavaScript dynamically
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize all features
     */
    async function initFeatures() {
        const config = window.JellyfinNetflixConfig;
        const basePath = getBasePath();

        try {
            // Load CSS files
            const cssFiles = [
                'custom/css/netflix-cards.css',
                'custom/css/tv-keyboard.css',
                'custom/css/ratings.css',
                'custom/css/subtitles.css'
            ];

            for (const css of cssFiles) {
                try {
                    await loadCSS(basePath + css);
                    console.log(`[JellyfinNetflix] Loaded CSS: ${css}`);
                } catch (e) {
                    console.warn(`[JellyfinNetflix] Failed to load CSS: ${css}`, e);
                }
            }

            // Load SubtitlesOctopus library first (if enabled)
            if (config.enableSubtitlesOctopus) {
                try {
                    await loadScript(basePath + 'custom/lib/subtitles-octopus.js');
                    console.log('[JellyfinNetflix] Loaded SubtitlesOctopus library');
                } catch (e) {
                    console.warn('[JellyfinNetflix] Failed to load SubtitlesOctopus library', e);
                }
            }

            // Load JavaScript modules
            const jsModules = [];

            if (config.enableNetflixCards) {
                jsModules.push('custom/js/netflix-cards.js');
            }
            if (config.enableTVKeyboard) {
                jsModules.push('custom/js/tv-keyboard.js');
            }
            if (config.enableRatings) {
                jsModules.push('custom/js/ratings.js');
            }
            if (config.enableSubtitlesOctopus) {
                jsModules.push('custom/js/subtitles-octopus-integration.js');
            }

            for (const js of jsModules) {
                try {
                    await loadScript(basePath + js);
                    console.log(`[JellyfinNetflix] Loaded module: ${js}`);
                } catch (e) {
                    console.warn(`[JellyfinNetflix] Failed to load module: ${js}`, e);
                }
            }

            console.log('[JellyfinNetflix] All features loaded successfully');

        } catch (error) {
            console.error('[JellyfinNetflix] Error initializing features:', error);
        }
    }

    /**
     * Get base path for loading resources
     */
    function getBasePath() {
        // Try to find our base path
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            if (script.src && script.src.includes('custom/js/main.js')) {
                return script.src.replace('custom/js/main.js', '');
            }
        }

        // Fallback - try to get from parent frame
        try {
            if (window.parent !== window) {
                return '';
            }
        } catch (e) {}

        return '';
    }

    /**
     * Apply global styling fixes
     */
    function applyGlobalStyles() {
        // Force dark theme
        document.documentElement.style.setProperty('--theme-background', '#141414');
        document.body.style.backgroundColor = '#141414';

        // Add Netflix class for styling hooks
        document.body.classList.add('jellyfin-netflix');
    }

    /**
     * Setup global error handler
     */
    function setupErrorHandler() {
        window.addEventListener('error', function(event) {
            if (window.JellyfinNetflixConfig.debug) {
                console.error('[JellyfinNetflix] Global error:', event.error);
            }
        });
    }

    // Initialize when DOM is ready
    function onReady() {
        console.log('[JellyfinNetflix] DOM ready, starting initialization');
        applyGlobalStyles();
        setupErrorHandler();
        initFeatures();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }

    // Expose version info
    window.JellyfinNetflixVersion = '2.0.0';

})();
