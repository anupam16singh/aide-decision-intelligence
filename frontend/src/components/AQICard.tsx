import clsx from "clsx";
import { bandFor } from "../lib/aqi";
import type { StationReading } from "../lib/types";

interface Props {
  reading: StationReading;
}

function Trend({ pct }: { pct: number | null | undefined }) {
  if (pct === null || pct === undefined) {
    return <span className="text-cmd-muted">—</span>;
  }
  const up = pct > 1;
  const down = pct < -1;
  const sym = up ? "▲" : down ? "▼" : "▬";
  const tone = up ? "text-cmd-bright" : "text-cmd-dim";
  return (
    <span className={clsx("font-mono text-2xs tracking-wider", tone)}>
      {sym} {pct > 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

export function AQICard({ reading }: Props) {
  const b = bandFor(reading.aqi);
  return (
    <section className="panel corners">
      <div className="panel-head">
        <span>02 · Station Vitals</span>
        <span className="text-cmd-muted font-mono">
          {reading.station_id} · {reading.source.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 border-b border-cmd-border">
        <div>
          <div className="text-2xs font-mono uppercase tracking-[0.18em] text-cmd-muted">
            Station
          </div>
          <div className="font-mono text-lg text-cmd-bright tracking-wide">
            {reading.station_name.toUpperCase()}
          </div>
          <div className="text-2xs font-mono uppercase tracking-[0.14em] text-cmd-muted mt-0.5">
            {reading.zone.replace("_", " ")} · {reading.lat.toFixed(3)}, {reading.lng.toFixed(3)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xs font-mono uppercase tracking-[0.18em] text-cmd-muted">
            Overall AQI
          </div>
          <div
            className="font-mono text-5xl leading-none tracking-tighter"
            style={{ color: b.gray }}
          >
            {reading.aqi}
          </div>
          <div className="text-2xs font-mono uppercase tracking-[0.18em] text-cmd-text mt-1">
            {b.label}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-cmd-border border-b border-cmd-border">
        <Tile label="PM2.5" value={reading.pm25.toFixed(0)} unit="µg/m³" trend={reading.trend_pm25 ?? null} primary />
        <Tile label="PM10"  value={reading.pm10.toFixed(0)} unit="µg/m³" />
        <Tile label="NO₂"   value={reading.no2.toFixed(0)}  unit="µg/m³" />
        <Tile label="SO₂"   value={reading.so2.toFixed(0)}  unit="µg/m³" />
        <Tile label="CO"    value={reading.co.toFixed(2)}   unit="mg/m³" />
        <Tile label="O₃"    value={reading.o3.toFixed(0)}   unit="µg/m³" />
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  unit,
  trend,
  primary,
}: {
  label: string;
  value: string;
  unit: string;
  trend?: number | null;
  primary?: boolean;
}) {
  return (
    <div className={clsx("px-3 py-2", primary && "bg-cmd-surface")}>
      <div className="flex items-center justify-between">
        <span className="text-2xs font-mono uppercase tracking-[0.18em] text-cmd-muted">
          {label}
        </span>
        {trend !== undefined && <Trend pct={trend} />}
      </div>
      <div className="mt-1 font-mono text-lg text-cmd-bright leading-none">
        {value}
        <span className="text-2xs font-mono text-cmd-muted ml-1">{unit}</span>
      </div>
    </div>
  );
}
