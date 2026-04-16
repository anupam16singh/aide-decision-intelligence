import { useEffect, useRef, useState } from "react";
import type { Alert, Recommendation, StationReading, TickPayload, Regime } from "../lib/types";

export interface LiveAQIState {
  connected: boolean;
  regime: Regime;
  stations: Record<string, StationReading>;
  alerts: Alert[];
  recommendations: Recommendation[];
  lastTickAt: string | null;
}

const WS_URL =
  import.meta.env.VITE_WS_URL || `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/live`;

export function useLiveAQI(): LiveAQIState {
  const [state, setState] = useState<LiveAQIState>({
    connected: false,
    regime: "calm",
    stations: {},
    alerts: [],
    recommendations: [],
    lastTickAt: null,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);

  useEffect(() => {
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = 1000;
        setState((s) => ({ ...s, connected: true }));
      };

      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data) as TickPayload;
          if (payload.type !== "tick") return;
          const byId: Record<string, StationReading> = {};
          for (const r of payload.stations) byId[r.station_id] = r;
          setState((s) => ({
            ...s,
            regime: payload.regime,
            stations: byId,
            alerts: payload.alerts,
            recommendations: payload.recommendations,
            lastTickAt: payload.ts,
          }));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("ws parse failed", e);
        }
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, connected: false }));
        const wait = Math.min(backoffRef.current, 15_000);
        backoffRef.current = Math.min(backoffRef.current * 2, 15_000);
        setTimeout(connect, wait);
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    };

    connect();
    return () => {
      stopped = true;
      wsRef.current?.close();
    };
  }, []);

  return state;
}
