import clsx from "clsx";
import { bandFor } from "../lib/aqi";
import type { Forecast, StationReading } from "../lib/types";

interface Props {
  reading: StationReading;
  forecast: Forecast | null;
}

function ArcGauge({ aqi }: { aqi: number }) {
  const b = bandFor(aqi);
  const pct = Math.min(1, aqi / 500);
  const r = 70;
  const cx = 80; const cy = 80;
  const startAngle = -210; const totalAngle = 240;
  const angle = startAngle + pct * totalAngle;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const trackPath = describeArc(cx, cy, r, startAngle, startAngle + totalAngle);
  const fillPath = describeArc(cx, cy, r, startAngle, angle);
  return (
    <svg viewBox="0 0 160 160" className="w-40 h-40">
      <defs>
        <linearGradient id="aqiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={b.color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={b.color} />
        </linearGradient>
        <filter id="glowFilter">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Track */}
      <path d={trackPath} fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
      {/* Fill */}
      <path d={fillPath} fill="none" stroke={`url(#aqiGrad)`} strokeWidth="12" strokeLinecap="round"
        filter="url(#glowFilter)" />
      {/* Center */}
      <circle cx={cx} cy={cy} r="48" fill={b.bg} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="28" fontWeight="800"
        fill={b.color} fontFamily="Inter,sans-serif">{aqi}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fontWeight="600"
        fill={b.text} fontFamily="Inter,sans-serif">{b.label.toUpperCase()}</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fontSize="9" fill="#64748b"
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
    <div
      className="glass p-5 flex flex-col gap-4 animate-fadeIn"
      style={{ boxShadow: `0 0 40px ${b.glow}` }}
    >
      <div className="text-xs font-semibold uppercase tracking-widest text-txt-muted">
        Selected Station
      </div>

      <div className="flex items-center gap-4">
        <ArcGauge aqi={reading.aqi} />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xl text-txt-primary leading-tight truncate">
            {reading.station_name}
          </div>
          <div className="text-sm text-txt-muted capitalize mt-0.5">
            {reading.zone.replace("_", " ")}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <PillStat label="Temp"    value={`${reading.temp.toFixed(1)}°C`} />
            <PillStat label="Hum"     value={`${reading.humidity.toFixed(0)}%`} />
            <PillStat label="Wind"    value={`${reading.wind_speed.toFixed(1)} m/s`} />
            <PillStat label="Traffic" value={`${(reading.traffic_index * 100).toFixed(0)}%`} />
          </div>
          {reading.trend_pm25 !== undefined && reading.trend_pm25 !== null && (
            <div className="mt-2 text-sm">
              <span className="text-txt-muted">PM2.5 trend: </span>
              <span className={reading.trend_pm25 > 0 ? "text-aqi-poor font-semibold" : "text-aqi-good font-semibold"}>
                {reading.trend_pm25 > 0 ? "▲" : "▼"} {Math.abs(reading.trend_pm25).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* b.health advisory */}
      <div
        className="text-xs rounded-xl px-3 py-2.5 flex items-start gap-2"
        style={{ background: b.bg, color: b.text }}
      >
        <span className="text-base">{b.emoji}</span>
        <span>{b.health}</span>
      </div>

      {/* 3-horizon forecast pills */}
      {forecast && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-txt-muted mb-2">
            Forecast PM2.5
          </div>
          <div className="grid grid-cols-3 gap-2">
            {forecast.points.map((p) => {
              const fb = bandFor(Math.round(p.mean));
              return (
                <div
                  key={p.horizon_h}
                  className="rounded-xl p-2.5 text-center border"
                  style={{ background: fb.bg, borderColor: fb.color + "44" }}
                >
                  <div className="text-xs text-txt-muted">+{p.horizon_h}h</div>
                  <div className="font-bold text-lg" style={{ color: fb.color }}>
                    {p.mean.toFixed(0)}
                  </div>
                  <div className="text-[10px]" style={{ color: fb.text }}>µg/m³</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PillStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-bg-secondary border border-border-DEFAULT rounded-lg px-2 py-1">
      <span className="text-[10px] text-txt-muted">{label}</span>
      <span className="text-xs font-semibold text-txt-secondary">{value}</span>
    </div>
  );
}
