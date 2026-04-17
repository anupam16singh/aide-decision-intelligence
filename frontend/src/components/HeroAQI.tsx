import { bandFor } from "../lib/aqi";
import type { Forecast, StationReading } from "../lib/types";

interface Props {
  reading: StationReading;
  forecast: Forecast | null;
}

function ArcGauge({ aqi }: { aqi: number }) {
  const b = bandFor(aqi);
  const pct = Math.min(1, aqi / 500);
  const r = 60;
  const cx = 70; const cy = 70;
  const startAngle = -210; const totalAngle = 240;
  const trackPath = describeArc(cx, cy, r, startAngle, startAngle + totalAngle);
  const fillPath  = describeArc(cx, cy, r, startAngle, startAngle + pct * totalAngle);
  return (
    <svg viewBox="0 0 140 140" className="w-32 h-32">
      <defs>
        <linearGradient id="aqiGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={b.color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={b.color} />
        </linearGradient>
      </defs>
      <path d={trackPath} fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
      <path d={fillPath}  fill="none" stroke={`url(#aqiGrad2)`} strokeWidth="10" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="44" fill={b.bg} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="26" fontWeight="800"
        fill={b.color} fontFamily="Inter,sans-serif">{aqi}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fontWeight="600"
        fill={b.text} fontFamily="Inter,sans-serif">{b.label.toUpperCase()}</text>
      <text x={cx} y={cy + 26} textAnchor="middle" fontSize="8" fill="#94a3b8"
        fontFamily="Inter,sans-serif">AQI</text>
    </svg>
  );
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const s = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
  const e = { x: cx + r * Math.cos(toRad(endDeg)),   y: cy + r * Math.sin(toRad(endDeg))   };
  const lg = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${lg} 1 ${e.x} ${e.y}`;
}

export function HeroAQI({ reading, forecast }: Props) {
  const b = bandFor(reading.aqi);

  return (
    <div className="glass p-5 animate-fadeIn" style={{ borderLeft: `4px solid ${b.color}` }}>
      <div className="flex items-start gap-4">
        <ArcGauge aqi={reading.aqi} />

        <div className="flex-1 min-w-0 pt-1">
          <div className="text-[10px] font-semibold text-txt-muted uppercase tracking-widest mb-1">
            Selected Station
          </div>
          <div className="font-bold text-lg text-txt-primary leading-tight truncate">
            {reading.station_name}
          </div>
          <div className="text-sm text-txt-muted capitalize mt-0.5">
            {reading.zone.replace("_", " ")}
          </div>

          {/* Band pill */}
          <div
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: b.bg, color: b.text }}
          >
            <span>{b.emoji}</span>
            <span>{b.label}</span>
          </div>

          {/* Weather stats */}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <StatPill label="Temp"    value={`${reading.temp.toFixed(1)}°C`} />
            <StatPill label="Hum"     value={`${reading.humidity.toFixed(0)}%`} />
            <StatPill label="Wind"    value={`${reading.wind_speed.toFixed(1)} m/s`} />
            <StatPill label="Traffic" value={`${(reading.traffic_index * 100).toFixed(0)}%`} />
          </div>
        </div>
      </div>

      {/* Health message */}
      <div
        className="mt-4 text-xs rounded-xl px-3 py-2.5 flex items-start gap-2 leading-relaxed"
        style={{ background: b.bg, color: b.text }}
      >
        <span className="text-base flex-shrink-0">{b.emoji}</span>
        <span>{b.health}</span>
      </div>

      {/* Forecast pills */}
      {forecast && (
        <div className="mt-4">
          <div className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider mb-2">
            PM2.5 Forecast (µg/m³)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {forecast.points.map((p) => {
              const fb = bandFor(Math.round(p.mean));
              const trend = p.mean - reading.pm25;
              return (
                <div
                  key={p.horizon_h}
                  className="rounded-xl p-2.5 text-center border"
                  style={{ background: fb.bg, borderColor: fb.color + "44" }}
                >
                  <div className="text-[10px] text-txt-muted">+{p.horizon_h}h</div>
                  <div className="font-bold text-lg leading-tight" style={{ color: fb.color }}>
                    {p.mean.toFixed(0)}
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: trend > 0 ? "#dc2626" : "#16a34a" }}>
                    {trend > 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PM2.5 trend */}
      {reading.trend_pm25 !== undefined && reading.trend_pm25 !== null && (
        <div className="mt-3 text-xs text-txt-muted">
          PM2.5 trend:{" "}
          <span className="font-semibold" style={{ color: reading.trend_pm25 > 0 ? "#ea580c" : "#16a34a" }}>
            {reading.trend_pm25 > 0 ? "▲" : "▼"} {Math.abs(reading.trend_pm25).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-bg-secondary border border-border rounded-lg px-2 py-1">
      <span className="text-[10px] text-txt-muted">{label}</span>
      <span className="text-xs font-semibold text-txt-secondary">{value}</span>
    </div>
  );
}
