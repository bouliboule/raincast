# Raincast

> Données : Météo-France. Projet personnel, non affilié à Météo-France.

Installable PWA showing Météo-France's "pluie dans l'heure" (rain in the next hour) nowcast.

- Data: unofficial `webservice.meteofrance.com` endpoints (`/rain`, `/places`), the same ones the open-source `meteofrance-api` client uses. CORS is open, so no proxy is needed. Undocumented: may break without notice. See `api.js`.
- Static files only, no build step.

## Run locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

## Install on a phone

Service workers and geolocation require HTTPS, so host the folder on any static host (GitHub Pages, Cloudflare Pages, Netlify), open it on the phone, then "Add to Home Screen".
