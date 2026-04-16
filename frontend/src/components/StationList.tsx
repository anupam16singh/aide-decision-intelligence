import clsx from "clsx";
import { useState } from "react";
import { bandFor } from "../lib/aqi";
import type { StationReading } from "../lib/types";

type SortKey = "aqi" | "pm25" | "pm10" | "no2" | "name";

interface Props {
  stations: StationReading[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function StationList({ stations, selectedId, onSelect }: Props) {
  const [sort, setSort] = useState<SortKey>("aqi");

  const sorted = [...stations].sort((a, b) => {
    if (sort === "name") return a.station_name.localeCompare(b.station_name);
    return (b[sort] as number) - (a[sort] as number);
  });

  return (
    <section className="panel corners h-full flex flex-col min-h-0">
      <div className="panel-head">
        <span>06 · Station Matrix</span>
        <div className="flex items-center gap-1">
          {(["aqi", "pm25", "pm10", "no2", "name"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={clsx(
                "px-1.5 py-0.5 border text-2xs tracking-[0.18em] uppercase",
                sort === k
                  ? "border-cmd-bright text-cmd-bright"
                  : "border-cmd-line text-cmd-muted hover:text-cmd-text",
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[20px_1fr_64px_56px_56px_56px] gap-2 px-3 py-1.5 text-2xs font-mono uppercase tracking-[0.18em] text-cmd-muted border-b border-cmd-border">
        <span />
        <span>Station</span>
        <span className="text-right">AQI</span>
        <span className="text-right">PM2.5</span>
        <span className="text-right">PM10</span>
        <span className="text-right">NO₂</span>
      </div>

      <ul className="flex-1 overflow-y-auto min-h-0">
        {sorted.map((s) => {
          const b = bandFor(s.aqi);
          const active = selectedId === s.station_id;
          return (
            <li key={s.station_id}>
              <button
                onClick={() => onSelect(s.station_id)}
                className={clsx(
                  "w-full grid grid-cols-[20px_1fr_64px_56px_56px_56px] gap-2 px-3 py-1.5 text-left items-center border-b border-cmd-border text-sm",
                  active
                    ? "bg-cmd-raised border-l-2 border-l-cmd-bright"
                    : "border-l-2 border-l-transparent hover:bg-cmd-surface",
                )}
              >
                <span
                  className="w-2 h-2"
                  style={{ background: b.gray }}
                  aria-hidden
                />
                <div className="truncate">
                  <div className="text-cmd-bright font-mono tracking-wide truncate">
                    {s.station_name.toUpperCase()}
                  </div>
                  <div className="text-2xs font-mono uppercase tracking-[0.14em] text-cmd-muted">
                    {s.zone.replace("_", " ")}
                  </div>
                </div>
                <span
                  className="text-right font-mono"
                  style={{ color: b.gray }}
                >
                  {s.aqi}
                </span>
                <span className="text-right font-mono text-cmd-text">
                  {s.pm25.toFixed(0)}
                </span>
                <span className="text-right font-mono text-cmd-text">
                  {s.pm10.toFixed(0)}
                </span>
                <span className="text-right font-mono text-cmd-text">
                  {s.no2.toFixed(0)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
