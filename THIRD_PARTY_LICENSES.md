# Third-Party Licenses

This project includes code from the following third-party projects:

---

## Original Jellyfin webOS Client

**Source:** https://github.com/jellyfin/jellyfin-webos
**License:** Mozilla Public License 2.0 (MPL-2.0)
**Copyright:** Jellyfin Contributors

This project is a fork of the official Jellyfin webOS client.

---

## SubtitlesOctopus (JavascriptSubtitlesOctopus)

**Source:** https://github.com/libass/JavascriptSubtitlesOctopus
**License:** LGPL-2.1-or-later (library), MIT (wrapper code)
**Copyright:** 2017-2024 JavascriptSubtitlesOctopus contributors

Files included:
- `frontend/custom/lib/subtitles-octopus.js`
- `frontend/custom/lib/subtitles-octopus-worker.js`
- `frontend/custom/lib/subtitles-octopus-worker.wasm`
- `frontend/custom/lib/subtitles-octopus-worker-legacy.js`
- `frontend/custom/lib/COPYRIGHT`

SubtitlesOctopus includes the following bundled libraries:

### libass
**License:** ISC License
**Copyright:** libass contributors

### FreeType
**License:** FreeType License (FTL) or GPLv2
**Copyright:** 2006-2022 David Turner, Robert Wilhelm, and Werner Lemberg

### HarfBuzz
**License:** MIT License
**Copyright:** 2010-2022 Google, Inc.

### Fribidi
**License:** LGPL-2.1+
**Copyright:** 2004-2019 Behdad Esfahbod

### Brotli
**License:** MIT License
**Copyright:** 2013-2018 Google Inc.

### Expat (libexpat)
**License:** MIT License
**Copyright:** 1997-2000 Thai Open Source Software Center Ltd

Full copyright notices for all bundled libraries are available in:
`frontend/custom/lib/COPYRIGHT`

---

## webOSTV.js

**Source:** LG Electronics
**License:** Apache License 2.0
**Copyright:** LG Electronics, Inc.

Files included:
- `frontend/webOSTVjs-1.2.11/webOSTV.js`
- `frontend/webOSTVjs-1.2.11/webOSTV-dev.js`

---

## License Compatibility

This project combines code under the following licenses:
- **MPL-2.0** (Mozilla Public License 2.0) - Main project code
- **LGPL-2.1** (GNU Lesser General Public License) - SubtitlesOctopus library
- **MIT/Expat** - Various bundled libraries
- **Apache-2.0** - webOSTV.js
- **FTL** (FreeType License) - FreeType library

All licenses are compatible for distribution. The LGPL-2.1 components are distributed as separate library files and can be replaced by the user.

---

## Your Rights

Under the MPL-2.0 license, you have the right to:
- Use this software for any purpose
- Modify the source code
- Distribute copies
- Distribute modified versions

If you modify any MPL-2.0 licensed files, you must:
- Make your modifications available under MPL-2.0
- Include copyright notices

The LGPL-2.1 licensed SubtitlesOctopus library allows you to:
- Use the library in proprietary software
- Link against the library
- Distribute the library

If you modify the LGPL library itself, you must:
- Release your modifications under LGPL
- Provide source code for your modifications

---

## Attribution

When redistributing this software, please include:
1. This THIRD_PARTY_LICENSES.md file
2. The original LICENSE file
3. The frontend/custom/lib/COPYRIGHT file
