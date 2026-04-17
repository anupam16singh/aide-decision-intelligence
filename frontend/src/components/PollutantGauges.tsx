import type { StationReading } from "../lib/types";

interface Pollutant {
  field: keyof StationReading;
  label: string; unit: string;
  ceiling: number; safe: number;
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

function gaugeColor(pct: number) {
  if (pct < 0.4) return "#22c55e";
  if (pct < 0.6) return "#facc15";
  if (pct < 0.8) return "#fb923c";
  return "#f87171";
}

function RadialGauge({ value, ceiling, safe, label, unit, decimals = 0 }: Omit<Pollutant, "field"> & { value: number }) {
  const pct = Math.min(1, value / ceiling);
  const safePct = Math.min(1, safe / ceiling);
  const color = gaugeColor(pct);
  const exceed = value > safe;

  const cx = 50; const cy = 50; const r = 38;
  const startDeg = -220; const totalDeg = 260;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arc = (a: number) => ({
    x: cx + r * Math.cos(toRad(a)),
    y: cy + r * Math.sin(toRad(a)),
  });
  const endDeg = startDeg + pct * totalDeg;
  const safeDeg = startDeg + safePct * totalDeg;
  const lg = endDeg - startDeg > 180 ? 1 : 0;
  const s0 = arc(startDeg);
  const se = arc(endDeg);
  const sf = arc(safeDeg);
  const trackEnd = arc(startDeg + totalDeg);

  const trackD = `M ${s0.x} ${s0.y} A ${r} ${r} 0 1 1 ${trackEnd.x} ${trackEnd.y}`;
  const fillD  = `M ${s0.x} ${s0.y} A ${r} ${r} 0 ${lg} 1 ${se.x} ${se.y}`;

  return (
    <div className="glass-sm p-4 flex flex-col items-center text-center"
      style={exceed ? { boxShadow: `0 0 16px ${color}33`, borderColor: color + "44" } : undefined}>
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        <defs>
          <linearGradient id={`g-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <path d={trackD} fill="none" stroke="#334155" strokeWidth="9" strokeLinecap="round" />
        <path d={fillD}  fill="none" stroke={`url(#g-${label})`} strokeWidth="9" strokeLinecap="round" />
        <circle cx={sf.x} cy={sf.y} r="2.5" fill="#94a3b8" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="800"
          fill={color} fontFamily="Inter,sans-serif">
          {value.toFixed(decimals)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#64748b"
          fontFamily="Inter,sans-serif">{unit}</text>
      </svg>
      <div className="font-bold text-sm text-txt-primary mt-1">{label}</div>
      {exceed && (
        <div className="text-[10px] font-semibold mt-0.5 px-2 py-0.5 rounded-full"
          style={{ background: color + "22", color }}>↑ Exceeds limit</div>
      )}
    </div>
  );
}

export function PollutantGauges({ reading }: { reading: StationReading }) {
  return (
    <section>
      <div className="section-title">Pollutant Levels — {reading.station_name}</div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {POLLUTANTS.map(({ field, ...rest }) => (
          <RadialGauge
            key={field} {...rest}
            value={reading[field] as number}
          />
        ))}
      </div>
    </section>
  );
}
