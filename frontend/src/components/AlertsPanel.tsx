import clsx from "clsx";
import type { Alert } from "../lib/types";

const SEV_META: Record<Alert["severity"], { tag: string; emphasis: boolean }> = {
  info:     { tag: "INFO", emphasis: false },
  warning:  { tag: "WARN", emphasis: true  },
  critical: { tag: "CRIT", emphasis: true  },
};

interface Props {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: Props) {
  const sorted = [...alerts].sort(
    (a, b) => +new Date(b.ts) - +new Date(a.ts),
  );
  return (
    <section className="panel corners h-full flex flex-col min-h-0">
      <div className="panel-head">
        <span>07 · Live Feed</span>
        <span className="text-cmd-muted font-mono">
          {sorted.length} events · rolling
        </span>
      </div>
      {sorted.length === 0 ? (
        <div className="px-4 py-6 text-sm text-cmd-muted">
          All clear — no active alerts.
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto min-h-0">
          {sorted.map((a) => {
            const m = SEV_META[a.severity];
            const ts = new Date(a.ts);
            return (
              <li
                key={a.id}
                className={clsx(
                  "grid grid-cols-[80px_54px_1fr] items-start gap-2 px-3 py-1.5 border-b border-cmd-border font-mono text-2xs",
                  m.emphasis ? "text-cmd-text" : "text-cmd-dim",
                )}
              >
                <span className="text-cmd-muted">
                  {ts.toLocaleTimeString([], { hour12: false })}
                </span>
                <span
                  className={clsx(
                    "px-1.5 py-0.5 border text-center tracking-[0.18em]",
                    m.emphasis
                      ? "border-cmd-bright text-cmd-bright"
                      : "border-cmd-line text-cmd-muted",
                  )}
                >
                  {m.tag}
                </span>
                <span className="truncate" title={a.message}>
                  {a.message}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
