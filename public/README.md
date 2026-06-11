# public/

## Purpose
Static assets served directly at the root URL (`/`).
Everything here is publicly accessible without authentication.

## Files

| File / Folder | Description |
|---|---|
| `manifest.json` | PWA Web App Manifest — defines the app name, icons, colors, and install behavior |
| `sw.js` | Service Worker — handles offline caching strategy |
| `icons/` | App icons in different sizes for PWA install prompts and home screen |
| `icons/icon-192.png` | 192×192 icon for Android home screen and install prompt |
| `icons/icon-512.png` | 512×512 icon for splash screen and high-density displays |

## Caching Strategy (sw.js)

| Route Type | Strategy |
|---|---|
| `/api/*` | **Network-first** — always try to fetch fresh data, fall back to offline error |
| All other routes | **Cache-first** — serve from cache if available, fetch and cache otherwise |

## Notes
- `sw.js` must be served from the root (`/sw.js`) so it can control the full app scope.
- The `Service-Worker-Allowed: /` header is set in `next.config.mjs` to allow this.
- Icons are used by both Android (Chrome install) and iOS (Safari Add to Home Screen).
- Cache version is set as a constant inside `sw.js`. **Bump the version string (`work-clock-vX`) after any significant deployment** to force cache refresh on all users' devices.
