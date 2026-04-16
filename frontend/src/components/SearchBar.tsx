import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { bandFor } from "../lib/aqi";
import type { StationReading } from "../lib/types";

interface Props {
  stations: StationReading[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SearchBar({ stations, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...stations].sort((a, b) => b.aqi - a.aqi);
    if (!q) return base.slice(0, 8);
    return base
      .filter(
        (s) =>
          s.station_name.toLowerCase().includes(q) ||
          s.zone.toLowerCase().includes(q) ||
          s.station_id.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, stations]);

  // Keyboard shortcut: `/` focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click-outside closes dropdown
  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", click);
    return () => window.removeEventListener("mousedown", click);
  }, [open]);

  function commit(id: string) {
    onSelect(id);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) setOpen(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && matches[cursor]) {
      e.preventDefault();
      commit(matches[cursor].station_id);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={wrapRef} className="relative h-full">
      <div className="flex items-center h-full px-4 gap-3">
        <SearchGlyph />
        <input
          ref={inputRef}
          value={query}
          placeholder="Search stations, zones (Anand Vihar, industrial, traffic) …"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setCursor(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          className="flex-1 bg-transparent outline-none text-sm font-mono text-cmd-bright
                     placeholder:text-cmd-muted tracking-wide"
        />
        <span className="kbd">/</span>
      </div>

      {open && matches.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-px bg-cmd-panel border border-cmd-border
                     max-h-[360px] overflow-y-auto z-30"
        >
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-cmd-border">
            <span className="text-2xs font-mono uppercase tracking-[0.18em] text-cmd-muted">
              {query ? "Matches" : "Stations · Sorted by AQI"}
            </span>
            <span className="text-2xs font-mono text-cmd-muted">
              {matches.length} / {stations.length}
            </span>
          </div>
          <ul>
            {matches.map((s, i) => {
              const b = bandFor(s.aqi);
              const active = i === cursor;
              const current = s.station_id === selectedId;
              return (
                <li key={s.station_id}>
                  <button
                    onMouseEnter={() => setCursor(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(s.station_id);
                    }}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2 text-left border-l-2 transition-colors",
                      active
                        ? "bg-cmd-raised border-cmd-bright"
                        : "border-transparent hover:bg-cmd-surface",
                    )}
                  >
                    <span
                      className="w-2 h-2"
                      style={{ background: b.gray }}
                      aria-hidden
                    />
                    <span className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-cmd-bright">
                          {s.station_name}
                        </span>
                        {current && (
                          <span className="text-2xs font-mono text-cmd-muted">
                            · SELECTED
                          </span>
                        )}
                      </div>
                      <div className="text-2xs font-mono uppercase tracking-[0.14em] text-cmd-muted">
                        {s.zone.replace("_", " ")} · {s.lat.toFixed(3)}, {s.lng.toFixed(3)}
                      </div>
                    </span>
                    <span className="flex flex-col items-end">
                      <span className="font-mono text-base leading-none text-cmd-bright">
                        {s.aqi}
                      </span>
                      <span className="text-2xs font-mono uppercase tracking-[0.14em] text-cmd-muted">
                        {b.label}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="6" stroke="#8a8a8a" strokeWidth="1.5" />
      <line x1="15" y1="15" x2="20" y2="20" stroke="#8a8a8a" strokeWidth="1.5" />
    </svg>
  );
}
