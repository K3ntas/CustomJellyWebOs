# Jellyfin Netflix webOS

A custom Jellyfin client for LG webOS TVs with Netflix-style UI, full ASS/SSA subtitle support, and more.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![webOS](https://img.shields.io/badge/webOS-3.0%2B-green)
![License](https://img.shields.io/badge/license-MPL--2.0-orange)

## Features

### ASS/SSA Subtitle Support
Full styling support for anime and other content with styled subtitles - no server transcoding needed!
- Uses [SubtitlesOctopus](https://github.com/libass/JavascriptSubtitlesOctopus) (libass WebAssembly)
- Preserves fonts, colors, positioning, and animations
- Canvas overlay rendering for best quality

### Netflix-Style Card Focus
Smooth, beautiful card animations when browsing:
- Scale animation on focus (1.1x)
- Dark gradient overlay with title
- Rating badge display
- Watch progress indicator
- Watched/Unplayed badges

### Custom TV Keyboard
No more system keyboard covering the screen:
- Grid-based QWERTY layout
- Full D-pad remote navigation
- Netflix-style red focus highlight
- Real-time search with results grid
- 300ms debounce for smooth typing

### Ratings Plugin Integration
Rate your content directly from detail screens:
- 10-star interactive rating system
- Hover preview as you navigate
- Community average and count display
- Requires [Jellyfin Ratings Plugin](https://github.com/user/jellyfin-ratings-plugin) on server

## Screenshots

*Coming soon*

## Installation

### Quick Install

1. Download the latest IPK from [Releases](https://github.com/user/CustomJellyWebOs/releases)
2. Enable Developer Mode on your LG TV
3. Install via ares-cli:

```bash
npm install -g @webosose/ares-cli
ares-setup-device
ares-novacom --device tv --getkey
ares-install -d tv org.jellyfin.webos.netflix_2.0.0_all.ipk
```

See [INSTALL.md](INSTALL.md) for detailed instructions.

### Build from Source

```bash
git clone https://github.com/user/CustomJellyWebOs.git
cd CustomJellyWebOs
npm install
npm run package
```

## Requirements

- **TV**: LG webOS 3.0+ (2016 or newer)
- **Server**: Jellyfin 10.8.0+
- **Optional**: Jellyfin Ratings Plugin for rating feature

## Configuration

Features can be toggled in the injected configuration:

```javascript
window.JellyfinNetflixConfig = {
    enableNetflixCards: true,      // Card focus overlays
    enableTVKeyboard: true,        // Custom search keyboard
    enableRatings: true,           // Ratings plugin support
    enableSubtitlesOctopus: true,  // ASS/SSA subtitles
    debug: false                   // Debug logging
};
```

## Project Structure

```
frontend/
├── custom/
│   ├── css/           # Custom stylesheets
│   ├── js/            # Feature modules
│   ├── lib/           # SubtitlesOctopus library
│   └── fonts/         # Custom fonts (optional)
├── js/                # Core webOS adapter
└── css/               # Core styles
```

## Documentation

- [Installation Guide](INSTALL.md)
- [Custom Changes](CUSTOM_CHANGES.md)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Credits

- [Jellyfin](https://jellyfin.org/) - The original media server
- [jellyfin-webos](https://github.com/jellyfin/jellyfin-webos) - Original webOS client
- [SubtitlesOctopus](https://github.com/libass/JavascriptSubtitlesOctopus) - ASS subtitle rendering
- [webOS Homebrew](https://www.webosbrew.org/) - webOS development community

## License

This project is licensed under the MPL-2.0 License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This is an unofficial fork. For the official Jellyfin webOS client, visit [jellyfin/jellyfin-webos](https://github.com/jellyfin/jellyfin-webos).
