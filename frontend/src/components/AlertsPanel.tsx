import clsx from "clsx";
import type { Alert } from "../lib/types";

const SEV_COLOR: Record<Alert["severity"], string> = {
  info: "text-cmd-accent border-cmd-accent/40",
  warning: "text-amber-400 border-amber-500/40",
  critical: "text-red-400 border-red-500/60",
};

interface Props {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: Props) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-cmd-muted uppercase tracking-wider">Live Alerts</div>
        <span className="chip text-cmd-muted">{alerts.length}</span>
      </div>
      {alerts.length === 0 ? (
        <div className="text-sm text-cmd-muted mt-3">All clear.</div>
      ) : (
        <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
          {alerts.map((a) => (
            <li
              key={a.id}
              className={clsx("border rounded px-2 py-1 text-sm flex items-center justify-between", SEV_COLOR[a.severity])}
            >
              <span>{a.message}</span>
              <span className="text-xs font-mono text-cmd-muted">
                {new Date(a.ts).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
