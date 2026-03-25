import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import osmLibertyStyle from "../../osm-liberty.json";
import {
  Plus,
  Palette,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";

const defaults = {
  centerLat: 53.96,
  centerLng: -1.08,
  zoomLevel: 11,
  zoomButtons: true,
  wheelZoom: true,
  attributionToggle: true,
};

const OPENFREEMAP_VECTOR_SOURCE = "https://tiles.openfreemap.org/planet";
const DEFAULT_SPRITE = osmLibertyStyle.sprite;
const DEFAULT_GLYPHS = osmLibertyStyle.glyphs;
const ROUTE_STORAGE_KEY = "map-panel-routes";
const MAP_STATE_STORAGE_KEY = "map-panel-state";
const STYLE_STATE_STORAGE_KEY = "map-panel-style";
const ROUTE_DRAFT_STORAGE_KEY = "map-panel-route-draft";
const ROUTE_SOURCE_ID = "saved-routes";
const ROUTE_LINE_LAYER_ID = "saved-routes-line";
const ROUTE_OUTLINE_LAYER_ID = "saved-routes-outline";
const ROUTE_COLORS = [
  "#c65426",
  "#1c4f72",
  "#8d5a97",
  "#2f7d5b",
  "#b54708",
  "#b42318",
];

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function createRouteId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `route-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRelativeReference(value) {
  return (
    typeof value === "string" &&
    !value.startsWith("http://") &&
    !value.startsWith("https://") &&
    !value.startsWith("//") &&
    !value.startsWith("data:")
  );
}

function isStyleDocument(value) {
  return (
    value &&
    typeof value === "object" &&
    value.version === 8 &&
    value.sources &&
    typeof value.sources === "object" &&
    Array.isArray(value.layers)
  );
}

function isRouteGeometry(geometry) {
  return geometry?.type === "LineString" || geometry?.type === "MultiLineString";
}

function extractRouteFeatures(geojson) {
  if (!geojson || typeof geojson !== "object") {
    throw new Error("Expected valid GeoJSON from geojson.io.");
  }

  if (geojson.type === "FeatureCollection") {
    return geojson.features.filter((feature) => isRouteGeometry(feature.geometry));
  }

  if (geojson.type === "Feature" && isRouteGeometry(geojson.geometry)) {
    return [geojson];
  }

  if (isRouteGeometry(geojson)) {
    return [
      {
        type: "Feature",
        properties: {},
        geometry: geojson,
      },
    ];
  }

  return [];
}

function adaptStyleDocument(rawStyle) {
  if (!isStyleDocument(rawStyle)) {
    throw new Error("Expected a valid MapLibre style JSON file exported from Maputnik.");
  }

  const style = cloneJson(rawStyle);

  if (!style.sprite || isRelativeReference(style.sprite)) {
    style.sprite = DEFAULT_SPRITE;
  }

  if (!style.glyphs || isRelativeReference(style.glyphs)) {
    style.glyphs = DEFAULT_GLYPHS;
  }

  if (style.sources.openmaptiles?.type === "vector") {
    style.sources.openmaptiles.url = OPENFREEMAP_VECTOR_SOURCE;
  }

  if (style.sources.open_zoomstack) {
    delete style.sources.open_zoomstack;
  }

  Object.values(style.sources).forEach((source) => {
    if (!source || typeof source !== "object") return;

    if (
      source.type === "vector" &&
      typeof source.url === "string" &&
      (source.url.includes("maptiler.com") ||
        source.url.includes("{key}") ||
        source.url.startsWith("maptiler://"))
    ) {
      source.url = OPENFREEMAP_VECTOR_SOURCE;
    }
  });

  return style;
}

const defaultStyleDocument = adaptStyleDocument(osmLibertyStyle);
const defaultStyleState = {
  document: defaultStyleDocument,
  name: defaultStyleDocument.name || "OSM Liberty",
  fileName: null,
  sourceLabel: "Built-in OSM Liberty",
};

function normalizeSavedRoutes(value) {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (route) =>
      route &&
      typeof route === "object" &&
      typeof route.id === "string" &&
      typeof route.name === "string" &&
      isRouteGeometry(route.geometry)
  );
}

function loadSavedRoutes() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ROUTE_STORAGE_KEY);
    return raw ? normalizeSavedRoutes(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

function loadPersistedMapState() {
  if (typeof window === "undefined") return defaults;

  try {
    const raw = window.localStorage.getItem(MAP_STATE_STORAGE_KEY);
    if (!raw) return defaults;

    return applyConfig(JSON.parse(raw), defaults);
  } catch {
    return defaults;
  }
}

function loadPersistedStyleState() {
  if (typeof window === "undefined") return defaultStyleState;

  try {
    const raw = window.localStorage.getItem(STYLE_STATE_STORAGE_KEY);
    if (!raw) return defaultStyleState;

    const parsed = JSON.parse(raw);
    const document = adaptStyleDocument(parsed.document);

    return {
      document,
      name: parsed.name || document.name || "Custom style",
      fileName: parsed.fileName ?? null,
      sourceLabel:
        parsed.sourceLabel ||
        (parsed.fileName ? `Uploaded from ${parsed.fileName}` : "Built-in OSM Liberty"),
    };
  } catch {
    return defaultStyleState;
  }
}

function loadPersistedRouteDraft() {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(ROUTE_DRAFT_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function routeCollectionFromRecords(routes) {
  return {
    type: "FeatureCollection",
    features: routes.map((route) => ({
      type: "Feature",
      properties: {
        id: route.id,
        name: route.name,
        routeColor: route.color,
      },
      geometry: route.geometry,
    })),
  };
}

function toSavedRoute(feature, index, existingCount) {
  const name =
    feature.properties?.name ||
    feature.properties?.title ||
    feature.properties?.routeName ||
    `Route ${existingCount + index + 1}`;

  return {
    id: createRouteId(),
    name,
    color:
      feature.properties?.stroke ||
      feature.properties?.color ||
      ROUTE_COLORS[(existingCount + index) % ROUTE_COLORS.length],
    geometry: cloneJson(feature.geometry),
  };
}

function syncRoutesLayer(map, routes) {
  if (!map?.isStyleLoaded()) return;

  const routeCollection = routeCollectionFromRecords(routes);
  const existingSource = map.getSource(ROUTE_SOURCE_ID);

  if (existingSource) {
    existingSource.setData(routeCollection);
  } else {
    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: routeCollection,
    });
  }

  if (!map.getLayer(ROUTE_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_OUTLINE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "rgba(255,255,255,0.9)",
        "line-width": 8,
        "line-opacity": 0.95,
      },
    });
  }

  if (!map.getLayer(ROUTE_LINE_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_LINE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": ["coalesce", ["get", "routeColor"], "#c65426"],
        "line-width": 4,
        "line-opacity": 0.95,
      },
    });
  }
}

function markerElement(number, size) {
  const element = document.createElement("div");
  element.className = `map-marker map-marker--${size}`;
  element.textContent = `#${number}`;
  return element;
}

function clusterElement(count, size) {
  const outer = document.createElement("div");
  outer.className = `cluster-outer cluster-outer--${size}`;

  const inner = document.createElement("div");
  inner.className = `cluster-inner cluster-inner--${size}`;
  inner.textContent = String(count);

  outer.append(inner);
  return outer;
}

function placeDemoMarkers(map) {
  const markers = [];
  const sizes = ["lg", "md", "sm"];

  for (let i = 1; i <= 15; i += 1) {
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const lat = Math.random() * 140 - 70;
    const lng = Math.random() * 360 - 180;

    const marker = new maplibregl.Marker({
      element: markerElement(i, size),
      anchor: "center",
    })
      .setLngLat([lng, lat])
      .setPopup(new maplibregl.Popup({ offset: 10 }).setText(`Marker #${i}`))
      .addTo(map);

    markers.push(marker);
  }

  for (let i = 0; i < 8; i += 1) {
    const count = Math.floor(Math.random() * 200) + 2;
    const lat = Math.random() * 140 - 70;
    const lng = Math.random() * 360 - 180;
    const size = count < 10 ? "sm" : count < 100 ? "md" : "lg";

    const marker = new maplibregl.Marker({
      element: clusterElement(count, size),
      anchor: "center",
    })
      .setLngLat([lng, lat])
      .setPopup(new maplibregl.Popup({ offset: 10 }).setText(`${count} locations`))
      .addTo(map);

    markers.push(marker);
  }

  return markers;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function coerceFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function nearlyEqual(a, b, epsilon = 0.000001) {
  return Math.abs(a - b) <= epsilon;
}

function applyConfig(config, previousState) {
  const nextState = { ...previousState };

  const center = config.center && typeof config.center === "object" ? config.center : null;
  if (center) {
    const lat = coerceFiniteNumber(center.lat);
    const lng = coerceFiniteNumber(center.lng);

    if (lat !== null) nextState.centerLat = lat;
    if (lng !== null) nextState.centerLng = lng;
  }

  const zoom = coerceFiniteNumber(config.zoom);
  if (zoom !== null) {
    nextState.zoomLevel = clamp(zoom, 3, 18);
  }

  const ui = config.ui && typeof config.ui === "object" ? config.ui : null;
  if (ui) {
    if (typeof ui.zoomButtons === "boolean") nextState.zoomButtons = ui.zoomButtons;
    if (typeof ui.wheelZoom === "boolean") nextState.wheelZoom = ui.wheelZoom;
    if (typeof ui.attribution === "boolean") nextState.attributionToggle = ui.attribution;
  }

  return nextState;
}

function createStyleState(styleDocument, fileName = null) {
  return {
    document: styleDocument,
    name: styleDocument.name || (fileName ? fileName.replace(/\.json$/i, "") : "Custom style"),
    fileName,
    sourceLabel: fileName ? `Uploaded from ${fileName}` : "Built-in OSM Liberty",
  };
}

function FieldHeader({ label, value, htmlFor }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={htmlFor}>{label}</Label>
      {value ? (
        <span className="font-[var(--font-utility)] text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
          {value}
        </span>
      ) : null}
    </div>
  );
}

function ToggleRow({ id, label, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[rgba(39,23,17,0.08)] bg-white/70 px-3 py-3">
      <Label htmlFor={id} className="text-[12px] text-[var(--text-primary)]">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function App() {
  const [state, setState] = useState(loadPersistedMapState);
  const [styleState, setStyleState] = useState(loadPersistedStyleState);
  const [savedRoutes, setSavedRoutes] = useState(loadSavedRoutes);
  const [routeInput, setRouteInput] = useState(loadPersistedRouteDraft);
  const [status, setStatus] = useState("Loading map…");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const navigationControlRef = useRef(null);
  const attributionControlRef = useRef(null);
  const markersRef = useRef([]);
  const activeStyleRef = useRef(defaultStyleState.document);
  const savedRoutesRef = useRef(savedRoutes);

  useEffect(() => {
    savedRoutesRef.current = savedRoutes;
  }, [savedRoutes]);

  useEffect(() => {
    if (!mapContainerRef.current) return undefined;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleState.document,
      center: [defaults.centerLng, defaults.centerLat],
      zoom: defaults.zoomLevel,
      attributionControl: false,
    });

    const navigationControl = new maplibregl.NavigationControl({
      showCompass: false,
      visualizePitch: false,
    });
    const attributionControl = new maplibregl.AttributionControl({
      compact: true,
    });

    navigationControlRef.current = navigationControl;
    attributionControlRef.current = attributionControl;
    activeStyleRef.current = styleState.document;

    map.once("load", () => {
      markersRef.current = placeDemoMarkers(map);
      syncRoutesLayer(map, savedRoutesRef.current);
      setStatus("Map ready.");
    });

    const syncCameraFromMap = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();

      setState((previousState) => {
        const nextLat = Number(center.lat.toFixed(4));
        const nextLng = Number(center.lng.toFixed(4));
        const nextZoom = Number(zoom.toFixed(2));

        if (
          nearlyEqual(previousState.centerLat, nextLat, 0.0001) &&
          nearlyEqual(previousState.centerLng, nextLng, 0.0001) &&
          nearlyEqual(previousState.zoomLevel, nextZoom, 0.01)
        ) {
          return previousState;
        }

        return {
          ...previousState,
          centerLat: nextLat,
          centerLng: nextLng,
          zoomLevel: nextZoom,
        };
      });
    };

    map.on("moveend", syncCameraFromMap);

    map.on("error", (event) => {
      const message = event?.error?.message;
      if (!message) return;
      setStatus(`Map style warning: ${message}`);
    });

    map.on("styledata", () => {
      syncRoutesLayer(map, savedRoutesRef.current);
    });

    mapRef.current = map;

    return () => {
      map.off("moveend", syncCameraFromMap);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      navigationControlRef.current = null;
      attributionControlRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(savedRoutes));
  }, [savedRoutes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STYLE_STATE_STORAGE_KEY,
      JSON.stringify({
        document: styleState.document,
        name: styleState.name,
        fileName: styleState.fileName,
        sourceLabel: styleState.sourceLabel,
      })
    );
  }, [styleState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MAP_STATE_STORAGE_KEY, JSON.stringify({
      center: {
        lat: state.centerLat,
        lng: state.centerLng,
      },
      zoom: state.zoomLevel,
      ui: {
        zoomButtons: state.zoomButtons,
        wheelZoom: state.wheelZoom,
        attribution: state.attributionToggle,
      },
    }));
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ROUTE_DRAFT_STORAGE_KEY, routeInput);
  }, [routeInput]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (activeStyleRef.current !== styleState.document) {
      activeStyleRef.current = styleState.document;
      setStatus(`Applying style: ${styleState.name}…`);
      map.once("idle", () => {
        setStatus(`Style ready: ${styleState.name}.`);
      });
      map.setStyle(styleState.document);
    }
  }, [styleState]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    syncRoutesLayer(map, savedRoutes);
  }, [savedRoutes]);

  useEffect(() => {
    const map = mapRef.current;
    const navigationControl = navigationControlRef.current;
    const attributionControl = attributionControlRef.current;
    if (!map || !navigationControl || !attributionControl) return;

    const center = map.getCenter();
    const zoom = map.getZoom();

    if (
      !nearlyEqual(center.lat, state.centerLat, 0.0001) ||
      !nearlyEqual(center.lng, state.centerLng, 0.0001) ||
      !nearlyEqual(zoom, state.zoomLevel, 0.01)
    ) {
      map.jumpTo({
        center: [state.centerLng, state.centerLat],
        zoom: state.zoomLevel,
      });
    }

    if (state.zoomButtons && navigationControl._map !== map) {
      map.addControl(navigationControl, "top-left");
    }

    if (!state.zoomButtons && navigationControl._map === map) {
      map.removeControl(navigationControl);
    }

    if (state.wheelZoom) map.scrollZoom.enable();
    else map.scrollZoom.disable();

    if (state.attributionToggle && attributionControl._map !== map) {
      map.addControl(attributionControl, "bottom-right");
    }

    if (!state.attributionToggle && attributionControl._map === map) {
      map.removeControl(attributionControl);
    }
  }, [state]);

  async function handleStyleLoad(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(`Loading style from ${file.name}…`);

    try {
      const text = await file.text();
      const rawStyle = JSON.parse(text);
      const nextStyle = adaptStyleDocument(rawStyle);
      setStyleState(createStyleState(nextStyle, file.name));
      setStatus(`Applied style from ${file.name}.`);
    } catch (error) {
      setStatus(
        `Error loading style: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      event.target.value = "";
    }
  }

  function handleSaveRoutes() {
    try {
      const parsed = JSON.parse(routeInput);
      const routeFeatures = extractRouteFeatures(parsed);

      if (!routeFeatures.length) {
        throw new Error("No LineString or MultiLineString routes were found in that GeoJSON.");
      }

      setSavedRoutes((previousRoutes) => [
        ...previousRoutes,
        ...routeFeatures.map((feature, index) =>
          toSavedRoute(feature, index, previousRoutes.length)
        ),
      ]);
      setRouteInput("");
      setStatus(`Saved ${routeFeatures.length} route${routeFeatures.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setStatus(
        `Error saving routes: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  function handleDeleteRoute(routeId) {
    setSavedRoutes((previousRoutes) => {
      const nextRoutes = previousRoutes.filter((route) => route.id !== routeId);
      return nextRoutes;
    });
    setStatus("Route removed.");
  }

  function updateNumberField(key, value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;

    setState((previousState) => ({
      ...previousState,
      [key]: parsed,
    }));
  }

  function resetPanel() {
    setState(defaults);
    setStyleState(defaultStyleState);
    setStatus("Reset to the built-in OSM Liberty style.");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(28,79,114,0.12),_transparent_32%),linear-gradient(180deg,_#f7f2ee_0%,_#f3ece7_100%)] text-[var(--text-primary)]">
      <div className="grid min-h-screen w-full lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
        <aside className="border-b border-[var(--border-primary)] bg-[rgba(245,239,235,0.88)] backdrop-blur md:sticky md:top-0 md:h-fit lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="space-y-5 p-4 md:p-5 lg:p-6">
            <div className="space-y-3">
              <Badge>Vector Styling Toolkit</Badge>
              <div className="space-y-2">
                <h1 className="font-[var(--font-brand)] text-[38px] leading-[0.96] tracking-[-0.04em] text-[var(--text-primary)] sm:text-[46px]">
                  Times Travel Map Toolbox
                </h1>
                <p className="max-w-[34ch] font-[var(--font-utility)] text-[15px] leading-7 text-[var(--text-secondary)]">
                  Upload a Maputnik style JSON to live-preview color and layer styling in
                  MapLibre.
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Map Style</CardTitle>
                    <CardDescription>
                      Apply a MapLibre style JSON exported from Maputnik.
                    </CardDescription>
                  </div>
                  <div className="hidden rounded-full border border-[rgba(28,79,114,0.16)] bg-[rgba(28,79,114,0.08)] p-2 text-[var(--interactive-primary-default)] md:block">
                    <Palette className="size-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-[rgba(39,23,17,0.08)] bg-white/70 px-3 py-3">
                  <p className="font-[var(--font-utility)] text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    Active style
                  </p>
                  <p className="mt-1 font-[var(--font-brand)] text-[22px] leading-tight text-[var(--text-primary)]">
                    {styleState.name}
                  </p>
                  <p className="mt-1 font-[var(--font-utility)] text-sm leading-6 text-[var(--text-secondary)]">
                    {styleState.sourceLabel}
                  </p>
                </div>

                <div className="space-y-3">
                  <FieldHeader htmlFor="styleFile" label="Upload style JSON" />
                  <Input
                    id="styleFile"
                    type="file"
                    accept="application/json,.json"
                    onChange={handleStyleLoad}
                  />
                </div>

                <div className="rounded-lg border border-dashed border-[rgba(39,23,17,0.14)] bg-white/60 px-3 py-2 font-[var(--font-utility)] text-sm leading-6 text-[var(--text-secondary)]">
                  The importer understands standard MapLibre style JSON. Common
                  `openmaptiles` / MapTiler placeholder sources are auto-adapted to
                  OpenFreeMap for previewing without a private key.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Routes</CardTitle>
                <CardDescription>
                  Paste GeoJSON from geojson.io, save it, and manage each route
                  individually.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <FieldHeader htmlFor="routeJson" label="Paste route GeoJSON" />
                  <Textarea
                    id="routeJson"
                    placeholder={`{\n  "type": "FeatureCollection",\n  "features": []\n}`}
                    value={routeInput}
                    onChange={(event) => setRouteInput(event.target.value)}
                  />
                  <Button size="lg" onClick={handleSaveRoutes}>
                    <Plus />
                    Save Routes
                  </Button>
                </div>

                <div className="rounded-lg border border-dashed border-[rgba(39,23,17,0.14)] bg-white/60 px-3 py-2 font-[var(--font-utility)] text-sm leading-6 text-[var(--text-secondary)]">
                  The saver reads GeoJSON `FeatureCollection`, `Feature`, `LineString`,
                  and `MultiLineString` data. Each saved route stays on the map until you
                  delete it.
                </div>

                <div className="space-y-2">
                  <FieldHeader
                    label="Saved routes"
                    value={`${savedRoutes.length}`}
                    htmlFor="savedRoutes"
                  />
                  <div id="savedRoutes" className="space-y-2">
                    {savedRoutes.length ? (
                      savedRoutes.map((route) => (
                        <div
                          key={route.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[rgba(39,23,17,0.08)] bg-white/70 px-3 py-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="block size-2.5 rounded-full"
                                style={{ backgroundColor: route.color }}
                              />
                              <p className="truncate font-[var(--font-utility)] text-sm font-semibold text-[var(--text-primary)]">
                                {route.name}
                              </p>
                            </div>
                            <p className="mt-1 font-[var(--font-utility)] text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                              {route.geometry.type}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="default"
                            className="h-9 px-3"
                            onClick={() => handleDeleteRoute(route.id)}
                          >
                            <Trash2 />
                            Delete
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-[rgba(39,23,17,0.08)] bg-white/50 px-3 py-3 font-[var(--font-utility)] text-sm leading-6 text-[var(--text-secondary)]">
                        No saved routes yet.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Map UI</CardTitle>
                <CardDescription>
                  Tune center position, zoom, rounding, and interaction chrome.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldHeader htmlFor="centerLat" label="Center lat" />
                    <Input
                      id="centerLat"
                      type="number"
                      step="0.0001"
                      value={state.centerLat}
                      onChange={(event) => updateNumberField("centerLat", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldHeader htmlFor="centerLng" label="Center lng" />
                    <Input
                      id="centerLng"
                      type="number"
                      step="0.0001"
                      value={state.centerLng}
                      onChange={(event) => updateNumberField("centerLng", event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <FieldHeader
                    htmlFor="zoomLevel"
                    label="Zoom level"
                    value={String(state.zoomLevel)}
                  />
                  <Slider
                    id="zoomLevel"
                    min={3}
                    max={18}
                    step={1}
                    value={[state.zoomLevel]}
                    onValueChange={([value]) =>
                      setState((previousState) => ({
                        ...previousState,
                        zoomLevel: value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  <ToggleRow
                    id="zoomButtons"
                    label="Show zoom buttons"
                    checked={state.zoomButtons}
                    onCheckedChange={(checked) =>
                      setState((previousState) => ({
                        ...previousState,
                        zoomButtons: checked,
                      }))
                    }
                  />
                  <ToggleRow
                    id="wheelZoom"
                    label="Enable wheel zoom"
                    checked={state.wheelZoom}
                    onCheckedChange={(checked) =>
                      setState((previousState) => ({
                        ...previousState,
                        wheelZoom: checked,
                      }))
                    }
                  />
                  <ToggleRow
                    id="attributionToggle"
                    label="Show attribution"
                    checked={state.attributionToggle}
                    onCheckedChange={(checked) =>
                      setState((previousState) => ({
                        ...previousState,
                        attributionToggle: checked,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button size="lg" variant="outline" onClick={resetPanel} className="sm:col-span-2">
                <RotateCcw />
                Reset
              </Button>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-[rgba(28,79,114,0.1)] bg-[rgba(255,255,255,0.55)] px-4 py-3 text-[var(--text-secondary)]">
              <Upload className="mt-0.5 size-4 shrink-0 text-[var(--interactive-primary-default)]" />
              <p className="font-[var(--font-utility)] text-sm leading-6">{status}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="flex h-full min-h-[62vh] flex-col lg:min-h-screen">
            <div className="flex-1 border-l border-[var(--border-primary)] bg-[linear-gradient(135deg,_rgba(255,255,255,0.75),_rgba(223,233,241,0.95))] shadow-[0_30px_80px_rgba(39,23,17,0.12)]">
              <div
                className="h-[62vh] min-h-[480px] overflow-hidden bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] lg:h-screen"
              >
                <div ref={mapContainerRef} className="h-full w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
