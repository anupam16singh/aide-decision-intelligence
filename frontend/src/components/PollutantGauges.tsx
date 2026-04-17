import type { StationReading } from "../lib/types";

interface Pollutant {
  field: keyof StationReading;
  label: string;
  unit: string;
  ceiling: number;
  safe: number;
  decimals?: number;
}

const POLLUTANTS: Pollutant[] = [
  { field: "pm25", label: "PM2.5", unit: "µg/m³", ceiling: 400, safe: 60  },
  { field: "pm10", label: "PM10",  unit: "µg/m³", ceiling: 500, safe: 100 },
  { field: "no2",  label: "NO₂",  unit: "µg/m³", ceiling: 200, safe: 80  },
  { field: "so2",  label: "SO₂",  unit: "µg/m³", ceiling: 120, safe: 80  },
  { field: "co",   label: "CO",   unit: "mg/m³", ceiling: 10,  safe: 4, decimals: 2 },
  { field: "o3",   label: "O₃",   unit: "µg/m³", ceiling: 220, safe: 100 },
];

function barColor(pct: number) {
  if (pct < 0.35) return "#16a34a";
  if (pct < 0.55) return "#d97706";
  if (pct < 0.75) return "#ea580c";
  return "#dc2626";
}

function PollutantBar({
  label, unit, value, ceiling, safe, decimals = 0,
}: Omit<Pollutant, "field"> & { value: number }) {
  const pct = Math.min(1, value / ceiling);
  const safePct = Math.min(1, safe / ceiling);
  const color = barColor(pct);
  const exceed = value > safe;

  return (
    <div className="flex items-center gap-3">
      <div className="w-12 flex-shrink-0">
        <div className="text-xs font-semibold text-txt-secondary">{label}</div>
        <div className="text-[10px] text-txt-dim">{unit}</div>
      </div>
      <div className="flex-1 relative">
        {/* Track */}
        <div className="h-3 bg-bg-elevated rounded-full overflow-hidden relative">
          {/* Safe threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-txt-dim/30 z-10"
            style={{ left: `${safePct * 100}%` }}
          />
          {/* Fill bar */}
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct * 100}%`,
              background: `linear-gradient(90deg, ${color}99, ${color})`,
            }}
          />
        </div>
      </div>
      <div className="w-14 text-right flex-shrink-0">
        <span className="text-sm font-bold" style={{ color }}>
          {value.toFixed(decimals)}
        </span>
        {exceed && (
          <div className="text-[9px] font-semibold" style={{ color }}>↑ HIGH</div>
        )}
      </div>
    </div>
  );
}

export function PollutantGauges({ reading }: { reading: StationReading }) {
  return (
    <div className="glass p-4">
      <div className="section-title">Pollutant Levels</div>
      <div className="space-y-3">
        {POLLUTANTS.map(({ field, ...rest }) => (
          <PollutantBar
            key={field}
            {...rest}
            value={reading[field] as number}
          />
        ))}
      </div>
      <div className="mt-3 text-[10px] text-txt-dim">
        ▏ = safe limit threshold
      </div>
    </div>
  );
}
