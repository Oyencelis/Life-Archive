"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { searchPlaceLocation, type GeocodeResult } from "./geocode";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
// Leaflet's default marker icon resolves relative to its own JS module,
// which breaks under Next's bundler — pointing at the same version on a
// CDN is the standard, framework-agnostic workaround.
const MARKER_ICON_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images/";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function PlaceLocationPicker({
  defaultLat,
  defaultLng,
}: {
  defaultLat?: string;
  defaultLng?: string;
}) {
  const initialLat = defaultLat ? Number(defaultLat) : null;
  const initialLng = defaultLng ? Number(defaultLng) : null;
  const hasInitial =
    initialLat != null && !Number.isNaN(initialLat) && initialLng != null && !Number.isNaN(initialLng);

  const [lat, setLat] = useState(hasInitial ? String(initialLat) : "");
  const [lng, setLng] = useState(hasInitial ? String(initialLng) : "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searchPending, startSearch] = useTransition();
  const [mapReady, setMapReady] = useState(false);

  const listboxId = useId();
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function placeMarker(latVal: number, lngVal: number, recenter: boolean) {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([latVal, lngVal]);
    } else {
      markerRef.current = L.marker([latVal, lngVal], { draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current!.getLatLng();
        setLat(pos.lat.toFixed(6));
        setLng(pos.lng.toFixed(6));
      });
    }
    if (recenter) {
      map.setView([latVal, lngVal], Math.max(map.getZoom(), 12), {
        animate: !prefersReducedMotion(),
      });
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapElRef.current || mapRef.current) return;

      leafletRef.current = L;
      L.Marker.prototype.options.icon = L.icon({
        iconUrl: `${MARKER_ICON_BASE}marker-icon.png`,
        iconRetinaUrl: `${MARKER_ICON_BASE}marker-icon-2x.png`,
        shadowUrl: `${MARKER_ICON_BASE}marker-shadow.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      const startCenter: [number, number] = hasInitial ? [initialLat!, initialLng!] : [20, 0];
      const map = L.map(mapElRef.current, {
        center: startCenter,
        zoom: hasInitial ? 12 : 2,
      });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

      map.on("click", (e: LeafletMouseEvent) => {
        setLat(e.latlng.lat.toFixed(6));
        setLng(e.latlng.lng.toFixed(6));
      });

      mapRef.current = map;
      // Marker placement for the initial lat/lng (if any) happens via the
      // lat/lng-watching effect below, once mapReady flips true.
      setMapReady(true);

      // This form can mount inside the create/edit modal, where the map's
      // container isn't at its final size until the entrance transition
      // settles — Leaflet measures the container once at creation, so
      // without this the tiles can render into the wrong bounds.
      requestAnimationFrame(() => map.invalidateSize());
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Map is created once on mount; lat/lng afterwards flow through
    // placeMarker() instead of re-running this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync whenever lat/lng change from any source
  // (typed input, search selection, or a click already handled above).
  useEffect(() => {
    if (!mapReady) return;
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (lat === "" || lng === "" || Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) return;
    placeMarker(parsedLat, parsedLng, true);
  }, [lat, lng, mapReady]);

  function selectResult(result: GeocodeResult) {
    setQuery(result.label);
    setResults([]);
    setLat(result.lat.toFixed(6));
    setLng(result.lng.toFixed(6));
  }

  function onSearchChange(value: string) {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 3) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(() => {
      startSearch(async () => {
        setResults(await searchPlaceLocation(value));
      });
    }, 400);
  }

  return (
    <div className="place-picker">
      <label>
        Search for a location
        <input
          type="text"
          value={query}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search an address, city, or landmark"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listboxId}
          autoComplete="off"
        />
      </label>

      {(searchPending || results.length > 0) && (
        <ul className="place-picker-results" id={listboxId} role="listbox" aria-label="Location results">
          {searchPending && results.length === 0 && (
            <li className="place-picker-status">Searching…</li>
          )}
          {results.map((r, i) => (
            <li key={`${r.lat}-${r.lng}-${i}`} role="option" aria-selected="false">
              <button type="button" onClick={() => selectResult(r)}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="place-picker-map-wrap">
        <div ref={mapElRef} className="place-picker-map" aria-label="Map for picking a location" />
        {!mapReady && <p className="place-picker-status place-picker-loading">Loading map…</p>}
      </div>

      <div className="entity-form-row">
        <label>
          Latitude
          <input
            name="lat"
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </label>
        <label>
          Longitude
          <input
            name="lng"
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
