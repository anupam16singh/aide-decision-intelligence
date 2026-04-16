import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Forecast } from "../lib/types";

export function useForecast(stationId: string | null, refreshMs = 30_000) {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stationId) {
      setForecast(null);
      return;
    }
    let cancelled = false;
    const fetchIt = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<Forecast>(`/api/forecast/${stationId}`);
        if (!cancelled) {
          setForecast(data);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "forecast error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchIt();
    const id = setInterval(fetchIt, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [stationId, refreshMs]);

  return { forecast, loading, error };
}
