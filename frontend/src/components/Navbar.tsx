import clsx from "clsx";
import type { Regime } from "../lib/types";

const REGIME_META: Record<Regime, { label: string; color: string; ring: string }> = {
  calm:       { label: "Calm",       color: "text-emerald-400", ring: "ring-emerald-500/40" },
  transition: { label: "Transition", color: "text-amber-400",   ring: "ring-amber-500/40" },
  stress:     { label: "Stress",     color: "text-red-400",     ring: "ring-red-500/40" },
};

interface Props {
  regime: Regime;
  connected: boolean;
  lastTickAt: string | null;
  stationCount: number;
}

export function Navbar({ regime, connected, lastTickAt, stationCount }: Props) {
  const r = REGIME_META[regime];
  const ts = lastTickAt ? new Date(lastTickAt) : null;
  return (
    <header className="border-b border-cmd-border bg-cmd-panel/80 backdrop-blur">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full border-2 border-cmd-accent flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">
              AirTwin <span className="text-cmd-accent">India</span>
            </div>
            <div className="text-xs text-cmd-muted">
              AI Digital Twin • Urban Environmental Intelligence
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="chip">
            <span className="text-cmd-muted">City</span>
            <span className="text-cmd-text">Delhi NCR</span>
          </span>
          <span className="chip">
            <span className="text-cmd-muted">Stations</span>
            <span className="text-cmd-text">{stationCount}</span>
          </span>
          <span className={clsx("chip ring-2", r.ring)}>
            <span className="text-cmd-muted">Regime</span>
            <span className={clsx(r.color, "font-semibold")}>{r.label}</span>
          </span>
          <span
            className={clsx(
              "chip",
              connected ? "text-emerald-400 ring-1 ring-emerald-500/30" : "text-red-400 ring-1 ring-red-500/30",
            )}
          >
            <span
              className={clsx(
                "w-2 h-2 rounded-full",
                connected ? "bg-emerald-400 animate-pulse" : "bg-red-400",
              )}
            />
            {connected ? "LIVE" : "OFFLINE"}
          </span>
          {ts && (
            <span className="chip text-cmd-muted">
              {ts.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
