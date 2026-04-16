import { useMemo } from "react";
import { bandFor } from "../lib/aqi";
import type { Alert, Recommendation, StationReading } from "../lib/types";

interface Props {
  stations: StationReading[];
  alerts: Alert[];
  recommendations: Recommendation[];
  model: string | null;
  lastTickAt: string | null;
}

interface BandBucket {
  label: string;
  count: number;
  pct: number;
  gray: string;
}

export function CityOverview({
  stations,
  alerts,
  recommendations,
  model,
  lastTickAt,
}: Props) {
  const stats = useMemo(() => {
    if (!stations.length) {
      return null;
    }
    let sum = 0;
    let max = 0;
    let maxStation = "";
    let severe = 0;
    let worstPm25 = 0;
    let worstPm25Station = "";
    const buckets: Record<string, BandBucket> = {};

    for (const s of stations) {
      sum += s.aqi;
      if (s.aqi > max) {
        max = s.aqi;
        maxStation = s.station_name;
      }
      if (s.aqi > 300) severe += 1;
      if (s.pm25 > worstPm25) {
        worstPm25 = s.pm25;
        worstPm25Station = s.station_name;
      }
      const b = bandFor(s.aqi);
      buckets[b.name] = buckets[b.name] ?? {
        label: b.label,
        count: 0,
        pct: 0,
        gray: b.gray,
      };
      buckets[b.name].count += 1;
    }
    const avg = Math.round(sum / stations.length);
    const bandList = Object.values(buckets).map((x) => ({
      ...x,
      pct: x.count / stations.length,
    }));
    return {
      avg,
      max,
      maxStation,
      severe,
      worstPm25: Math.round(worstPm25),
      worstPm25Station,
      bandList,
    };
  }, [stations]);

  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;
  const warningAlerts  = alerts.filter((a) => a.severity === "warning").length;
  const highUrgency    = recommendations.filter((r) => r.urgency >= 7).length;
  const syncedAt = lastTickAt ? new Date(lastTickAt) : null;

  return (
    <section className="border-b border-cmd-border bg-cmd-surface">
      <div className="px-3 py-1.5 border-b border-cmd-border flex items-center justify-between">
        <span className="text-2xs font-mono uppercase tracking-[0.18em] text-cmd-dim">
          01 · City Overview — Delhi NCR
        </span>
        <span className="text-2xs font-mono text-cmd-muted">
          {stations.length ? `${stations.length} stations live` : "awaiting feed"}
          {syncedAt && ` · synced ${syncedAt.toLocaleTimeString([], { hour12: false })}`}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 divide-x divide-cmd-border">
        <Metric
          label="Mean AQI"
          value={stats ? String(stats.avg) : "—"}
          sub="city avg"
        />
        <Metric
          label="Peak AQI"
          value={stats ? String(stats.max) : "—"}
          sub={stats?.maxStation ?? "—"}
          emphasize={!!stats && stats.max > 300}
        />
        <Metric
          label="Severe Zones"
          value={stats ? `${stats.severe}/${stations.length}` : "—"}
          sub="AQI > 300"
          emphasize={!!stats && stats.severe > 0}
        />
        <Metric
          label="PM2.5 Peak"
          value={stats ? `${stats.worstPm25}` : "—"}
          sub={`µg/m³ · ${stats?.worstPm25Station ?? "—"}`}
        />
        <Metric
          label="Alerts · CRIT"
          value={String(criticalAlerts).padStart(2, "0")}
          sub={`${warningAlerts} warn / ${alerts.length} total`}
          emphasize={criticalAlerts > 0}
        />
        <Metric
          label="Actions"
          value={String(recommendations.length).padStart(2, "0")}
          sub={`${highUrgency} high-urgency`}
        />
        <Metric
          label="Model"
          value={model ? model.toUpperCase() : "--"}
          sub="RF + LSTM ensemble"
          smallValue
        />
        <Metric
          label="Tick"
          value={syncedAt ? syncedAt.toLocaleTimeString([], { hour12: false }) : "--:--:--"}
          sub="7s cadence"
          smallValue
        />
      </div>

      {stats && (
        <div className="flex items-stretch h-2 w-full border-t border-cmd-border">
          {stats.bandList.map((b) => (
            <div
              key={b.label}
              title={`${b.label}: ${b.count} stations`}
              style={{
                flex: b.pct,
                background: b.gray,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  sub,
  emphasize,
  smallValue,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasize?: boolean;
  smallValue?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      <div className="flex items-center gap-1.5">
        {emphasize && (
          <span className="w-1.5 h-1.5 bg-cmd-bright animate-blink" aria-hidden />
        )}
        <span className="text-2xs font-mono uppercase tracking-[0.18em] text-cmd-muted">
          {label}
        </span>
      </div>
      <div
        className={
          smallValue
            ? "font-mono text-sm text-cmd-bright leading-none"
            : "font-mono text-xl text-cmd-bright leading-none"
        }
      >
        {value}
      </div>
      {sub && (
        <div className="text-2xs font-mono text-cmd-muted truncate">{sub}</div>
      )}
    </div>
  );
}
