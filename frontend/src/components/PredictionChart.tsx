import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { colorFor } from "../lib/aqi";
import type { Forecast, StationReading } from "../lib/types";

interface Props {
  latest: StationReading | null;
  forecast: Forecast | null;
}

export function PredictionChart({ latest, forecast }: Props) {
  if (!latest) {
    return (
      <div className="panel p-4">
        <div className="text-xs text-cmd-muted uppercase tracking-wider">Forecast</div>
        <div className="text-sm text-cmd-muted mt-2">Select a station to view the forecast.</div>
      </div>
    );
  }

  const points = [
    { hour: "now", mean: latest.pm25, lower: latest.pm25, upper: latest.pm25 },
    ...(forecast?.points ?? []).map((p) => ({
      hour: `+${p.horizon_h}h`,
      mean: p.mean,
      lower: p.lower,
      upper: p.upper,
    })),
  ];

  const currentColor = colorFor(latest.aqi);

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-cmd-muted uppercase tracking-wider">Forecast PM2.5</div>
          <div className="text-sm font-semibold">{latest.station_name}</div>
        </div>
        <div className="flex items-center gap-2">
          {forecast && (
            <span className="chip text-cmd-muted">
              <span>Model</span>
              <span className="text-cmd-accent">{forecast.model}</span>
            </span>
          )}
        </div>
      </div>

      <div className="h-52 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={currentColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={currentColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1b2540" />
            <XAxis dataKey="hour" stroke="#8898b8" fontSize={11} />
            <YAxis stroke="#8898b8" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0d1422",
                border: "1px solid #1b2540",
                borderRadius: 6,
              }}
              labelStyle={{ color: "#8898b8" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#band)"
              name="upper 95%"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#070b14"
              name="lower 95%"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="mean"
              stroke={currentColor}
              strokeWidth={2.5}
              dot={{ r: 4, fill: currentColor }}
              name="mean"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
