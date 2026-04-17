import clsx from "clsx";
import { useMemo } from "react";
import type { Forecast, Regime, StationReading } from "../lib/types";

const REGIME_STYLE: Record<Regime, { label: string; color: string; bg: string }> = {
  calm:       { label: "Calm",       color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  transition: { label: "Transition", color: "#facc15", bg: "rgba(250,204,21,0.12)"  },
  stress:     { label: "Stress",     color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const FEATURES = [
  { label: "PM2.5 lag-1h",  pct: 0.87 },
  { label: "Hour of day",   pct: 0.71 },
  { label: "Wind speed",    pct: 0.64 },
  { label: "Humidity",      pct: 0.58 },
  { label: "PM10 lag-3h",   pct: 0.52 },
  { label: "Traffic index", pct: 0.44 },
];

interface Props {
  regime: Regime;
  forecast: Forecast | null;
  stations: StationReading[];
}

export function MLEnginePanel({ regime, forecast, stations }: Props) {
  const rs = REGIME_STYLE[regime];

  const stats = useMemo(() => {
    const aqis = stations.map((s) => s.aqi);
    const avg = aqis.length ? aqis.reduce((a, b) => a + b, 0) / aqis.length : 0;
    const max = Math.max(...aqis, 0);
    const severe = aqis.filter((a) => a > 300).length;
    return { avg: Math.round(avg), max, severe };
  }, [stations]);

  return (
    <div className="glass p-5 flex flex-col gap-5">
      <div className="section-title mb-0">ML Engine · AIDE Framework</div>

      {/* Regime */}
      <div className="rounded-xl p-3 flex items-center gap-3"
        style={{ background: rs.bg, border: `1px solid ${rs.color}40` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: rs.color + "22" }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke={rs.color} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="text-xs text-txt-muted">HMM Regime Detector</div>
          <div className="font-bold text-lg" style={{ color: rs.color }}>{rs.label}</div>
        </div>
        <div className="ml-auto text-xs text-txt-muted text-right">
          <div>3-state HMM</div>
          <div className="font-mono">GaussianHMM</div>
        </div>
      </div>

      {/* Model ensemble */}
      <div>
        <div className="text-xs font-semibold text-txt-muted uppercase tracking-wider mb-3">
          Ensemble Weights
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ModelCard
            name="Random Forest"
            weight={60}
            icon="🌲"
            color="#38bdf8"
            desc="Multi-horizon RF · 40 trees"
            mae={15.8}
          />
          <ModelCard
            name="LSTM"
            weight={40}
            icon="🧠"
            color="#a78bfa"
            desc="Keras LSTM(64) · 24h window"
            mae={14.2}
          />
        </div>
      </div>

      {/* Feature importance */}
      <div>
        <div className="text-xs font-semibold text-txt-muted uppercase tracking-wider mb-3">
          Top Feature Importances
        </div>
        <div className="space-y-2">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="text-xs text-txt-secondary w-32 truncate flex-shrink-0">{f.label}</div>
              <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${f.pct * 100}%`,
                    background: `linear-gradient(90deg, #38bdf8, #818cf8)`,
                  }}
                />
              </div>
              <div className="text-xs font-mono text-accent-blue w-8 text-right">{(f.pct * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 border-t border-border-DEFAULT pt-4">
        <MetricCell label="City Avg AQI" value={String(stats.avg)} />
        <MetricCell label="Peak AQI"     value={String(stats.max)} />
        <MetricCell label="Severe Zones" value={`${stats.severe}/12`} highlight={stats.severe > 0} />
      </div>

      {forecast && (
        <div className="text-xs text-txt-muted text-center border-t border-border-DEFAULT pt-3">
          Last inference: <span className="text-accent-teal font-mono">{forecast.model}</span>
          {" · "}regime: <span className="font-semibold" style={{ color: rs.color }}>{forecast.regime}</span>
        </div>
      )}
    </div>
  );
}

function ModelCard({ name, weight, icon, color, desc, mae }: {
  name: string; weight: number; icon: string;
  color: string; desc: string; mae: number;
}) {
  return (
    <div className="rounded-xl p-3 border border-border-DEFAULT bg-bg-secondary">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-txt-primary truncate">{name}</div>
          <div className="text-[10px] text-txt-muted">{desc}</div>
        </div>
      </div>
      <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${weight}%`, background: color }} />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-txt-muted">Weight</span>
        <span className="text-xs font-bold" style={{ color }}>{weight}%</span>
      </div>
      <div className="text-[10px] text-txt-muted mt-1">MAE ~{mae} µg/m³</div>
    </div>
  );
}

function MetricCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-xs text-txt-muted">{label}</div>
      <div className={clsx("font-bold text-lg", highlight ? "text-aqi-veryPoor" : "text-txt-primary")}>{value}</div>
    </div>
  );
}
