import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { th } from "../../i18n/th";
import { api, type Weather } from "../../lib/api";
import { formatFarmDateTime } from "../../lib/date";

export function WeatherPanel() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api<Weather>("/weather/current")
      .then((value) => {
        if (active) setWeather(value);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : th.admin.weatherFailed,
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  if (loading) {
    return (
      <Card aria-busy="true" aria-label={th.admin.weatherTitle}>
        <div className="h-6 w-40 animate-pulse rounded-control bg-stone-200" />
        <div className="mt-4 h-20 animate-pulse rounded-card bg-stone-100" />
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <EmptyState
        title={th.admin.weatherUnavailable}
        description={error || th.admin.weatherNoData}
        action={
          <Button onClick={() => setAttempt((value) => value + 1)}>
            {th.common.retry}
          </Button>
        }
      />
    );
  }

  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{th.admin.weatherTitle}</h2>
          <p className="mt-1 text-sm text-stone-600">{weather.locationName}</p>
        </div>
        {weather.sourceName.endsWith("cached") && (
          <Badge tone="warning" icon="◷">
            {th.admin.weatherCached}
          </Badge>
        )}
      </div>
      <div className="mt-4 flex items-center gap-4 rounded-card bg-leaf-50 p-4">
        <img src={iconUrl} alt="" width="64" height="64" loading="lazy" />
        <div>
          <p className="text-sm font-semibold text-stone-700">
            {weather.description}
          </p>
          <p className="text-4xl font-black text-leaf-900">
            {Math.round(weather.tempC)}°C
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <WeatherMetric label={th.admin.humidity} value={`${weather.humidity}%`} />
        <WeatherMetric
          label={th.admin.windSpeed}
          value={
            weather.windSpeedMps === null
              ? "—"
              : `${weather.windSpeedMps.toFixed(1)} m/s`
          }
        />
        <WeatherMetric
          label={th.admin.cloudiness}
          value={weather.cloudinessPct === null ? "—" : `${weather.cloudinessPct}%`}
        />
      </div>
      <p className="mt-4 text-xs text-stone-600">
        {th.admin.weatherSource}: {weather.sourceName} ·{" "}
        {formatFarmDateTime(weather.timestamp)}
      </p>
    </Card>
  );
}

function WeatherMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control bg-stone-50 p-3">
      <p className="text-xs text-stone-600">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
