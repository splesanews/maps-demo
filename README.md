# Maps Demo

A small static demo site with two HTML entry points:

- `index.html`: an editorial-style article page
- `map-customizer.html`: an interactive OSM Liberty map styling preview

## Project Files

- `index.html`: main static page
- `map-customizer.html`: map customizer UI powered by MapLibre GL JS
- `osm-liberty.json`: local OSM Liberty style file used by the customizer
- `dist/`: bundled Leaflet assets kept with the project
- `Design System.md`: design notes for the visual system

## Run Locally

This project does not require a build step. Serve the folder with any static file server.

Example:

```bash
python3 -m http.server 1112
```

Then open:

- `http://127.0.0.1:1112/`
- `http://127.0.0.1:1112/map-customizer.html`

## Map Customizer Notes

The customizer loads `osm-liberty.json` locally and renders it with MapLibre GL JS from a CDN.

The original style references a MapTiler vector tile source with an API key placeholder. In the preview, that source is adapted at runtime to use OpenFreeMap vector tiles so the style can render without a private key.

## Git

The repository is configured to push to GitHub over SSH using the `splesanews` SSH host alias.
