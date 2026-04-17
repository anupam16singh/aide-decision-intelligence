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
    <div className="min-h-screen bg-bg-primary text-txt-primary flex flex-col">
      <Navbar
        regime={live.regime}
        connected={live.connected}
        lastTickAt={live.lastTickAt}
        stations={stationList}
        selectedId={effectiveId}
        onSelect={(id) => setSelectedId(id)}
      />

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 md:px-6 py-6 space-y-8">

        {/* ── SECTION 1: Map + Hero ── */}
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <div className="rounded-2xl overflow-hidden border border-border-DEFAULT" style={{ height: 480 }}>
            <MapView
              stations={live.stations}
              selectedId={effectiveId}
              onSelect={(id) => setSelectedId(id)}
            />
          </div>
          <div className="flex flex-col gap-4">
            {selected ? (
              <HeroAQI reading={selected} forecast={forecast} />
            ) : (
              <div className="glass p-6 flex items-center justify-center text-txt-muted text-sm h-full">
                Connecting to live feed…
              </div>
            )}
          </div>
        </section>

        {/* ── SECTION 2: Pollutant gauges ── */}
        {selected && <PollutantGauges reading={selected} />}

        {/* ── SECTION 3: Forecast + ML Engine ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ForecastPanel latest={selected} forecast={forecast} />
          <MLEnginePanel regime={live.regime} forecast={forecast} stations={stationList} />
        </section>

        {/* ── SECTION 4: AI Assistant + Health Advisory ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AIAssistant
            selected={selected}
            forecast={forecast}
            regime={live.regime}
            stations={stationList}
          />
          <HealthAdvisory
            selected={selected}
            recommendations={live.recommendations}
          />
        </section>

        {/* ── SECTION 5: Station grid ── */}
        <StationGrid
          stations={stationList}
          selectedId={effectiveId}
          onSelect={(id) => setSelectedId(id)}
        />

        {/* ── SECTION 6: Alerts ── */}
        <AlertsFeed alerts={live.alerts} />

      </main>

      {/* Footer */}
      <footer className="border-t border-border-DEFAULT bg-bg-secondary py-4 px-6">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between text-xs text-txt-dim">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
            AirTwin India · AI Digital Twin · Powered by AIDE Framework
          </div>
          <div className="font-mono">
            {live.connected ? "◉ LIVE" : "○ OFFLINE"} · WS 7s ·{" "}
            RF+LSTM+HMM Ensemble · Delhi NCR
          </div>
        </div>
      </footer>
    </div>
  );
}
