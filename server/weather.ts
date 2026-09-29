import { z } from "zod";
import { HttpError } from "./http";
import type { AppEnv } from "./auth";

const providerWeather = z.object({
  name: z.string().optional(),
  main: z.object({ temp: z.number(), humidity: z.number().min(0).max(100) }),
  weather: z.array(z.object({
    description: z.string(),
    icon: z.string().regex(/^\d{2}[dn]$/),
  })).min(1),
  wind: z.object({ speed: z.number().nonnegative() }).optional(),
  clouds: z.object({ all: z.number().min(0).max(100) }).optional(),
});

export type WeatherData = {
  timestamp: string;
  tempC: number;
  humidity: number;
  locationName: string;
  description: string;
  icon: string;
  windSpeedMps: number | null;
  cloudinessPct: number | null;
  sourceName: "OpenWeather" | "OpenWeather (cached)";
};

type CachedWeather = { value: WeatherData; expiresAt: number };
let cachedWeather: CachedWeather | null = null;
const cacheTtlMs = 5 * 60 * 1000;
const defaultLatitude = "13.310314";
const defaultLongitude = "101.111504";
const defaultLocation = "พื้นที่ฟาร์ม";

function farmCoordinate(
  value: string | undefined,
  fallback: string,
  limit: number,
): number {
  const coordinate = Number(value ?? fallback);
  if (!Number.isFinite(coordinate) || Math.abs(coordinate) > limit) {
    throw new HttpError(503, "ตั้งค่าพิกัดฟาร์มไม่ถูกต้อง");
  }
  return coordinate;
}

export async function getCurrentWeather(
  config: Pick<AppEnv, "OPENWEATHER_API_KEY" | "FARM_LAT" | "FARM_LON" | "FARM_LOCATION_NAME_TH">,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<WeatherData> {
  if (cachedWeather && cachedWeather.expiresAt > now) return cachedWeather.value;
  if (!config.OPENWEATHER_API_KEY) {
    throw new HttpError(503, "ยังไม่ได้ตั้งค่าบริการข้อมูลอากาศ");
  }

  const latitude = farmCoordinate(config.FARM_LAT, defaultLatitude, 90);
  const longitude = farmCoordinate(config.FARM_LON, defaultLongitude, 180);
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("appid", config.OPENWEATHER_API_KEY);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "th");

  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error("Weather provider returned an error");
    const parsed = providerWeather.safeParse(await response.json());
    if (!parsed.success) throw new Error("Weather provider returned invalid data");
    const current = parsed.data;
    const value: WeatherData = {
      timestamp: new Date(now).toISOString(),
      tempC: current.main.temp,
      humidity: current.main.humidity,
      locationName: config.FARM_LOCATION_NAME_TH?.trim() || current.name || defaultLocation,
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      windSpeedMps: current.wind?.speed ?? null,
      cloudinessPct: current.clouds?.all ?? null,
      sourceName: "OpenWeather",
    };
    cachedWeather = { value, expiresAt: now + cacheTtlMs };
    return value;
  } catch {
    if (cachedWeather) {
      return { ...cachedWeather.value, sourceName: "OpenWeather (cached)" };
    }
    throw new HttpError(502, "โหลดข้อมูลอากาศไม่สำเร็จ");
  }
}

export function clearWeatherCache(): void {
  cachedWeather = null;
}
