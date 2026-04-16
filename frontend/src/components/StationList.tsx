import clsx from "clsx";
import { colorFor } from "../lib/aqi";
import type { StationReading } from "../lib/types";

interface Props {
  stations: StationReading[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function StationList({ stations, selectedId, onSelect }: Props) {
  const sorted = [...stations].sort((a, b) => b.aqi - a.aqi);
  return (
    <div className="panel p-3">
      <div className="text-xs text-cmd-muted uppercase tracking-wider mb-2">
        Stations (sorted by AQI)
      </div>
      <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {sorted.map((s) => {
          const active = selectedId === s.station_id;
          return (
            <li key={s.station_id}>
              <button
                onClick={() => onSelect(s.station_id)}
                className={clsx(
                  "w-full flex items-center justify-between px-2 py-1 rounded text-sm transition",
                  active
                    ? "bg-cmd-accent/10 ring-1 ring-cmd-accent/40"
                    : "hover:bg-cmd-border/40",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: colorFor(s.aqi) }}
                  />
                  <span>{s.station_name}</span>
                </span>
                <span className="font-mono text-xs" style={{ color: colorFor(s.aqi) }}>
                  {s.aqi}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
