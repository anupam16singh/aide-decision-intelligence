import clsx from "clsx";
import { SearchBar } from "./SearchBar";
import type { Regime, StationReading } from "../lib/types";

const REGIME_LABEL: Record<Regime, string> = {
  calm:       "CALM",
  transition: "TRANSITION",
  stress:     "STRESS",
};

interface Props {
  regime: Regime;
  connected: boolean;
  lastTickAt: string | null;
  stationCount: number;
  stations: StationReading[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function Navbar({
  regime,
  connected,
  lastTickAt,
  stationCount,
  stations,
  selectedId,
  onSelect,
}: Props) {
  const ts = lastTickAt ? new Date(lastTickAt) : null;
  const regimeLabel = REGIME_LABEL[regime];

  return (
    <header className="relative z-20 border-b border-cmd-border bg-cmd-bg">
      <div className="flex items-stretch h-14">
        {/* Brand + marker */}
        <div className="flex items-center gap-3 px-4 border-r border-cmd-border min-w-[280px]">
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 border border-cmd-bright" />
            <div className="absolute inset-[3px] bg-cmd-bright animate-blink" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-mono tracking-[0.22em] text-cmd-bright">
              AIRTWIN<span className="text-cmd-dim">//</span>DELHI
            </div>
            <div className="text-2xs font-mono uppercase tracking-[0.18em] text-cmd-muted">
              Urban Environmental Command
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 border-r border-cmd-border">
          <SearchBar
            stations={stations}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </div>

        {/* Status cluster */}
        <div className="flex items-stretch">
          <StatusCell label="STATIONS" value={String(stationCount).padStart(2, "0")} />
          <StatusCell
            label="REGIME"
            value={regimeLabel}
            emphasize={regime !== "calm"}
          />
          <StatusCell
            label="LINK"
            value={connected ? "ONLINE" : "LOST"}
            tone={connected ? "ok" : "alert"}
            pulse={connected}
          />
          <StatusCell
            label="T-SYNC"
            value={ts ? ts.toLocaleTimeString([], { hour12: false }) : "--:--:--"}
          />
        </div>
      </div>

      {/* Scanning hairline */}
      <div className="h-px bg-cmd-border relative overflow-hidden">
        <div className="absolute inset-y-0 w-[18%] bg-gradient-to-r from-transparent via-cmd-bright/60 to-transparent animate-scan" />
      </div>
    </header>
  );
}

function StatusCell({
  label,
  value,
  emphasize,
  tone,
  pulse,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  tone?: "ok" | "alert";
  pulse?: boolean;
}) {
  return (
    <div className="flex flex-col justify-center gap-0.5 px-4 border-l border-cmd-border min-w-[120px]">
      <div className="flex items-center gap-1.5">
        {tone && (
          <span
            className={clsx(
              "w-1.5 h-1.5",
              tone === "ok" ? "bg-cmd-bright" : "bg-cmd-dim",
              pulse && "animate-blink",
            )}
          />
        )}
        <span className="text-2xs font-mono uppercase tracking-[0.18em] text-cmd-muted">
          {label}
        </span>
      </div>
      <span
        className={clsx(
          "font-mono text-sm tracking-[0.08em]",
          emphasize ? "text-cmd-bright" : "text-cmd-text",
        )}
      >
        {value}
      </span>
    </div>
  );
}
