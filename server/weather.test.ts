import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearWeatherCache, getCurrentWeather } from "./weather";

const config = { OPENWEATHER_API_KEY: "test-key" };
const providerResponse = {
  name: "Rayong",
  main: { temp: 31.6, humidity: 68 },
  weather: [{ description: "เมฆบางส่วน", icon: "02d" }],
  wind: { speed: 2.4 },
  clouds: { all: 35 },
};

describe("current farm weather", () => {
  beforeEach(clearWeatherCache);

  it("maps and validates current OpenWeather data", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => Response.json(providerResponse));
    const result = await getCurrentWeather(
      { ...config, FARM_LOCATION_NAME_TH: "พื้นที่ฟาร์ม" },
      fetcher,
      Date.parse("2026-09-30T10:00:00Z"),
    );
    expect(result).toEqual({
      timestamp: "2026-09-30T10:00:00.000Z",
      tempC: 31.6,
      humidity: 68,
      locationName: "พื้นที่ฟาร์ม",
      description: "เมฆบางส่วน",
      icon: "02d",
      windSpeedMps: 2.4,
      cloudinessPct: 35,
      sourceName: "OpenWeather",
    });
    expect(fetcher).toHaveBeenCalledOnce();
    const requestedUrl = new URL(String(fetcher.mock.calls[0][0]));
    expect(requestedUrl.searchParams.get("lat")).toBe("13.310314");
    expect(requestedUrl.searchParams.get("lon")).toBe("101.111504");
    expect(requestedUrl.searchParams.get("appid")).toBe("test-key");
  });

  it("does not return mock values when the API key is missing", async () => {
    await expect(getCurrentWeather({}, vi.fn())).rejects.toThrow(
      "ยังไม่ได้ตั้งค่าบริการข้อมูลอากาศ",
    );
  });

  it("rejects coordinates outside valid latitude and longitude ranges", async () => {
    await expect(
      getCurrentWeather({ ...config, FARM_LAT: "91" }, vi.fn()),
    ).rejects.toThrow("ตั้งค่าพิกัดฟาร์มไม่ถูกต้อง");
    await expect(
      getCurrentWeather({ ...config, FARM_LON: "181" }, vi.fn()),
    ).rejects.toThrow("ตั้งค่าพิกัดฟาร์มไม่ถูกต้อง");
  });

  it("returns the last real response as stale data after a provider failure", async () => {
    const first = await getCurrentWeather(
      config,
      vi.fn(async () => Response.json(providerResponse)),
      1_000,
    );
    const stale = await getCurrentWeather(
      config,
      vi.fn(async () => new Response(null, { status: 503 })),
      1_000 + 5 * 60 * 1000,
    );
    expect(first.sourceName).toBe("OpenWeather");
    expect(stale.sourceName).toBe("OpenWeather (cached)");
    expect(stale.tempC).toBe(first.tempC);
  });
});
