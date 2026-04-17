import { useEffect, useRef } from "react";
import L from "leaflet";
import { bandFor, colorFor } from "../lib/aqi";
import type { StationReading } from "../lib/types";

interface Props {
  stations: Record<string, StationReading>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

interface LayerBundle { marker: L.CircleMarker; halo: L.Circle }

export function MapView({ stations, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Record<string, LayerBundle>>({});

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [28.63, 77.22],
      zoom: 11,
      zoomControl: false,
      attributionControl: true,
    });

    // CartoDB Dark Matter – matches the dark UI
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '© <a href="https://carto.com/">CARTO</a> | AirTwin India',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      // If clicked on map background (not a marker), deselect
      const target = e.originalEvent.target as HTMLElement;
      if (target.tagName === "CANVAS" || target.classList.contains("leaflet-pane")) {
        onSelect(null);
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers each tick
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const r of Object.values(stations)) {
      const color = colorFor(r.aqi);
      const b = bandFor(r.aqi);
      const isSelected = r.station_id === selectedId;
      const intensity = Math.min(1, r.aqi / 500);
      const haloRadius = 3000 + intensity * 7000;
      const latlng = L.latLng(r.lat, r.lng);

      if (layersRef.current[r.station_id]) {
        const { marker, halo } = layersRef.current[r.station_id];
        marker.setLatLng(latlng);
        marker.setStyle({
          fillColor: color,
          color: isSelected ? "#ffffff" : color,
          fillOpacity: isSelected ? 1 : 0.9,
          weight: isSelected ? 3 : 1.5,
          radius: isSelected ? 14 : r.aqi > 300 ? 11 : 8,
        });
        halo.setLatLng(latlng);
        halo.setRadius(haloRadius);
        halo.setStyle({ color, fillColor: color, fillOpacity: 0.08 + intensity * 0.14 });
      } else {
        // Halo (heatmap circle)
        const halo = L.circle(latlng, {
          radius: haloRadius,
          color,
          fillColor: color,
          fillOpacity: 0.08 + intensity * 0.14,
          weight: 0,
          interactive: false,
        }).addTo(map);

        // Station marker
        const marker = L.circleMarker(latlng, {
          radius: r.aqi > 300 ? 11 : 8,
          fillColor: color,
          color: color,
          weight: 1.5,
          fillOpacity: 0.9,
        }).addTo(map);

        marker.bindPopup(() => {
          const div = document.createElement("div");
          div.style.minWidth = "180px";
          div.innerHTML = `
            <div style="font-family:Inter,sans-serif">
              <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">${r.zone.replace("_"," ")}</div>
              <div style="font-size:15px;font-weight:700;color:#f8fafc;margin:4px 0;">${r.station_name}</div>
              <div style="display:flex;align-items:baseline;gap:6px;">
                <span style="font-size:32px;font-weight:800;color:${color};line-height:1">${r.aqi}</span>
                <span style="font-size:13px;color:${color}">${b.label}</span>
              </div>
              <hr style="border-color:#334155;margin:8px 0;"/>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;">
                <div><span style="color:#64748b">PM2.5</span> <span style="color:#f8fafc;font-weight:600">${r.pm25.toFixed(0)}</span></div>
                <div><span style="color:#64748b">PM10</span> <span style="color:#f8fafc;font-weight:600">${r.pm10.toFixed(0)}</span></div>
                <div><span style="color:#64748b">NO₂</span> <span style="color:#f8fafc;font-weight:600">${r.no2.toFixed(0)}</span></div>
                <div><span style="color:#64748b">Temp</span> <span style="color:#f8fafc;font-weight:600">${r.temp.toFixed(1)}°C</span></div>
              </div>
              <button
                onclick="document.dispatchEvent(new CustomEvent('airtwin:select',{detail:'${r.station_id}'}))"
                style="margin-top:10px;width:100%;background:${color}22;border:1px solid ${color}44;
                  color:${color};border-radius:8px;padding:6px;font-size:12px;font-weight:600;cursor:pointer;"
              >View Details →</button>
            </div>
          `;
          return div;
        });

        marker.on("click", () => onSelect(r.station_id));

        layersRef.current[r.station_id] = { marker, halo };
      }
    }
  }, [stations, selectedId, onSelect]);

  // Listen for popup button events
  useEffect(() => {
    const handler = (e: Event) => onSelect((e as CustomEvent).detail);
    document.addEventListener("airtwin:select", handler);
    return () => document.removeEventListener("airtwin:select", handler);
  }, [onSelect]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-sm px-3 py-2.5 text-xs">
        <div className="text-txt-muted font-semibold mb-2 uppercase tracking-wider text-[10px]">AQI Scale</div>
        <div className="space-y-1.5">
          {[
            { label: "Good 0–50",         color: "#22c55e" },
            { label: "Satisfactory 51–100", color: "#a3e635" },
            { label: "Moderate 101–200",  color: "#facc15" },
            { label: "Poor 201–300",      color: "#fb923c" },
            { label: "Very Poor 301–400", color: "#f87171" },
            { label: "Severe 400+",       color: "#c084fc" },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: r.color }} />
              <span className="text-txt-secondary">{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Heat toggle label */}
      <div className="absolute top-4 right-4 z-[1000] glass-sm px-3 py-1.5 text-xs text-txt-muted">
        2D View • Heatmap Active
      </div>
    </div>
  );
}
