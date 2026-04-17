import { bandFor } from "../lib/aqi";
import type { Regime, StationReading } from "../lib/types";

const REGIME_STYLE: Record<Regime, { label: string; bg: string; color: string }> = {
  calm:       { label: "Calm",       bg: "rgba(255,255,255,0.2)", color: "#fff" },
  transition: { label: "Transition", bg: "rgba(255,255,255,0.2)", color: "#fde68a" },
  stress:     { label: "Stress",     bg: "rgba(255,255,255,0.2)", color: "#fca5a5" },
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
  const rs = REGIME_STYLE[regime];
  const avgAqi = stations.length
    ? Math.round(stations.reduce((s, x) => s + x.aqi, 0) / stations.length)
    : 0;
  const cityBand = bandFor(avgAqi);

  return (
    <header className="flex-shrink-0 bg-gradient-navbar text-white z-50 shadow-md">
      <div className="flex items-center gap-3 px-4 h-14">
        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-fit">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-5 h-5">
              <circle cx="16" cy="16" r="12" fill="none" stroke="white" strokeWidth="2.5" />
              <circle cx="16" cy="16" r="5" fill="white" opacity="0.7" />
              <circle cx="16" cy="16" r="2" fill="white" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">AirTwin India</div>
            <div className="text-white/60 text-[10px] leading-tight">AI Air Quality Twin</div>
          </div>
        </div>

        {/* Station chips — scrollable horizontal */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none min-w-0 mx-2">
          {stations.slice().sort((a, b) => b.aqi - a.aqi).map((s) => {
            const b = bandFor(s.aqi);
            const isActive = s.station_id === selectedId;
            return (
              <button
                key={s.station_id}
                onClick={() => onSelect(s.station_id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: isActive ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.8)",
                  border: isActive ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                <span className="truncate max-w-[90px]">{s.station_name.replace(" Station", "")}</span>
                <span className="font-bold font-mono" style={{ color: b.color }}>{s.aqi}</span>
              </button>
            );
          })}
        </div>

        {/* Right: stats + status */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-xs">
            <span className="text-white/70">Delhi avg</span>
            <span className="font-bold font-mono" style={{ color: cityBand.color }}>{avgAqi}</span>
          </div>

          <div className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: rs.bg, color: rs.color, border: "1px solid rgba(255,255,255,0.2)" }}>
            {rs.label}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: connected ? "#4ade80" : "#f87171" }}
            />
            <span className="text-white/80 hidden sm:inline">
              {connected ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          {lastTickAt && (
            <span className="text-[10px] text-white/50 font-mono hidden lg:inline">
              {new Date(lastTickAt).toLocaleTimeString([], { hour12: false })}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
