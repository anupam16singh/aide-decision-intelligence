import { useMemo, useState } from "react";

import { Navbar }          from "./components/Navbar";
import { MapView }         from "./components/MapView";
import { HeroAQI }         from "./components/HeroAQI";
import { StationGrid }     from "./components/StationGrid";
import { ForecastPanel }   from "./components/ForecastPanel";
import { PollutantGauges } from "./components/PollutantGauges";
import { MLEnginePanel }   from "./components/MLEnginePanel";
import { AIAssistant }     from "./components/AIAssistant";
import { HealthAdvisory }  from "./components/HealthAdvisory";
import { AlertsFeed }      from "./components/AlertsFeed";

import { useForecast }  from "./hooks/useForecast";
import { useLiveAQI }   from "./hooks/useLiveAQI";

function defaultSelected(stations: Record<string, any>): string | null {
  const list = Object.values(stations) as any[];
  if (!list.length) return null;
  return [...list].sort((a, b) => b.aqi - a.aqi)[0].station_id;
}

export default function App() {
  const live = useLiveAQI();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const effectiveId  = selectedId ?? defaultSelected(live.stations);
  const selected     = effectiveId ? (live.stations[effectiveId] ?? null) : null;
  const { forecast } = useForecast(effectiveId);
  const stationList  = useMemo(() => Object.values(live.stations), [live.stations]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg-primary">
      <Navbar
        regime={live.regime}
        connected={live.connected}
        lastTickAt={live.lastTickAt}
        stations={stationList}
        selectedId={effectiveId}
        onSelect={(id) => setSelectedId(id)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: map (58%) */}
        <div className="relative flex-shrink-0" style={{ width: "58%" }}>
          <MapView
            stations={live.stations}
            selectedId={effectiveId}
            onSelect={(id) => setSelectedId(id)}
          />
        </div>

        {/* Right panel: scrollable info (42%) */}
        <div className="overflow-y-auto bg-bg-primary" style={{ width: "42%" }}>
          <div className="p-4 space-y-4">

            {/* AQI Hero */}
            {selected ? (
              <HeroAQI reading={selected} forecast={forecast} />
            ) : (
              <div className="glass p-8 flex items-center justify-center text-txt-muted text-sm">
                Connecting to live feed…
              </div>
            )}

            {/* Pollutant bars */}
            {selected && <PollutantGauges reading={selected} />}

            {/* Forecast chart */}
            <ForecastPanel latest={selected} forecast={forecast} />

            {/* ML Engine */}
            <MLEnginePanel regime={live.regime} forecast={forecast} stations={stationList} />

            {/* Health advisory */}
            {selected && (
              <HealthAdvisory
                selected={selected}
                recommendations={live.recommendations}
              />
            )}

            {/* All stations */}
            <StationGrid
              stations={stationList}
              selectedId={effectiveId}
              onSelect={(id) => setSelectedId(id)}
            />

            {/* Alerts feed */}
            <AlertsFeed alerts={live.alerts} />

            {/* Footer */}
            <div className="text-center text-xs text-txt-dim py-2 border-t border-border">
              AirTwin India · AIDE Framework · Delhi NCR · RF+LSTM+HMM Ensemble
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Assistant */}
      <AIAssistant
        selected={selected}
        forecast={forecast}
        regime={live.regime}
        stations={stationList}
      />
    </div>
  );
}
