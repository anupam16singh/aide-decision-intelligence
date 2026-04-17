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
    <div className="glass overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <div className="section-title mb-0">All Monitoring Stations</div>
      </div>
      <div className="divide-y divide-border">
        {sorted.map((s) => {
          const b = bandFor(s.aqi);
          const isActive = s.station_id === selectedId;
          return (
            <button
              key={s.station_id}
              onClick={() => onSelect(s.station_id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-secondary"
              style={{
                background: isActive ? b.bg : undefined,
                borderLeft: isActive ? `3px solid ${b.color}` : "3px solid transparent",
              }}
            >
              {/* AQI number */}
              <div className="w-12 flex-shrink-0 text-center">
                <div className="font-mono font-bold text-lg leading-tight" style={{ color: b.color }}>
                  {s.aqi}
                </div>
                <div
                  className="text-[9px] font-semibold px-1 py-0.5 rounded-full"
                  style={{ background: b.bg, color: b.text }}
                >
                  {b.label}
                </div>
              </div>

              {/* Name + zone */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-txt-primary truncate">
                  {s.station_name}
                </div>
                <div className="text-xs text-txt-muted capitalize">
                  {s.zone.replace("_", " ")}
                </div>
              </div>

              {/* PM2.5 */}
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-txt-muted">PM2.5</div>
                <div className="text-sm font-semibold text-txt-secondary font-mono">
                  {s.pm25.toFixed(0)}
                </div>
              </div>

              {/* Emoji */}
              <div className="text-lg flex-shrink-0">{b.emoji}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
