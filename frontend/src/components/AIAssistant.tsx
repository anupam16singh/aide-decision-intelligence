import { useRef, useState } from "react";
import clsx from "clsx";
import { bandFor } from "../lib/aqi";
import type { Forecast, Regime, StationReading } from "../lib/types";

interface Message { role: "user" | "assistant"; text: string; ts: number; }

const SUGGESTIONS = [
  "Is it safe to go outside?",
  "What is causing the pollution?",
  "Best time to exercise today?",
  "Precautions for children?",
  "What will AQI be in 6 hours?",
];

interface Ctx {
  selected: StationReading | null;
  forecast: Forecast | null;
  regime: Regime;
  avgAqi: number;
}

function answer(q: string, ctx: Ctx): string {
  const sq = q.toLowerCase();
  const { selected, forecast, regime, avgAqi } = ctx;
  const b = selected ? bandFor(selected.aqi) : null;

  if (sq.includes("safe") || sq.includes("outside") || sq.includes("go out")) {
    if (!selected) return "Please select a station first so I can assess local conditions.";
    if (selected.aqi <= 50)   return `✅ Air quality at ${selected.station_name} is **Good** (AQI ${selected.aqi}). Perfectly safe to go outside — enjoy the fresh air!`;
    if (selected.aqi <= 100)  return `🙂 Air quality is **Satisfactory** (AQI ${selected.aqi}). Generally safe, but unusually sensitive individuals should limit prolonged outdoor exertion.`;
    if (selected.aqi <= 200)  return `⚠️ **Moderate** air quality (AQI ${selected.aqi}) near ${selected.station_name}. Sensitive groups (children, elderly, respiratory conditions) should reduce outdoor time. Healthy adults can go out briefly.`;
    if (selected.aqi <= 300)  return `😷 Air quality is **Poor** (AQI ${selected.aqi}). Avoid prolonged outdoor activity. Wear an N95 mask if you must go out. Keep windows closed at home.`;
    return `🚨 **${b?.label}** air quality (AQI ${selected.aqi}) at ${selected.station_name}! Stay indoors. If outdoor activity is essential, wear a proper respirator mask. This is a health emergency.`;
  }

  if (sq.includes("caus") || sq.includes("why") || sq.includes("reason") || sq.includes("source")) {
    const causes = [];
    if (selected?.traffic_index && selected.traffic_index > 0.6) causes.push("heavy traffic emissions");
    if (selected?.wind_speed && selected.wind_speed < 2) causes.push("low wind speed (poor dispersion)");
    if (selected?.humidity && selected.humidity > 70) causes.push("high humidity (fog/smog formation)");
    if (regime === "stress") causes.push("city-wide stress regime (stagnant air)");
    if (selected?.zone === "industrial") causes.push("nearby industrial emissions");
    const causeStr = causes.length ? causes.join(", ") : "multiple urban emission sources";
    return `🔍 Current high pollution at${selected ? ` ${selected.station_name}` : " the selected station"} is likely driven by: **${causeStr}**. The city-wide regime is "${regime}" — ${regime === "stress" ? "indicating stagnant air mass with trapped pollutants" : regime === "transition" ? "conditions are shifting, watch for changes in the next few hours" : "air quality is generally stable"}.`;
  }

  if (sq.includes("exercise") || sq.includes("run") || sq.includes("jog") || sq.includes("sport")) {
    const forecast6h = forecast?.points.find((p) => p.horizon_h === 6);
    if (!selected) return "Select a station to get exercise advice for your area.";
    if (selected.aqi <= 100) return `🏃 Good time to exercise! AQI is ${selected.aqi}. Early morning (6–8 AM) or evening (6–8 PM) typically have better air quality in Delhi.`;
    if (selected.aqi <= 200) return `⚠️ AQI ${selected.aqi} at ${selected.station_name} — exercise indoors if possible. If going out, choose a park away from traffic, wear a mask, and keep sessions under 30 minutes.`;
    return `🚫 AQI ${selected.aqi} — avoid outdoor exercise entirely. Even short runs at this pollution level are harmful. Use indoor facilities or do home workouts today.${forecast6h && forecast6h.mean < selected.pm25 * 1.1 ? ` The 6h forecast (PM2.5 ~${forecast6h.mean.toFixed(0)} µg/m³) suggests conditions may improve slightly.` : ""}`;
  }

  if (sq.includes("child") || sq.includes("kid") || sq.includes("baby") || sq.includes("school")) {
    const aqi = selected?.aqi ?? avgAqi;
    if (aqi <= 100) return `👦 Children can go to school and play outdoors normally (AQI ${aqi}). Encourage outdoor play!`;
    if (aqi <= 200) return `⚠️ AQI ${aqi}: Limit outdoor recess to under 20 minutes. Keep windows closed in classrooms. Children with asthma should carry inhalers.`;
    return `🏥 AQI ${aqi} — CRITICAL for children. Suspend outdoor activities completely. Consider keeping children home if they have any respiratory conditions. Schools should activate pollution protocols.`;
  }

  if (sq.includes("6 hour") || sq.includes("6h") || sq.includes("forecast") || sq.includes("predict")) {
    if (!forecast || !selected) return "Select a station first to get the 6-hour forecast.";
    const pts = forecast.points;
    const f1 = pts.find((p) => p.horizon_h === 1);
    const f3 = pts.find((p) => p.horizon_h === 3);
    const f6 = pts.find((p) => p.horizon_h === 6);
    return `📈 RF+LSTM ensemble forecast for ${selected.station_name}:\n• **+1h**: PM2.5 ~${f1?.mean.toFixed(0)} µg/m³ (${f1?.lower.toFixed(0)}–${f1?.upper.toFixed(0)})\n• **+3h**: PM2.5 ~${f3?.mean.toFixed(0)} µg/m³\n• **+6h**: PM2.5 ~${f6?.mean.toFixed(0)} µg/m³\n\nTrend: ${f6 && f6.mean > (selected.pm25 * 1.1) ? "📈 Worsening — take precautions early" : f6 && f6.mean < (selected.pm25 * 0.9) ? "📉 Improving — conditions expected to ease" : "➡️ Stable — no major change expected"}.`;
  }

  if (sq.includes("mask") || sq.includes("precaution") || sq.includes("protect")) {
    const aqi = selected?.aqi ?? avgAqi;
    if (aqi <= 100) return "😊 No mask needed at current AQI levels. General good practices: stay hydrated and keep windows open for fresh air.";
    if (aqi <= 200) return "😷 A surgical mask offers some protection. **N95/P2 masks** are strongly recommended for sensitive individuals. Avoid peak traffic hours.";
    return `🚨 AQI ${aqi}: **N95/N99 respirator mandatory** outdoors. Additional precautions:\n• Keep indoor air purifiers running\n• Seal window gaps with wet cloth\n• Avoid cooking on open flame\n• Drink plenty of warm water\n• Monitor for symptoms: coughing, eye irritation, shortness of breath`;
  }

  if (sq.includes("health") || sq.includes("symptom") || sq.includes("impact")) {
    const aqi = selected?.aqi ?? avgAqi;
    const b2 = bandFor(aqi);
    return `🏥 **${b2.label} Air Quality** (AQI ${aqi}):\n${b2.health}\n\nCommon symptoms at this level: ${aqi > 300 ? "severe respiratory distress, chest pain, dizziness" : aqi > 200 ? "coughing, wheezing, eye irritation" : aqi > 100 ? "mild irritation for sensitive groups" : "minimal health impact for healthy adults"}.`;
  }

  if (sq.includes("regime") || sq.includes("hmm") || sq.includes("model")) {
    return `🤖 The AIDE engine is currently detecting a **${regime}** pollution regime across Delhi NCR.\n\nRegime meanings:\n• **Calm** — stable, dispersing conditions, low urgency\n• **Transition** — shifting winds/weather, monitor closely\n• **Stress** — stagnant air, trapped pollutants, high urgency (urgency multiplier ×1.8×)\n\nThe HMM (Hidden Markov Model) analyzes PM2.5 volatility across all 12 stations to classify the city-wide state every 7 seconds.`;
  }

  return `💬 I'm the AirTwin AI Assistant, powered by the AIDE decision engine. I can help with:\n• **Safety advice** — "Is it safe to go outside?"\n• **Health impact** — "What are the health effects?"\n• **Forecasts** — "What will AQI be in 6 hours?"\n• **Causes** — "What is causing the pollution?"\n• **Exercise** — "Is it safe to exercise?"\n• **Children** — "Precautions for kids?"\n\nCurrent city average AQI: **${avgAqi}** · Regime: **${regime}**`;
}

export function AIAssistant({ selected, forecast, regime, stations }: {
  selected: StationReading | null;
  forecast: Forecast | null;
  regime: Regime;
  stations: StationReading[];
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: `👋 Hello! I'm the AirTwin AI Assistant, powered by the AIDE decision engine.\n\nI have real-time access to all 12 Delhi monitoring stations, ensemble forecasts (RF + LSTM), and the HMM pollution regime detector.\n\nAsk me anything about air quality, health advice, or pollution forecasts!`,
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const avgAqi = stations.length
    ? Math.round(stations.reduce((s, x) => s + x.aqi, 0) / stations.length)
    : 0;

  function send(q: string) {
    if (!q.trim()) return;
    const ctx: Ctx = { selected, forecast, regime, avgAqi };
    const userMsg: Message = { role: "user", text: q, ts: Date.now() };
    const aiMsg: Message   = { role: "assistant", text: answer(q, ctx), ts: Date.now() + 1 };
    setMessages((m) => [...m, userMsg, aiMsg]);
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <div className="glass p-5 flex flex-col gap-4 h-full max-h-[580px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="section-title mb-0">AI Assistant</div>
          <div className="text-sm font-bold text-gradient-blue">Powered by AIDE Engine</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center animate-pulse2">
          <svg className="w-4 h-4 text-accent-blue" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a2 2 0 012 2v1.5a7 7 0 010 13V20a2 2 0 01-4 0v-1.5a7 7 0 010-13V4a2 2 0 012-2z" />
          </svg>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={clsx(
                "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
                m.role === "user"
                  ? "bg-accent-blue/20 border border-accent-blue/30 text-txt-primary"
                  : "bg-bg-secondary border border-border-DEFAULT text-txt-secondary",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="text-xs px-2.5 py-1 rounded-full bg-bg-secondary border border-border-DEFAULT
              text-txt-muted hover:border-accent-blue/50 hover:text-accent-blue transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 bg-bg-secondary border border-border-DEFAULT rounded-xl px-3 py-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about air quality, health, forecasts…"
          className="flex-1 bg-transparent text-sm text-txt-primary placeholder:text-txt-muted outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-8 h-8 rounded-xl bg-accent-blue/20 text-accent-blue flex items-center justify-center
            hover:bg-accent-blue/30 disabled:opacity-40 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
