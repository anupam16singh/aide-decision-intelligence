import {
  Area, CartesianGrid, ComposedChart, Line,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { bandFor, colorFor } from "../lib/aqi";
import type { Forecast, StationReading } from "../lib/types";

interface Props { latest: StationReading | null; forecast: Forecast | null; }

export function ForecastPanel({ latest, forecast }: Props) {
  if (!latest) {
    return (
      <div className="glass p-5 flex items-center justify-center min-h-[240px]">
        <p className="text-txt-muted text-sm">Select a station to view forecast</p>
      </div>
    );
  }

  const points = [
    { label: "Now", mean: latest.pm25, lower: latest.pm25, upper: latest.pm25 },
    ...(forecast?.points ?? []).map((p) => ({
      label: `+${p.horizon_h}h`,
      mean: p.mean, lower: p.lower, upper: p.upper,
    })),
  ];

  const color = colorFor(latest.aqi);

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="section-title mb-0">PM2.5 Forecast</div>
          <div className="text-base font-bold text-txt-primary">{latest.station_name}</div>
        </div>
        <div className="text-right">
          {forecast && (
            <>
              <div className="text-xs text-txt-muted">Model</div>
              <div className="text-xs font-semibold text-accent-teal uppercase">
                {forecast.model.replace(/_/g, " ")}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Horizon summary pills */}
      {forecast && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {forecast.points.map((p) => {
            const b = bandFor(Math.round(p.mean));
            const trend = p.mean - latest.pm25;
            return (
              <div key={p.horizon_h} className="rounded-xl p-3 text-center"
                style={{ background: b.bg, border: `1px solid ${b.color}40` }}>
                <div className="text-xs text-txt-muted mb-1">+{p.horizon_h}h</div>
                <div className="font-bold text-xl" style={{ color: b.color }}>{p.mean.toFixed(0)}</div>
                <div className="text-[10px] text-txt-muted mt-0.5">µg/m³</div>
                <div className="text-[10px] mt-1" style={{ color: trend > 0 ? "#f87171" : "#22c55e" }}>
                  {trend > 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(0)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
            <defs>
              <linearGradient id="fcBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="label" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} />
            <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }}
              labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#f8fafc" }}
            />
            {points.some((p) => p.upper > 250) && (
              <ReferenceLine y={250} stroke="#f97316" strokeDasharray="4 4"
                label={{ value: "Hazard 250", fill: "#f97316", fontSize: 10, position: "insideTopRight" }} />
            )}
            <Area type="monotone" dataKey="upper" stroke="none" fill={`url(#fcBand)`} isAnimationActive={false} />
            <Area type="monotone" dataKey="lower" stroke="none" fill="#0f172a"   isAnimationActive={false} />
            <Line type="monotone" dataKey="mean" stroke={color} strokeWidth={2.5}
              dot={{ r: 4, fill: color, stroke: "#0f172a", strokeWidth: 2 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
