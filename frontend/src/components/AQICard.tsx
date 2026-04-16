import clsx from "clsx";
import { bandFor } from "../lib/aqi";
import type { StationReading } from "../lib/types";

interface Props {
  reading: StationReading;
}

function TrendArrow({ pct }: { pct: number | null | undefined }) {
  if (pct === null || pct === undefined) return <span className="text-cmd-muted">—</span>;
  const up = pct > 1;
  const down = pct < -1;
  const color = up ? "text-red-400" : down ? "text-emerald-400" : "text-cmd-muted";
  const sym = up ? "↑" : down ? "↓" : "→";
  return (
    <span className={clsx("font-mono", color)}>
      {sym} {pct > 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function Tile({
  label,
  value,
  unit,
  trend,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number | null;
}) {
  return (
    <div className="panel p-3 flex flex-col">
      <div className="flex items-center justify-between text-xs text-cmd-muted uppercase tracking-wider">
        <span>{label}</span>
        {trend !== undefined && <TrendArrow pct={trend} />}
      </div>
      <div className="mt-1 text-2xl font-semibold font-mono">
        {value}
        {unit && <span className="text-sm text-cmd-muted ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export function AQICard({ reading }: Props) {
  const b = bandFor(reading.aqi);
  return (
    <div className="space-y-3">
      <div
        className="panel p-4 border-2"
        style={{ borderColor: b.color, boxShadow: `0 0 24px ${b.color}33` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-cmd-muted uppercase tracking-wider">Overall AQI</div>
            <div className="text-4xl font-bold font-mono" style={{ color: b.color }}>
              {reading.aqi}
            </div>
            <div className="text-sm mt-1" style={{ color: b.color }}>
              {b.label}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-cmd-muted uppercase tracking-wider">Station</div>
            <div className="text-base font-semibold">{reading.station_name}</div>
            <div className="text-xs text-cmd-muted capitalize">{reading.zone.replace("_", " ")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Tile label="PM2.5" value={reading.pm25.toFixed(0)} unit="µg/m³" trend={reading.trend_pm25 ?? null} />
        <Tile label="PM10" value={reading.pm10.toFixed(0)} unit="µg/m³" />
        <Tile label="NO₂" value={reading.no2.toFixed(0)} unit="µg/m³" />
        <Tile label="SO₂" value={reading.so2.toFixed(0)} unit="µg/m³" />
        <Tile label="CO" value={reading.co.toFixed(2)} unit="mg/m³" />
        <Tile label="O₃" value={reading.o3.toFixed(0)} unit="µg/m³" />
      </div>

      <div className="grid grid-cols-4 gap-3 text-xs">
        <div className="panel p-2">
          <div className="text-cmd-muted">Temp</div>
          <div className="font-mono">{reading.temp.toFixed(1)} °C</div>
        </div>
        <div className="panel p-2">
          <div className="text-cmd-muted">Humidity</div>
          <div className="font-mono">{reading.humidity.toFixed(0)}%</div>
        </div>
        <div className="panel p-2">
          <div className="text-cmd-muted">Wind</div>
          <div className="font-mono">{reading.wind_speed.toFixed(1)} m/s</div>
        </div>
        <div className="panel p-2">
          <div className="text-cmd-muted">Traffic</div>
          <div className="font-mono">{(reading.traffic_index * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
}
