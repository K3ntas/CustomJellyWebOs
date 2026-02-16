# Jellyfin webOS Netflix - Custom Modifications

This document describes all custom modifications made to the original Jellyfin webOS client.

---

## 1. SubtitlesOctopus Integration (ASS/SSA Subtitles)

**Version:** v2.0.0

### Description
Integrated JavascriptSubtitlesOctopus (libass-wasm) for full ASS/SSA subtitle rendering with complete styling support. This enables anime and other content with styled subtitles to display correctly without server-side transcoding.

### Features
- Full ASS/SSA subtitle format support
- Preserves all styling: fonts, colors, positioning, animations
- WebAssembly-based rendering for good performance
- Canvas overlay above video element
- Automatic subtitle track detection
- Fallback to standard subtitles for non-ASS formats

### Technical Details
- Uses libass compiled to WebAssembly
- Renders subtitles on a canvas element overlaid on the video
- Worker-based rendering to avoid UI blocking
- Configurable rendering modes: wasm-blend, js-blend, lossy

### New Files Created
```
frontend/custom/lib/
├── subtitles-octopus.js           # Main library
├── subtitles-octopus-worker.js    # Web Worker
├── subtitles-octopus-worker.wasm  # WebAssembly binary
└── subtitles-octopus-worker-legacy.js  # Fallback for older browsers

frontend/custom/js/
└── subtitles-octopus-integration.js  # Jellyfin integration

frontend/custom/css/
└── subtitles.css                  # Subtitle overlay styles
```

---

## 2. Netflix-Style Card Focus Overlay

**Version:** v2.0.0

### Description
Replaced the default card focus behavior with a Netflix-style overlay that displays the title, rating badge, and progress bar when a card is focused.

### Features
- Smooth scale animation on focus (1.1x scale)
- Dark gradient overlay with title text
- Rating badge (top-left) showing community rating
- Progress bar (bottom) showing watch progress
- Watched checkmark or unplayed count badge
- Marquee animation for long titles
- Red focus ring for accessibility

### Visual Guide
- **Focus state**: Card scales up, overlay fades in (200ms)
- **Blur state**: Card returns to normal, overlay fades out (150ms)
- **Gradient**: Bottom-to-top dark gradient for text readability
- **Title**: White text, centered, with ellipsis for overflow

### Files Created
```
frontend/custom/js/
└── netflix-cards.js               # Card enhancement logic

frontend/custom/css/
└── netflix-cards.css              # Card styling
```

---

## 3. Custom TV Keyboard for Search

**Version:** v2.0.0

### Description
Added a custom search overlay with a TV-optimized grid keyboard, replacing the system keyboard that covers the screen.

### Features
- **Split-screen layout**: Keyboard on left, results on right
- **Grid-based QWERTY keyboard**: 4 rows of letters + special keys
- **D-pad navigation**: Full support for TV remote navigation
- **Netflix-style red focus**: Highlighted keys match Netflix aesthetic
- **Real-time search**: 300ms debounce, filters to Movies/Series
- **Visual results**: Poster thumbnails with type badges

### Keyboard Layout
```
[ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][ 0 ]
[ Q ][ W ][ E ][ R ][ T ][ Y ][ U ][ I ][ O ][ P ]
  [ A ][ S ][ D ][ F ][ G ][ H ][ J ][ K ][ L ]
    [ Z ][ X ][ C ][ V ][ B ][ N ][ M ]
[ DEL ]      [ SPACE ]        [ CLEAR ]
```

### Navigation
- Arrow keys / D-pad: Navigate between keys
- Enter / OK: Press focused key or select result
- Back button: Close search overlay
- S key: Open search (global hotkey)

### Files Created
```
frontend/custom/js/
└── tv-keyboard.js                 # Keyboard logic

frontend/custom/css/
└── tv-keyboard.css                # Keyboard styling
```

---

## 4. Custom Ratings Plugin Integration

**Version:** v2.0.0

### Description
Integrated support for the Jellyfin Ratings Plugin, allowing users to rate content (1-10 scale) directly from detail screens.

### Features
- **10-star interactive rating**: Click/select to rate
- **Hover preview**: Shows rating preview as you navigate
- **Delete by re-clicking**: Click same rating again to remove
- **Community statistics**: Shows average rating and total count
- **User rating display**: Shows your current rating if rated
- **D-pad navigation**: Navigate between stars with remote

### Visual Guide
- **Empty stars (gray)**: No rating / unselected
- **Filled stars (muted gold)**: Community average rating
- **Bright gold stars**: Your rating or hover preview
- **Stats text**: "8.5 (123 ratings)" format

### API Endpoints Used
- `GET /Ratings/Items/{itemId}/Stats` - Get rating statistics
- `POST /Ratings/Items/{itemId}/Rating?rating=N` - Submit rating (1-10)
- `DELETE /Ratings/Items/{itemId}/Rating` - Delete your rating

### Requirements
- Jellyfin Ratings Plugin must be installed on the server
- Plugin repository: https://github.com/your-server/jellyfin-ratings-plugin

### Files Created
```
frontend/custom/js/
└── ratings.js                     # Ratings integration

frontend/custom/css/
└── ratings.css                    # Rating component styles
```

---

## 5. Enhanced webOS Adapter

### Description
Modified the webOS adapter to support the new features and improve device profile for better playback.

### Changes Made
- Updated version to 2.0.0
- Enhanced device profile with ASS subtitle support flag
- Added logging for custom feature injection

### Files Modified
- `frontend/js/webOS.js` - Version bump, logging
- `frontend/js/index.js` - Custom file injection

---

## Project Structure

```
frontend/
├── custom/
│   ├── css/
│   │   ├── netflix-cards.css      # Card focus overlays
│   │   ├── tv-keyboard.css        # Search keyboard
│   │   ├── ratings.css            # Rating component
│   │   └── subtitles.css          # Subtitle overlay
│   ├── js/
│   │   ├── netflix-cards.js       # Card enhancements
│   │   ├── tv-keyboard.js         # Custom keyboard
│   │   ├── ratings.js             # Ratings plugin
│   │   ├── subtitles-octopus-integration.js  # ASS subtitles
│   │   └── main.js                # Feature loader (optional)
│   ├── lib/
│   │   ├── subtitles-octopus.js
│   │   ├── subtitles-octopus-worker.js
│   │   ├── subtitles-octopus-worker.wasm
│   │   └── subtitles-octopus-worker-legacy.js
│   └── fonts/                     # Custom fonts (optional)
├── js/
│   ├── index.js                   # Modified: loads custom files
│   └── webOS.js                   # Modified: version bump
└── appinfo.json                   # Modified: new app ID/version
```

---

## Dependencies Added

### npm packages
- `libass-wasm`: ^4.1.0 - SubtitlesOctopus WebAssembly library

---

## Build Instructions

```bash
# Install dependencies
npm install

# Build the IPK package
npm run package

# The output will be in build/ directory
```

---

## Configuration

Features can be enabled/disabled by modifying `window.JellyfinNetflixConfig` in the injected code:

```javascript
window.JellyfinNetflixConfig = {
    enableNetflixCards: true,      // Card focus overlays
    enableTVKeyboard: true,        // Custom search keyboard
    enableRatings: true,           // Ratings plugin support
    enableSubtitlesOctopus: true,  // ASS/SSA subtitles
    debug: false                   // Debug logging
};
```

---

## Compatibility

- **webOS Version**: 3.0+ (2016 TVs and newer)
- **Jellyfin Server**: 10.8.0+
- **Required Plugins**: Jellyfin Ratings Plugin (optional, for ratings feature)

---

## Known Limitations

1. **ASS Subtitles**: Some very complex ASS effects may not render perfectly
2. **HEVC in browser**: webOS browser may still transcode HEVC even with hardware support
3. **Ratings Plugin**: Requires server-side plugin installation
4. **Memory**: Older TVs may struggle with very long subtitle files
