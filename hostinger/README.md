# Frontend on Hostinger (test.civilsansad.com)

The website (this React app) is uploaded to Hostinger. The API, database and uploaded images stay on the VPS at
`https://testapi.civilsansad.com` (see `.env.hostinger`).

## Build

```bash
cd frontend
npm install          # first time only
npm run build:hostinger
```

This creates the folder **`dist-hostinger/`** with `index.html`, `assets/`, logos and a ready `.htaccess`
(HTTPS redirect, page refresh on any route, images loaded from the API server).
The normal `npm run build` (used on the VPS for test.ganpura.in) is not affected.

## Upload

1. Hostinger → File Manager → the folder of `test.civilsansad.com`.
2. Delete the old files there (keep nothing from a previous build).
3. Upload **everything inside** `dist-hostinger/` (not the folder itself) - zip it and use *Extract* if easier.
4. Make sure the hidden file `.htaccess` is there (File Manager → settings → show hidden files).

Re-build and re-upload after every frontend change. No server restart is needed.

## Changing the API address

Edit `VITE_API_BASE_URL` in `frontend/.env.hostinger` and build again. The API must be on a subdomain of the
same main domain as the website (e.g. `testapi.civilsansad.com` for `test.civilsansad.com`), and the VPS `.env`
must contain `COOKIE_DOMAIN=civilsansad.com` and the website in `CORS_ORIGINS` - otherwise login will not work.
