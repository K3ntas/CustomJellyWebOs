/**
 * SubtitlesOctopus Integration for Jellyfin webOS
 * Renders ASS/SSA subtitles with full styling support
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        workerUrl: 'custom/lib/subtitles-octopus-worker.js',
        legacyWorkerUrl: 'custom/lib/subtitles-octopus-worker-legacy.js',
        wasmUrl: 'custom/lib/subtitles-octopus-worker.wasm',
        fallbackFont: 'custom/fonts/default.woff2',
        debug: false
    };

    // State
    let octopusInstance = null;
    let currentVideo = null;
    let currentSubtitleUrl = null;
    let isInitialized = false;

    /**
     * Initialize SubtitlesOctopus for a video element
     */
    function initSubtitles(video, subtitleUrl, options = {}) {
        if (!video || !subtitleUrl) {
            console.warn('[SubtitlesOctopus] Missing video or subtitle URL');
            return null;
        }

        // Destroy existing instance
        destroySubtitles();

        currentVideo = video;
        currentSubtitleUrl = subtitleUrl;

        const isASS = subtitleUrl.toLowerCase().includes('.ass') ||
                      subtitleUrl.toLowerCase().includes('.ssa');

        if (!isASS) {
            console.log('[SubtitlesOctopus] Not an ASS/SSA subtitle, skipping');
            return null;
        }

        console.log('[SubtitlesOctopus] Initializing for:', subtitleUrl);

        try {
            // Check if SubtitlesOctopus is available
            if (typeof SubtitlesOctopus === 'undefined') {
                console.error('[SubtitlesOctopus] Library not loaded');
                return null;
            }

            octopusInstance = new SubtitlesOctopus({
                video: video,
                subUrl: subtitleUrl,
                workerUrl: CONFIG.workerUrl,
                legacyWorkerUrl: CONFIG.legacyWorkerUrl,
                // Font configuration
                fonts: options.fonts || [],
                availableFonts: options.availableFonts || {},
                fallbackFont: options.fallbackFont || CONFIG.fallbackFont,
                // Rendering options
                renderMode: options.renderMode || 'wasm-blend', // wasm-blend, js-blend, or lossy
                targetFps: options.targetFps || 30,
                prescaleFactor: options.prescaleFactor || 1.0,
                prescaleHeightLimit: options.prescaleHeightLimit || 1080,
                maxRenderHeight: options.maxRenderHeight || 1080,
                // Callbacks
                onReady: function() {
                    console.log('[SubtitlesOctopus] Ready');
                    isInitialized = true;
                    showRenderingIndicator(true);
                },
                onError: function(error) {
                    console.error('[SubtitlesOctopus] Error:', error);
                    showRenderingIndicator(false);
                },
                debug: CONFIG.debug
            });

            return octopusInstance;
        } catch (error) {
            console.error('[SubtitlesOctopus] Failed to initialize:', error);
            return null;
        }
    }

    /**
     * Destroy current SubtitlesOctopus instance
     */
    function destroySubtitles() {
        if (octopusInstance) {
            try {
                octopusInstance.dispose();
            } catch (e) {
                console.warn('[SubtitlesOctopus] Error disposing:', e);
            }
            octopusInstance = null;
        }
        currentVideo = null;
        currentSubtitleUrl = null;
        isInitialized = false;
        showRenderingIndicator(false);
    }

    /**
     * Set subtitle track by URL
     */
    function setSubtitleTrack(subtitleUrl) {
        if (!octopusInstance) {
            console.warn('[SubtitlesOctopus] No instance to set track');
            return;
        }

        if (subtitleUrl) {
            octopusInstance.setTrackByUrl(subtitleUrl);
            currentSubtitleUrl = subtitleUrl;
        } else {
            octopusInstance.freeTrack();
            currentSubtitleUrl = null;
        }
    }

    /**
     * Set subtitle visibility
     */
    function setSubtitleVisibility(visible) {
        if (!octopusInstance) return;

        if (visible) {
            octopusInstance.canvas.style.display = '';
        } else {
            octopusInstance.canvas.style.display = 'none';
        }
    }

    /**
     * Resize subtitles (call when video size changes)
     */
    function resizeSubtitles() {
        if (octopusInstance && octopusInstance.resize) {
            octopusInstance.resize();
        }
    }

    /**
     * Show/hide ASS rendering indicator
     */
    function showRenderingIndicator(show) {
        let indicator = document.querySelector('.ass-rendering-indicator');

        if (!indicator && show) {
            indicator = document.createElement('div');
            indicator.className = 'ass-rendering-indicator';
            indicator.textContent = 'ASS';

            const videoContainer = document.querySelector('.videoPlayerContainer');
            if (videoContainer) {
                videoContainer.appendChild(indicator);
            }
        }

        if (indicator) {
            if (show) {
                indicator.classList.add('visible');
                // Auto-hide after 3 seconds
                setTimeout(() => {
                    indicator.classList.remove('visible');
                }, 3000);
            } else {
                indicator.classList.remove('visible');
            }
        }
    }

    /**
     * Check if a subtitle format is ASS/SSA
     */
    function isASSFormat(format) {
        if (!format) return false;
        const lowerFormat = format.toLowerCase();
        return lowerFormat === 'ass' || lowerFormat === 'ssa';
    }

    /**
     * Get subtitle URL from Jellyfin stream info
     */
    function getSubtitleUrl(apiClient, itemId, mediaSourceId, subtitleStreamIndex) {
        if (!apiClient || !itemId || subtitleStreamIndex === undefined || subtitleStreamIndex < 0) {
            return null;
        }

        const serverUrl = apiClient.serverAddress();
        const params = new URLSearchParams({
            api_key: apiClient.accessToken()
        });

        if (mediaSourceId) {
            params.append('MediaSourceId', mediaSourceId);
        }

        return `${serverUrl}/Videos/${itemId}/${mediaSourceId}/Subtitles/${subtitleStreamIndex}/Stream.ass?${params.toString()}`;
    }

    /**
     * Hook into Jellyfin's video player
     */
    function hookVideoPlayer() {
        // Watch for video element creation
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.tagName === 'VIDEO') {
                        handleVideoElement(node);
                    } else if (node.querySelector) {
                        const video = node.querySelector('video');
                        if (video) {
                            handleVideoElement(video);
                        }
                    }
                });

                mutation.removedNodes.forEach(function(node) {
                    if (node.tagName === 'VIDEO' || (node.querySelector && node.querySelector('video'))) {
                        destroySubtitles();
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also check for existing video
        const existingVideo = document.querySelector('video');
        if (existingVideo) {
            handleVideoElement(existingVideo);
        }
    }

    /**
     * Handle video element
     */
    function handleVideoElement(video) {
        console.log('[SubtitlesOctopus] Video element detected');

        // Listen for resize
        video.addEventListener('loadedmetadata', resizeSubtitles);
        window.addEventListener('resize', resizeSubtitles);

        // Clean up on video end/removal
        video.addEventListener('ended', destroySubtitles);
    }

    /**
     * Initialize the integration
     */
    function init() {
        console.log('[SubtitlesOctopus] Initializing integration');

        // Hook into video player
        hookVideoPlayer();

        // Expose API globally
        window.JellyfinSubtitles = {
            init: initSubtitles,
            destroy: destroySubtitles,
            setTrack: setSubtitleTrack,
            setVisibility: setSubtitleVisibility,
            resize: resizeSubtitles,
            isASSFormat: isASSFormat,
            getSubtitleUrl: getSubtitleUrl,
            getInstance: function() { return octopusInstance; },
            isInitialized: function() { return isInitialized; }
        };

        console.log('[SubtitlesOctopus] Integration ready');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
