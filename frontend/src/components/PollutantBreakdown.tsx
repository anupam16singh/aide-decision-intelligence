import type { StationReading } from "../lib/types";

interface Props {
  reading: StationReading;
}

interface Pollutant {
  key: string;
  label: string;
  value: number;
  unit: string;
  ceiling: number;
  threshold: number;
}

/**
 * CPCB 24-h standards (approx) used as reference ceiling for the meter.
 * value ≥ threshold → marked as exceeding safe limit.
 */
function makePollutants(r: StationReading): Pollutant[] {
  return [
    { key: "pm25", label: "PM2.5", value: r.pm25, unit: "µg/m³", ceiling: 400, threshold: 60  },
    { key: "pm10", label: "PM10",  value: r.pm10, unit: "µg/m³", ceiling: 500, threshold: 100 },
    { key: "no2",  label: "NO₂",   value: r.no2,  unit: "µg/m³", ceiling: 200, threshold: 80  },
    { key: "so2",  label: "SO₂",   value: r.so2,  unit: "µg/m³", ceiling: 120, threshold: 80  },
    { key: "co",   label: "CO",    value: r.co,   unit: "mg/m³", ceiling: 10,  threshold: 4   },
    { key: "o3",   label: "O₃",    value: r.o3,   unit: "µg/m³", ceiling: 220, threshold: 100 },
  ];
}

export function PollutantBreakdown({ reading }: Props) {
  const rows = makePollutants(reading);

  return (
    <section className="panel corners">
      <div className="panel-head">
        <span>04 · Pollutant Breakdown</span>
        <span className="text-cmd-muted">{reading.station_name}</span>
      </div>

      <div className="p-3 space-y-2">
        {rows.map((p) => {
          const pct = Math.min(1, p.value / p.ceiling);
          const exceed = p.value >= p.threshold;
          const thresholdPct = Math.min(1, p.threshold / p.ceiling);
          return (
            <div key={p.key} className="grid grid-cols-[72px_1fr_96px] items-center gap-3">
              <div className="text-2xs font-mono uppercase tracking-[0.14em] text-cmd-dim">
                {p.label}
              </div>
              <div className="relative h-3 bg-cmd-surface border border-cmd-border overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-cmd-text"
                  style={{ width: `${pct * 100}%`, opacity: exceed ? 1 : 0.5 }}
                />
                <div
                  className="absolute inset-y-0 w-px bg-cmd-edge"
                  style={{ left: `${thresholdPct * 100}%` }}
                  title={`Safe limit ${p.threshold} ${p.unit}`}
                />
              </div>
              <div className="flex items-center justify-end gap-1">
                <span className="font-mono text-sm text-cmd-bright leading-none">
                  {p.value.toFixed(p.key === "co" ? 2 : 0)}
                </span>
                <span className="text-2xs font-mono text-cmd-muted">{p.unit}</span>
                {exceed && (
                  <span className="text-2xs font-mono tracking-[0.18em] text-cmd-bright ml-1">
                    ↑
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-4 border-t border-cmd-border divide-x divide-cmd-border text-2xs font-mono">
        <Mini label="TEMP" value={`${reading.temp.toFixed(1)}°C`} />
        <Mini label="HUM"  value={`${reading.humidity.toFixed(0)}%`} />
        <Mini label="WIND" value={`${reading.wind_speed.toFixed(1)} m/s`} />
        <Mini label="TRAF" value={`${(reading.traffic_index * 100).toFixed(0)}%`} />
      </div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col px-3 py-2 gap-0.5">
      <span className="text-cmd-muted uppercase tracking-[0.18em]">{label}</span>
      <span className="text-cmd-bright">{value}</span>
    </div>
  );
}
