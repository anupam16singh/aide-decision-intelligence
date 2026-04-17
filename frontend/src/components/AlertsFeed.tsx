import type { Alert } from "../lib/types";

const SEV: Record<Alert["severity"], { color: string; bg: string; border: string; icon: string }> = {
  info:     { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: "ℹ" },
  warning:  { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: "⚠" },
  critical: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: "🚨" },
};

export function AlertsFeed({ alerts }: { alerts: Alert[] }) {
  const sorted = [...alerts].sort((a, b) => +new Date(b.ts) - +new Date(a.ts));

  return (
    <div className="glass overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <div className="section-title mb-0">Live Alerts</div>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-6 text-center text-txt-muted text-sm">
          ✅ All systems nominal — no active alerts.
        </div>
      ) : (
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {sorted.map((a) => {
            const s = SEV[a.severity];
            return (
              <div
                key={a.id}
                className="flex items-start gap-3 px-4 py-3"
                style={{ background: s.bg, borderLeft: `3px solid ${s.color}` }}
              >
                <span className="text-base flex-shrink-0 mt-0.5">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-txt-secondary">{a.message}</div>
                  <div className="text-xs text-txt-dim font-mono mt-0.5">
                    {new Date(a.ts).toLocaleTimeString([], { hour12: false })}
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 border"
                  style={{ background: s.bg, color: s.color, borderColor: s.border }}
                >
                  {a.severity}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
