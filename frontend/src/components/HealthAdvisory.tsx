import { bandFor } from "../lib/aqi";
import type { Recommendation, StationReading } from "../lib/types";

const HEALTH_GROUPS = [
  { icon: "👶", label: "Children",       risk: (aqi: number) => aqi > 100 },
  { icon: "👴", label: "Elderly",        risk: (aqi: number) => aqi > 100 },
  { icon: "🫁", label: "Asthma / COPD", risk: (aqi: number) => aqi > 50  },
  { icon: "❤️", label: "Heart disease", risk: (aqi: number) => aqi > 150 },
  { icon: "🤰", label: "Pregnant",       risk: (aqi: number) => aqi > 100 },
  { icon: "💪", label: "Healthy adults", risk: (aqi: number) => aqi > 300 },
];

const ACTIONS_BY_BAND: Record<string, string[]> = {
  good:         ["✅ All outdoor activities are safe", "💚 Enjoy outdoor exercise freely", "🪟 Keep windows open"],
  satisfactory: ["🙂 Outdoor activities generally safe", "⚠️ Sensitive individuals: monitor symptoms", "💧 Stay hydrated"],
  moderate:     ["😷 Sensitive groups limit outdoor exertion", "🏠 Close windows during peak hours", "💧 Drink plenty of water", "🩺 Carry rescue inhalers if asthmatic"],
  poor:         ["🚫 Avoid prolonged outdoor activities", "😷 Wear N95 mask outdoors", "🌿 Use air purifier indoors", "❌ No outdoor exercise", "🏥 Seek care if symptoms worsen"],
  very_poor:    ["🚨 Stay indoors", "😷 N95/N99 respirator if outdoors", "🌬️ Run air purifiers on high", "🏥 Medical alert for sensitive groups"],
  severe:       ["☠️ Health emergency — stay indoors", "🚑 Seek medical attention for respiratory symptoms", "🏭 Industrial operations should pause", "📢 Public health advisory issued"],
};

interface Props {
  selected: StationReading | null;
  recommendations: Recommendation[];
}

export function HealthAdvisory({ selected, recommendations }: Props) {
  const aqi = selected?.aqi ?? 0;
  const b = bandFor(aqi);
  const actions = ACTIONS_BY_BAND[b.name] ?? [];

  return (
    <div className="glass p-5 flex flex-col gap-4">
      <div className="section-title mb-0">Health Advisory</div>

      {/* AQI status card */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: b.bg, border: `1px solid ${b.color}33` }}
      >
        <div className="text-4xl">{b.emoji}</div>
        <div>
          <div className="font-bold text-xl" style={{ color: b.color }}>{b.label}</div>
          {selected && (
            <div className="font-mono text-sm mt-0.5" style={{ color: b.text }}>AQI {aqi}</div>
          )}
          <div className="text-xs mt-1" style={{ color: b.text }}>{b.health}</div>
        </div>
      </div>

      {/* At-risk groups */}
      <div>
        <div className="text-xs font-semibold text-txt-muted uppercase tracking-wider mb-2">
          At-Risk Groups
        </div>
        <div className="grid grid-cols-3 gap-2">
          {HEALTH_GROUPS.map((g) => {
            const atRisk = g.risk(aqi);
            return (
              <div
                key={g.label}
                className="rounded-xl p-2 text-center text-xs border"
                style={atRisk
                  ? { background: "rgba(220,38,38,0.08)", borderColor: "rgba(220,38,38,0.25)", color: "#991b1b" }
                  : { background: "rgba(22,163,74,0.07)", borderColor: "rgba(22,163,74,0.2)", color: "#14532d" }
                }
              >
                <div className="text-lg mb-0.5">{g.icon}</div>
                <div className="font-medium leading-tight">{g.label}</div>
                <div className="text-[10px] mt-0.5 opacity-80">{atRisk ? "⚠ At risk" : "✓ Safe"}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div>
        <div className="text-xs font-semibold text-txt-muted uppercase tracking-wider mb-2">
          Recommended Actions
        </div>
        <ul className="space-y-1.5">
          {actions.map((a) => (
            <li key={a} className="text-sm text-txt-secondary flex items-start gap-2">
              <span className="flex-shrink-0">{a.split(" ")[0]}</span>
              <span>{a.split(" ").slice(1).join(" ")}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* AIDE directives */}
      {recommendations.length > 0 && (
        <div className="border-t border-border pt-4">
          <div className="text-xs font-semibold text-txt-muted uppercase tracking-wider mb-2">
            AIDE Directives
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((r) => {
              const urgHigh = r.urgency >= 7;
              return (
                <div
                  key={r.id}
                  className="rounded-xl p-3 border text-xs"
                  style={urgHigh
                    ? { background: "rgba(220,38,38,0.06)", borderColor: "rgba(220,38,38,0.2)" }
                    : { background: "rgba(37,99,235,0.05)", borderColor: "rgba(37,99,235,0.15)" }
                  }
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold uppercase tracking-wider"
                      style={{ color: urgHigh ? "#dc2626" : "#2563eb" }}>
                      {r.action_type}
                    </span>
                    <span className="font-mono text-txt-muted">urgency {r.urgency.toFixed(1)}</span>
                  </div>
                  <div className="text-txt-secondary">{r.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
