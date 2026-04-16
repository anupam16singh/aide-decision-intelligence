import { useMemo, useState } from "react";

import { AlertsPanel } from "./components/AlertsPanel";
import { AQICard } from "./components/AQICard";
import { CesiumTwin } from "./components/CesiumTwin";
import { CityOverview } from "./components/CityOverview";
import { Navbar } from "./components/Navbar";
import { PollutantBreakdown } from "./components/PollutantBreakdown";
import { PredictionChart } from "./components/PredictionChart";
import { RecommendationPanel } from "./components/RecommendationPanel";
import { StationList } from "./components/StationList";
import { useForecast } from "./hooks/useForecast";
import { useLiveAQI } from "./hooks/useLiveAQI";

function defaultSelected(stations: Record<string, any>): string | null {
  const list = Object.values(stations) as any[];
  if (!list.length) return null;
  list.sort((a, b) => b.aqi - a.aqi);
  return list[0].station_id;
}

export default function App() {
  const live = useLiveAQI();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const effectiveSelected = selectedId ?? defaultSelected(live.stations);
  const selected = effectiveSelected ? live.stations[effectiveSelected] ?? null : null;
  const { forecast } = useForecast(effectiveSelected);

  const stationList = useMemo(() => Object.values(live.stations), [live.stations]);

  return (
    <div className="relative z-10 flex flex-col h-screen bg-cmd-bg text-cmd-text">
      <Navbar
        regime={live.regime}
        connected={live.connected}
        lastTickAt={live.lastTickAt}
        stationCount={stationList.length}
        stations={stationList}
        selectedId={effectiveSelected}
        onSelect={(id) => setSelectedId(id)}
      />

      <CityOverview
        stations={stationList}
        alerts={live.alerts}
        recommendations={live.recommendations}
        model={forecast?.model ?? null}
        lastTickAt={live.lastTickAt}
      />

      <main className="flex-1 grid grid-cols-12 grid-rows-[minmax(0,1fr)_minmax(0,0.6fr)] gap-px bg-cmd-border overflow-hidden">
        {/* Twin + analytics row */}
        <section className="col-span-12 xl:col-span-7 row-span-1 bg-cmd-bg flex flex-col min-h-0">
          <div className="panel-head border-b">
            <span>00 · Digital Twin — Heat Overlay</span>
            <span className="text-cmd-muted">
              {selected
                ? `Focus: ${selected.station_name.toUpperCase()}`
                : "Click a station to focus"}
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <CesiumTwin
              stations={live.stations}
              selectedId={effectiveSelected}
              onSelect={(id) => setSelectedId(id)}
            />
          </div>
        </section>

        <aside className="col-span-12 xl:col-span-5 row-span-1 bg-cmd-bg overflow-y-auto min-h-0">
          <div className="flex flex-col gap-px">
            {selected ? (
              <>
                <AQICard reading={selected} />
                <PredictionChart latest={selected} forecast={forecast} />
                <PollutantBreakdown reading={selected} />
                <RecommendationPanel
                  recommendations={live.recommendations}
                  filterStationId={effectiveSelected}
                />
              </>
            ) : (
              <div className="panel p-6 text-sm text-cmd-muted font-mono tracking-wide">
                · Connecting to live feed ·
              </div>
            )}
          </div>
        </aside>

        {/* Bottom row: station matrix + live feed */}
        <section className="col-span-12 xl:col-span-7 row-span-1 bg-cmd-bg min-h-0">
          <StationList
            stations={stationList}
            selectedId={effectiveSelected}
            onSelect={(id) => setSelectedId(id)}
          />
        </section>

        <section className="col-span-12 xl:col-span-5 row-span-1 bg-cmd-bg min-h-0">
          <AlertsPanel alerts={live.alerts} />
        </section>
      </main>

      <footer className="border-t border-cmd-border bg-cmd-bg px-4 py-1.5 flex items-center justify-between text-2xs font-mono text-cmd-muted tracking-[0.18em]">
        <span>AIRTWIN // AIDE — REGIME-AWARE AIR QUALITY COMMAND</span>
        <span>
          {live.connected ? "◉ LIVE" : "○ OFFLINE"} · WS 7s ·{" "}
          {live.lastTickAt
            ? new Date(live.lastTickAt).toLocaleTimeString([], { hour12: false })
            : "--:--:--"}
        </span>
      </footer>
    </div>
  );
}
