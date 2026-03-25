# Maps Demo

A small demo workspace with two kinds of pages:

- `index.html`: an editorial-style static article page
- `map-customizer.html`: a Vite-powered React page using local shadcn UI components around a MapLibre preview

## Project Files

- `index.html`: main static page
- `map-customizer.html`: HTML entry point for the React customizer
- `src/map-customizer/`: map customizer app code
- `src/components/ui/`: local shadcn-style UI components used by the customizer
- `osm-liberty.json`: built-in MapLibre style used as the default preview theme
- `Design System.md`: design notes for the visual system

## Run Locally

Install dependencies once:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Then open:

- `http://127.0.0.1:5173/`
- `http://127.0.0.1:5173/map-customizer.html`

To build a production bundle:

```bash
npm run build
```

The production files are written to `build/` so the checked-in Leaflet assets under `dist/` stay untouched.

## Map Customizer Notes

The customizer renders the preview in MapLibre while keeping the control panel in local shadcn UI components.

You can upload a MapLibre style JSON exported from Maputnik to preview color and layer styling changes live. Common `openmaptiles` / MapTiler placeholder sources are adapted to OpenFreeMap automatically for previewing without a private key.

The output JSON and file import flow cover the exposed camera and UI settings. Style uploads are handled separately through the Map Style card, though config imports also support an embedded `styleDocument` object if you add one manually.

## Git

The repository is configured to push to GitHub over SSH using the `splesanews` SSH host alias.
