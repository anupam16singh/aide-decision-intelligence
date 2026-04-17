import clsx from "clsx";
import type { Alert } from "../lib/types";

const SEV: Record<Alert["severity"], { color: string; bg: string; icon: string }> = {
  info:     { color: "#38bdf8", bg: "rgba(56,189,248,0.1)",   icon: "ℹ" },
  warning:  { color: "#facc15", bg: "rgba(250,204,21,0.1)",  icon: "⚠" },
  critical: { color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: "🚨" },
};

export function AlertsFeed({ alerts }: { alerts: Alert[] }) {
  const sorted = [...alerts].sort((a, b) => +new Date(b.ts) - +new Date(a.ts));

  return (
    <section>
      <div className="section-title">Live Alert Feed</div>
      <div className="glass overflow-hidden">
        {sorted.length === 0 ? (
          <div className="px-5 py-8 text-center text-txt-muted text-sm">
            ✅ All systems nominal — no active alerts.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle max-h-72 overflow-y-auto">
            {sorted.map((a) => {
              const s = SEV[a.severity];
              return (
                <div
                  key={a.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-bg-elevated"
                  style={{ borderLeft: `3px solid ${s.color}` }}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-txt-secondary">{a.message}</div>
                    <div className="text-xs text-txt-dim font-mono mt-0.5">
                      {new Date(a.ts).toLocaleTimeString([], { hour12: false })}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {a.severity}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
