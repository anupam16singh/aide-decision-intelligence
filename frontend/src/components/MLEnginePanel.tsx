import { useMemo } from "react";
import type { Forecast, Regime, StationReading } from "../lib/types";

const REGIME_STYLE: Record<Regime, { label: string; color: string; bg: string; border: string }> = {
  calm:       { label: "Calm",       color: "#16a34a", bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.2)"   },
  transition: { label: "Transition", color: "#d97706", bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.2)"   },
  stress:     { label: "Stress",     color: "#dc2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.2)"   },
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
    <div className="glass p-5 flex flex-col gap-4">
      <div className="section-title mb-0">ML Engine · AIDE Framework</div>

      {/* Regime */}
      <div
        className="rounded-xl p-3 flex items-center gap-3"
        style={{ background: rs.bg, border: `1px solid ${rs.border}` }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: rs.color + "22" }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke={rs.color} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="text-xs text-txt-muted">HMM Regime · GaussianHMM</div>
          <div className="font-bold text-lg leading-tight" style={{ color: rs.color }}>{rs.label}</div>
        </div>
        <div className="ml-auto grid grid-cols-3 gap-2 text-center">
          <MetricCell label="Avg AQI" value={String(stats.avg)} />
          <MetricCell label="Peak"    value={String(stats.max)} />
          <MetricCell label="Severe"  value={`${stats.severe}/12`} highlight={stats.severe > 0} />
        </div>
      </div>

      {/* Ensemble weights */}
      <div>
        <div className="text-xs font-semibold text-txt-muted uppercase tracking-wider mb-2">
          Ensemble Weights
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ModelBar name="Random Forest" weight={60} icon="🌲" color="#2563eb" mae={15.8} />
          <ModelBar name="LSTM"          weight={40} icon="🧠" color="#7c3aed" mae={14.2} />
        </div>
      </div>

      {/* Feature importance */}
      <div>
        <div className="text-xs font-semibold text-txt-muted uppercase tracking-wider mb-2">
          Feature Importances
        </div>
        <div className="space-y-2">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="text-xs text-txt-secondary w-28 truncate flex-shrink-0">{f.label}</div>
              <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${f.pct * 100}%`,
                    background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                  }}
                />
              </div>
              <div className="text-xs font-mono text-accent-indigo w-8 text-right">
                {(f.pct * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {forecast && (
        <div className="text-xs text-txt-muted border-t border-border pt-3">
          Last inference: <span className="text-accent-teal font-mono">{forecast.model}</span>
          {" · "}regime: <span className="font-semibold" style={{ color: rs.color }}>{forecast.regime}</span>
        </div>
      )}
    </div>
  );
}

function ModelBar({ name, weight, icon, color, mae }: {
  name: string; weight: number; icon: string; color: string; mae: number;
}) {
  return (
    <div className="rounded-xl p-3 border border-border bg-bg-secondary">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-txt-primary truncate">{name}</div>
          <div className="text-[10px] text-txt-muted">MAE ~{mae} µg/m³</div>
        </div>
      </div>
      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${weight}%`, background: color }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-txt-muted">Weight</span>
        <span className="text-xs font-bold" style={{ color }}>{weight}%</span>
      </div>
    </div>
  );
}

function MetricCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[9px] text-txt-muted">{label}</div>
      <div className="font-bold text-sm" style={highlight ? { color: "#dc2626" } : { color: "#0f172a" }}>{value}</div>
    </div>
  );
}
