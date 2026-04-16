import clsx from "clsx";
import type { Recommendation } from "../lib/types";

const ACTION_META: Record<string, { icon: string; color: string; label: string }> = {
  traffic:  { icon: "→", color: "text-amber-400",   label: "Traffic" },
  industry: { icon: "■", color: "text-orange-400",  label: "Industry" },
  health:   { icon: "+", color: "text-red-400",     label: "Health" },
  school:   { icon: "★", color: "text-purple-400",  label: "School" },
  advisory: { icon: "!", color: "text-cmd-accent",  label: "Advisory" },
};

interface Props {
  recommendations: Recommendation[];
  filterStationId?: string | null;
}

export function RecommendationPanel({ recommendations, filterStationId }: Props) {
  const filtered = filterStationId
    ? recommendations.filter((r) => !r.station_id || r.station_id === filterStationId)
    : recommendations;

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-cmd-muted uppercase tracking-wider">
          Recommendations
        </div>
        <span className="chip text-cmd-muted">{filtered.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-cmd-muted mt-3">
          No active recommendations for this selection.
        </div>
      ) : (
        <ul className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
          {filtered.map((r) => {
            const meta = ACTION_META[r.action_type] || ACTION_META.advisory;
            const urgencyColor =
              r.urgency >= 8
                ? "text-red-400"
                : r.urgency >= 5
                ? "text-amber-400"
                : "text-cmd-muted";
            return (
              <li
                key={r.id}
                className="border border-cmd-border rounded p-2 bg-black/30"
              >
                <div className="flex items-center justify-between">
                  <span className={clsx("text-sm font-semibold", meta.color)}>
                    <span className="mr-2">{meta.icon}</span>
                    {meta.label}
                  </span>
                  <span className={clsx("text-xs font-mono", urgencyColor)}>
                    urgency {r.urgency.toFixed(1)}
                  </span>
                </div>
                <div className="text-sm mt-1">{r.title}</div>
                <div className="text-xs text-cmd-muted mt-1">{r.detail}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
