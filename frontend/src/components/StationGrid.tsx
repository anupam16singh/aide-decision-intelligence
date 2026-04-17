import clsx from "clsx";
import { bandFor } from "../lib/aqi";
import type { StationReading } from "../lib/types";

interface Props {
  stations: StationReading[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function StationGrid({ stations, selectedId, onSelect }: Props) {
  const sorted = [...stations].sort((a, b) => b.aqi - a.aqi);

  return (
    <section>
      <div className="section-title">All Monitoring Stations</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {sorted.map((s) => {
          const b = bandFor(s.aqi);
          const isActive = s.station_id === selectedId;
          return (
            <button
              key={s.station_id}
              onClick={() => onSelect(s.station_id)}
              className={clsx(
                "glass-sm p-3 text-left transition-all hover:scale-[1.02] active:scale-100",
                "border-l-4",
                isActive && "ring-2",
              )}
              style={{
                borderLeftColor: b.color,
                background: isActive ? b.bg : undefined,
                boxShadow: isActive ? `0 0 20px ${b.glow}` : undefined,
                ...(isActive ? { "--tw-ring-color": b.color + "66" } as any : {}),
              }}
            >
              <div className="font-mono text-2xl font-bold mb-0.5" style={{ color: b.color }}>
                {s.aqi}
              </div>
              <div className="text-xs font-semibold text-txt-primary leading-tight truncate">
                {s.station_name}
              </div>
              <div className="text-[10px] text-txt-muted capitalize mt-0.5 truncate">
                {s.zone.replace("_", " ")}
              </div>
              <div
                className="mt-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block"
                style={{ background: b.bg, color: b.text }}
              >
                {b.label}
              </div>
              <div className="mt-1.5 text-[10px] text-txt-dim font-mono">
                PM2.5 {s.pm25.toFixed(0)} µg/m³
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
