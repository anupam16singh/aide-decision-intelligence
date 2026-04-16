import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Forecast, StationReading } from "../lib/types";

interface Props {
  latest: StationReading | null;
  forecast: Forecast | null;
}

export function PredictionChart({ latest, forecast }: Props) {
  if (!latest) {
    return (
      <section className="panel corners">
        <div className="panel-head">
          <span>03 · Forecast PM2.5</span>
          <span className="text-cmd-muted">no station</span>
        </div>
        <div className="px-4 py-6 text-sm text-cmd-muted">
          Select a station to view the ensemble forecast.
        </div>
      </section>
    );
  }

  const points = [
    { hour: "NOW", mean: latest.pm25, lower: latest.pm25, upper: latest.pm25 },
    ...(forecast?.points ?? []).map((p) => ({
      hour: `+${p.horizon_h}H`,
      mean: p.mean,
      lower: p.lower,
      upper: p.upper,
    })),
  ];

  const peak = forecast?.points.reduce(
    (m, p) => (p.upper > m ? p.upper : m),
    latest.pm25,
  );

  return (
    <section className="panel corners">
      <div className="panel-head">
        <span>03 · Forecast PM2.5</span>
        <span className="text-cmd-muted font-mono">
          {forecast ? forecast.model.toUpperCase() : "LOADING"} ·{" "}
          {forecast ? forecast.regime.toUpperCase() : "—"}
        </span>
      </div>

      <div className="grid grid-cols-3 border-b border-cmd-border divide-x divide-cmd-border text-2xs font-mono">
        {points.slice(1).map((p) => (
          <div key={p.hour} className="flex flex-col px-3 py-2">
            <span className="uppercase tracking-[0.18em] text-cmd-muted">
              {p.hour}
            </span>
            <span className="text-cmd-bright text-sm leading-none mt-1">
              {p.mean.toFixed(0)}
              <span className="text-2xs text-cmd-muted ml-1">µg/m³</span>
            </span>
            <span className="text-cmd-dim text-2xs mt-0.5">
              CI {p.lower.toFixed(0)}–{p.upper.toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      <div className="h-52 px-2 pt-2 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#ffffff" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="#1f1f1f" />
            <XAxis
              dataKey="hour"
              stroke="#606060"
              tick={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fill: "#8a8a8a" }}
              tickLine={{ stroke: "#2a2a2a" }}
              axisLine={{ stroke: "#2a2a2a" }}
            />
            <YAxis
              stroke="#606060"
              tick={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fill: "#8a8a8a" }}
              tickLine={{ stroke: "#2a2a2a" }}
              axisLine={{ stroke: "#2a2a2a" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: 0,
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
              }}
              itemStyle={{ color: "#d4d4d4" }}
              labelStyle={{ color: "#8a8a8a" }}
            />
            {peak !== undefined && peak > 250 && (
              <ReferenceLine
                y={250}
                stroke="#606060"
                strokeDasharray="2 2"
                label={{
                  value: "Hazard 250",
                  fill: "#8a8a8a",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  position: "insideTopRight",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#band)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#000000"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="mean"
              stroke="#ffffff"
              strokeWidth={1.5}
              dot={{ r: 3, fill: "#ffffff", stroke: "#ffffff" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
