import { useRef, useState } from "react";
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
    if (selected.aqi <= 50)   return `✅ Air quality at ${selected.station_name} is Good (AQI ${selected.aqi}). Perfectly safe to go outside!`;
    if (selected.aqi <= 100)  return `🙂 Air quality is Satisfactory (AQI ${selected.aqi}). Generally safe, sensitive individuals should limit prolonged outdoor exertion.`;
    if (selected.aqi <= 200)  return `⚠️ Moderate air quality (AQI ${selected.aqi}) near ${selected.station_name}. Sensitive groups should reduce outdoor time. Healthy adults can go out briefly.`;
    if (selected.aqi <= 300)  return `😷 Poor air quality (AQI ${selected.aqi}). Avoid prolonged outdoor activity. Wear N95 mask if you must go out.`;
    return `🚨 ${b?.label} air quality (AQI ${selected.aqi}) at ${selected.station_name}! Stay indoors. This is a health emergency.`;
  }

  if (sq.includes("caus") || sq.includes("why") || sq.includes("reason") || sq.includes("source")) {
    const causes: string[] = [];
    if (selected?.traffic_index && selected.traffic_index > 0.6) causes.push("heavy traffic emissions");
    if (selected?.wind_speed && selected.wind_speed < 2) causes.push("low wind speed (poor dispersion)");
    if (selected?.humidity && selected.humidity > 70) causes.push("high humidity (smog formation)");
    if (regime === "stress") causes.push("city-wide stress regime (stagnant air)");
    if (selected?.zone === "industrial") causes.push("nearby industrial emissions");
    const causeStr = causes.length ? causes.join(", ") : "multiple urban emission sources";
    return `🔍 High pollution is likely driven by: ${causeStr}. The city-wide regime is "${regime}" — ${regime === "stress" ? "stagnant air mass trapping pollutants" : regime === "transition" ? "conditions are shifting" : "air quality is stable"}.`;
  }

  if (sq.includes("exercise") || sq.includes("run") || sq.includes("jog") || sq.includes("sport")) {
    const f6h = forecast?.points.find((p) => p.horizon_h === 6);
    if (!selected) return "Select a station to get exercise advice for your area.";
    if (selected.aqi <= 100) return `🏃 Good time to exercise! AQI is ${selected.aqi}. Early morning (6–8 AM) or evening (6–8 PM) have best air quality.`;
    if (selected.aqi <= 200) return `⚠️ AQI ${selected.aqi} — exercise indoors if possible. If outdoors, wear a mask and keep sessions under 30 minutes.`;
    return `🚫 AQI ${selected.aqi} — avoid outdoor exercise entirely. Use indoor facilities today.${f6h && f6h.mean < selected.pm25 * 1.1 ? ` 6h forecast (PM2.5 ~${f6h.mean.toFixed(0)} µg/m³) suggests slight improvement.` : ""}`;
  }

  if (sq.includes("child") || sq.includes("kid") || sq.includes("baby") || sq.includes("school")) {
    const aqi = selected?.aqi ?? avgAqi;
    if (aqi <= 100) return `👦 Children can go to school and play outdoors normally (AQI ${aqi}).`;
    if (aqi <= 200) return `⚠️ AQI ${aqi}: Limit outdoor recess. Children with asthma should carry inhalers.`;
    return `🏥 AQI ${aqi} — CRITICAL for children. Suspend outdoor activities. Consider keeping children home if they have respiratory conditions.`;
  }

  if (sq.includes("6 hour") || sq.includes("6h") || sq.includes("forecast") || sq.includes("predict")) {
    if (!forecast || !selected) return "Select a station first to get the 6-hour forecast.";
    const pts = forecast.points;
    const f1 = pts.find((p) => p.horizon_h === 1);
    const f3 = pts.find((p) => p.horizon_h === 3);
    const f6 = pts.find((p) => p.horizon_h === 6);
    return `📈 RF+LSTM forecast for ${selected.station_name}:\n+1h: PM2.5 ~${f1?.mean.toFixed(0)} µg/m³\n+3h: PM2.5 ~${f3?.mean.toFixed(0)} µg/m³\n+6h: PM2.5 ~${f6?.mean.toFixed(0)} µg/m³\n\nTrend: ${f6 && f6.mean > (selected.pm25 * 1.1) ? "📈 Worsening" : f6 && f6.mean < (selected.pm25 * 0.9) ? "📉 Improving" : "➡️ Stable"}.`;
  }

  if (sq.includes("mask") || sq.includes("precaution") || sq.includes("protect")) {
    const aqi = selected?.aqi ?? avgAqi;
    if (aqi <= 100) return "😊 No mask needed at current AQI. Stay hydrated and keep windows open.";
    if (aqi <= 200) return "😷 N95/P2 masks strongly recommended for sensitive individuals. Avoid peak traffic hours.";
    return `🚨 AQI ${aqi}: N95/N99 respirator mandatory outdoors. Run indoor air purifiers, seal window gaps, monitor for symptoms.`;
  }

  if (sq.includes("health") || sq.includes("symptom") || sq.includes("impact")) {
    const aqi = selected?.aqi ?? avgAqi;
    const b2 = bandFor(aqi);
    return `🏥 ${b2.label} Air Quality (AQI ${aqi}):\n${b2.health}\n\nCommon symptoms: ${aqi > 300 ? "respiratory distress, chest pain, dizziness" : aqi > 200 ? "coughing, wheezing, eye irritation" : aqi > 100 ? "mild irritation for sensitive groups" : "minimal health impact"}.`;
  }

  if (sq.includes("regime") || sq.includes("hmm") || sq.includes("model")) {
    return `🤖 The AIDE engine detects a ${regime} pollution regime across Delhi NCR.\n\nCalm = stable, dispersing\nTransition = shifting, monitor closely\nStress = stagnant, trapped pollutants (urgency ×1.8×)\n\nThe GaussianHMM analyzes PM2.5 volatility every 7 seconds.`;
  }

  return `💬 I'm the AirTwin AI, powered by the AIDE decision engine.\n\nAsk me about:\n• Safety: "Is it safe to go outside?"\n• Forecast: "What will AQI be in 6 hours?"\n• Causes: "What is causing the pollution?"\n• Exercise: "Is it safe to exercise?"\n• Children: "Precautions for kids?"\n\nCity avg AQI: ${avgAqi} · Regime: ${regime}`;
}

export function AIAssistant({ selected, forecast, regime, stations }: {
  selected: StationReading | null;
  forecast: Forecast | null;
  regime: Regime;
  stations: StationReading[];
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "👋 Hello! I'm the AirTwin AI Assistant.\n\nI have real-time access to all 12 Delhi monitoring stations, RF+LSTM forecasts, and the HMM pollution regime detector.\n\nAsk me anything about air quality, health advice, or pollution forecasts!",
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
    const userMsg: Message = { role: "user",      text: q,             ts: Date.now()     };
    const aiMsg:   Message = { role: "assistant", text: answer(q, ctx), ts: Date.now() + 1 };
    setMessages((m) => [...m, userMsg, aiMsg]);
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <>
      {/* Floating chat drawer */}
      {open && (
        <div
          className="fixed bottom-20 right-4 w-80 bg-white rounded-2xl shadow-xl border border-border flex flex-col z-[2000] animate-slideUp"
          style={{ height: "420px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-navbar rounded-t-2xl text-white">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
              <div>
                <div className="text-sm font-bold">AirTwin AI</div>
                <div className="text-[10px] text-white/70">Powered by AIDE Engine</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line"
                  style={m.role === "user"
                    ? { background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }
                    : { background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0" }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {SUGGESTIONS.slice(0, 3).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-[10px] px-2 py-1 rounded-full bg-bg-secondary border border-border text-txt-muted hover:border-accent-indigo hover:text-accent-indigo transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 px-3 pb-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about air quality…"
              className="flex-1 text-xs bg-bg-secondary border border-border rounded-xl px-3 py-2 text-txt-primary placeholder:text-txt-dim outline-none focus:border-accent-indigo"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
              style={{ background: "#4f46e5" }}
            >
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-[2000] transition-transform hover:scale-110 active:scale-95"
        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
        title="Open AI Assistant"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        )}
        {/* Unread indicator */}
        {!open && messages.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
            {Math.min(9, messages.filter(m => m.role === "assistant").length - 1)}
          </span>
        )}
      </button>
    </>
  );
}
