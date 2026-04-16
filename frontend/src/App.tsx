import { useMemo, useState } from "react";

import { AlertsPanel } from "./components/AlertsPanel";
import { AQICard } from "./components/AQICard";
import { CesiumTwin } from "./components/CesiumTwin";
import { Navbar } from "./components/Navbar";
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
    <div className="flex flex-col h-screen">
      <Navbar
        regime={live.regime}
        connected={live.connected}
        lastTickAt={live.lastTickAt}
        stationCount={stationList.length}
      />

      <main className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        <section className="col-span-12 lg:col-span-8 panel overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-cmd-border">
            <div>
              <div className="text-xs text-cmd-muted uppercase tracking-wider">
                Digital Twin
              </div>
              <div className="text-sm">Delhi NCR — Cesium 3D Globe</div>
            </div>
            {selected && (
              <div className="text-xs text-cmd-muted">
                Selected: <span className="text-cmd-text">{selected.station_name}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <CesiumTwin
              stations={live.stations}
              selectedId={effectiveSelected}
              onSelect={(id) => setSelectedId(id)}
            />
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-3 overflow-y-auto min-h-0 pr-1">
          {selected ? (
            <>
              <AQICard reading={selected} />
              <PredictionChart latest={selected} forecast={forecast} />
              <RecommendationPanel
                recommendations={live.recommendations}
                filterStationId={effectiveSelected}
              />
            </>
          ) : (
            <div className="panel p-6 text-center text-cmd-muted">
              Connecting to live feed…
            </div>
          )}
          <StationList
            stations={stationList}
            selectedId={effectiveSelected}
            onSelect={(id) => setSelectedId(id)}
          />
          <AlertsPanel alerts={live.alerts} />
        </aside>
      </main>
    </div>
  );
}
