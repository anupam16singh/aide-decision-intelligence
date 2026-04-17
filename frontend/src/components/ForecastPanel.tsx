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
      <div className="glass p-5 flex items-center justify-center min-h-[180px]">
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
          <div className="text-sm font-bold text-txt-primary">{latest.station_name}</div>
        </div>
        {forecast && (
          <div className="text-right">
            <div className="text-[10px] text-txt-muted">Model</div>
            <div className="text-xs font-semibold text-accent-teal uppercase">
              {forecast.model.replace(/_/g, " ")}
            </div>
          </div>
        )}
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
            <defs>
              <linearGradient id="fcBandLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
            <XAxis dataKey="label" stroke="#cbd5e1" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
            <YAxis stroke="#cbd5e1" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "#64748b" }}
              itemStyle={{ color: "#334155" }}
            />
            {points.some((p) => p.upper > 250) && (
              <ReferenceLine y={250} stroke="#ea580c" strokeDasharray="4 4"
                label={{ value: "Hazard 250", fill: "#ea580c", fontSize: 10, position: "insideTopRight" }} />
            )}
            <Area type="monotone" dataKey="upper" stroke="none" fill={`url(#fcBandLight)`} isAnimationActive={false} />
            <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" isAnimationActive={false} />
            <Line type="monotone" dataKey="mean" stroke={color} strokeWidth={2.5}
              dot={{ r: 4, fill: color, stroke: "#ffffff", strokeWidth: 2 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
