import { useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { bandFor } from "../lib/aqi";
import type { Regime, StationReading } from "../lib/types";

const REGIME_STYLE: Record<Regime, { label: string; cls: string }> = {
  calm:       { label: "Calm",       cls: "bg-aqi-good/20     text-aqi-good     border-aqi-good/40"     },
  transition: { label: "Transition", cls: "bg-aqi-moderate/20 text-aqi-moderate border-aqi-moderate/40" },
  stress:     { label: "Stress",     cls: "bg-aqi-veryPoor/20 text-aqi-veryPoor border-aqi-veryPoor/40" },
};

interface Props {
  regime: Regime;
  connected: boolean;
  lastTickAt: string | null;
  stations: StationReading[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function Navbar({ regime, connected, lastTickAt, stations, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rs = REGIME_STYLE[regime];

  const matches = useMemo(() => {
    const q = query.toLowerCase();
    return stations
      .filter((s) => !q || s.station_name.toLowerCase().includes(q) || s.zone.toLowerCase().includes(q))
      .sort((a, b) => b.aqi - a.aqi)
      .slice(0, 7);
  }, [query, stations]);

  const avgAqi = stations.length
    ? Math.round(stations.reduce((s, x) => s + x.aqi, 0) / stations.length)
    : 0;

  return (
    <header className="sticky top-0 z-50 bg-gradient-navbar border-b border-border-DEFAULT backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto flex items-center gap-4 px-6 h-16">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-fit">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-accent-blue/20 animate-pulse2" />
            <svg viewBox="0 0 32 32" className="w-6 h-6 relative z-10">
              <circle cx="16" cy="16" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="16" cy="16" r="7" fill="#38bdf8" opacity="0.6" />
              <circle cx="16" cy="16" r="3" fill="#38bdf8" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-base text-gradient-blue tracking-tight">
              AirTwin India
            </div>
            <div className="text-2xs text-txt-muted tracking-wider">AI Pollution Command</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="flex items-center gap-2 bg-bg-secondary border border-border-DEFAULT rounded-xl px-3 py-2">
            <svg className="w-4 h-4 text-txt-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              placeholder="Search stations or zones…"
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              className="bg-transparent flex-1 text-sm text-txt-primary placeholder:text-txt-muted outline-none"
            />
          </div>
          {open && matches.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-bg-secondary border border-border-DEFAULT rounded-xl overflow-hidden z-50 shadow-card">
              {matches.map((s) => {
                const b = bandFor(s.aqi);
                return (
                  <button
                    key={s.station_id}
                    onMouseDown={() => { onSelect(s.station_id); setOpen(false); setQuery(""); }}
                    className={clsx(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-bg-elevated transition-colors",
                      s.station_id === selectedId && "bg-bg-elevated",
                    )}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                    <span className="flex-1">
                      <div className="text-sm font-medium text-txt-primary">{s.station_name}</div>
                      <div className="text-xs text-txt-muted capitalize">{s.zone.replace("_", " ")}</div>
                    </span>
                    <span className="font-mono text-sm font-bold" style={{ color: b.color }}>
                      {s.aqi}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <StatChip label="Delhi NCR" value="12 Stations" />
          <StatChip label="City AQI" value={String(avgAqi)} valueColor={bandFor(avgAqi).color} />
          <span className={clsx("badge border text-xs font-semibold", rs.cls)}>
            {rs.label}
          </span>
          <div className={clsx(
            "flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border",
            connected
              ? "bg-aqi-good/15 text-aqi-good border-aqi-good/30"
              : "bg-red-500/15 text-red-400 border-red-500/30",
          )}>
            <span className={clsx("w-2 h-2 rounded-full", connected ? "bg-aqi-good animate-pulse" : "bg-red-400")} />
            {connected ? "LIVE" : "OFFLINE"}
          </div>
          {lastTickAt && (
            <span className="text-xs text-txt-muted font-mono hidden lg:block">
              {new Date(lastTickAt).toLocaleTimeString([], { hour12: false })}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function StatChip({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border-DEFAULT rounded-xl">
      <span className="text-xs text-txt-muted">{label}</span>
      <span className="text-xs font-bold" style={valueColor ? { color: valueColor } : undefined}>{value}</span>
    </div>
  );
}
