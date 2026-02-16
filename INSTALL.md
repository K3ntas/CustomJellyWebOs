# Installation Guide - Jellyfin Netflix webOS

This guide explains how to install the custom Jellyfin Netflix client on your LG webOS TV.

---

## Prerequisites

1. **LG webOS TV** (2016 or newer, webOS 3.0+)
2. **LG Developer Account** - [Register here](https://webostv.developer.lge.com/)
3. **Developer Mode enabled on TV**
4. **Node.js** installed on your computer (for building)

---

## Method 1: Install Pre-built IPK (Easiest)

### Step 1: Download the IPK
Download the latest release from the [Releases page](https://github.com/user/CustomJellyWebOs/releases).

### Step 2: Enable Developer Mode on TV
1. Open the **LG Content Store** on your TV
2. Search for **"Developer Mode"**
3. Install and open the **Developer Mode** app
4. Sign in with your LG Developer Account
5. Turn on **Dev Mode Status**
6. Turn on **Key Server**
7. Note the **passphrase** displayed

### Step 3: Install via Command Line

```bash
# Install ares-cli tools
npm install -g @webosose/ares-cli

# Add your TV (replace IP with your TV's IP address)
ares-setup-device --add tv --info "{'host':'192.168.1.XXX', 'port':'9922', 'username':'prisoner'}"

# Get the SSH key (TV must have Key Server enabled)
ares-novacom --device tv --getkey

# Verify connection
ares-device-info -d tv

# Install the IPK
ares-install -d tv org.jellyfin.webos.netflix_2.0.0_all.ipk
```

### Step 4: Launch the App
- Find **"Jellyfin Netflix"** in your TV's app list
- Or launch via command: `ares-launch -d tv org.jellyfin.webos.netflix`

---

## Method 2: Build from Source

### Step 1: Clone the Repository
```bash
git clone https://github.com/user/CustomJellyWebOs.git
cd CustomJellyWebOs
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build the IPK
```bash
npm run package
```

The IPK file will be created in the `build/` directory.

### Step 4: Install on TV
Follow Steps 2-4 from Method 1 above, using your built IPK file.

---

## Method 3: Using Homebrew Channel (Rooted TVs)

If your TV is rooted with [webOS Homebrew](https://www.webosbrew.org/):

1. Open **Homebrew Channel** on your TV
2. Go to **Settings** > **Repository**
3. Add custom repository (if available)
4. Or manually install the IPK via SSH

---

## Method 4: Docker Build Environment

```bash
# Using the official webOS SDK Docker image
docker run -it --rm \
  -v $(pwd):/app \
  ghcr.io/nicholaschum/docker-lg-webos-sdk:latest \
  bash -c "cd /app && npm install && npm run package"
```

---

## Troubleshooting

### "Developer Mode expires"
Developer Mode on non-rooted TVs expires after 50 hours. You need to:
1. Reopen Developer Mode app on TV
2. Extend the session
3. Re-install your app if it was removed

### "Cannot connect to TV"
1. Make sure TV and computer are on the same network
2. Check that Developer Mode and Key Server are ON
3. Try `ares-novacom --device tv --getkey` again

### "App crashes on launch"
1. Check your Jellyfin server is accessible from TV's network
2. Try the official Jellyfin webOS client first to verify server connectivity
3. Check TV logs: `ares-log -d tv org.jellyfin.webos.netflix`

### "Subtitles don't render"
1. Subtitles work only for ASS/SSA formats
2. Make sure the subtitle file is accessible (not embedded in MKV)
3. Check browser console for errors

---

## Uninstallation

```bash
# Via command line
ares-install -d tv --remove org.jellyfin.webos.netflix

# Or manually from TV:
# Settings > Apps > Jellyfin Netflix > Uninstall
```

---

## Updating

1. Download the new IPK from Releases
2. Run the install command - it will replace the existing app:
```bash
ares-install -d tv org.jellyfin.webos.netflix_X.X.X_all.ipk
```

---

## FAQ

**Q: Will this work alongside the official Jellyfin app?**
A: Yes! This is a separate app with a different ID (`org.jellyfin.webos.netflix`).

**Q: Do I need to root my TV?**
A: No, Developer Mode is sufficient. However, you'll need to renew it every 50 hours.

**Q: Does this support 4K/HDR?**
A: Yes, it uses the same video capabilities as your TV's browser supports.

**Q: Why aren't my styled subtitles showing?**
A: The subtitle file must be ASS/SSA format. SRT and VTT use the standard renderer.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/user/CustomJellyWebOs/issues)
- **Jellyfin Discord**: #webos channel

---

## License

MPL-2.0 - Same as the original Jellyfin webOS client.
