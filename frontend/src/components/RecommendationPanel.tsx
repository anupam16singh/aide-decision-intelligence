import clsx from "clsx";
import type { Recommendation } from "../lib/types";

const ACTION_META: Record<string, { glyph: string; label: string }> = {
  traffic:  { glyph: "↻", label: "TRAFFIC"  },
  industry: { glyph: "▣", label: "INDUSTRY" },
  health:   { glyph: "✚", label: "HEALTH"   },
  school:   { glyph: "◆", label: "SCHOOL"   },
  advisory: { glyph: "!", label: "ADVISORY" },
};

interface Props {
  recommendations: Recommendation[];
  filterStationId?: string | null;
}

export function RecommendationPanel({ recommendations, filterStationId }: Props) {
  const filtered = filterStationId
    ? recommendations.filter((r) => !r.station_id || r.station_id === filterStationId)
    : recommendations;
  const sorted = [...filtered].sort((a, b) => b.urgency - a.urgency);

  return (
    <section className="panel corners">
      <div className="panel-head">
        <span>05 · Autonomous Recommendations</span>
        <span className="text-cmd-muted font-mono">
          {sorted.length} queued · AIDE regime-scaled
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="px-4 py-6 text-sm text-cmd-muted">
          No active directives for this selection.
        </div>
      ) : (
        <ul className="max-h-72 overflow-y-auto">
          {sorted.map((r, i) => {
            const meta = ACTION_META[r.action_type] || ACTION_META.advisory;
            const urgencyPct = Math.min(1, r.urgency / 10);
            const critical = r.urgency >= 7;
            return (
              <li
                key={r.id}
                className={clsx(
                  "border-b border-cmd-border px-3 py-2 flex items-start gap-3",
                  critical ? "bg-cmd-surface" : "hover:bg-cmd-surface/60",
                )}
              >
                <div className="flex flex-col items-center gap-1 pt-0.5 w-10">
                  <span className="font-mono text-2xs text-cmd-muted tracking-[0.18em]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={clsx(
                      "font-mono text-lg leading-none",
                      critical ? "text-cmd-bright" : "text-cmd-dim",
                    )}
                  >
                    {meta.glyph}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-mono uppercase tracking-[0.18em] text-cmd-muted">
                      {meta.label}
                    </span>
                    <span className="text-2xs font-mono text-cmd-dim">·</span>
                    <span className="text-2xs font-mono text-cmd-muted">
                      URGENCY {r.urgency.toFixed(1)}
                    </span>
                    {critical && (
                      <span className="text-2xs font-mono text-cmd-bright tracking-[0.18em] animate-blink ml-auto">
                        PRIORITY
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-cmd-text mt-0.5">{r.title}</div>
                  <div className="text-2xs text-cmd-muted font-mono mt-1">
                    {r.detail}
                  </div>
                  <div className="mt-1.5 h-0.5 bg-cmd-border overflow-hidden">
                    <div
                      className="h-full bg-cmd-text"
                      style={{
                        width: `${urgencyPct * 100}%`,
                        opacity: critical ? 1 : 0.55,
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
