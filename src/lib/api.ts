import { th } from "../i18n/th";

export type Staff = { email: string; role: "owner" | "staff" };
export type Hive = {
  id: string;
  code: string;
  name: string;
  species: string | null;
  location: string | null;
  status: string;
};
export type Harvest = {
  id: string;
  hiveId: string;
  harvestedAt: string;
  honeyMl: number;
  propolisG: number;
  createdByEmail: string | null;
  createdAt: string;
};
export type Inspection = {
  id: string;
  hiveId: string;
  inspectedAt: string;
  status: string;
  notes: string | null;
  imageKey: string | null;
};
export type HistoryPage<T> = { items: T[]; nextOffset: number | null };
export type HiveDetailData = {
  hive: Hive;
  harvests: Harvest[];
  inspections: Inspection[];
  totals: {
    harvestCount: number;
    honeyMl: number;
    propolisG: number;
    inspectionCount: number;
  };
};
export type TeamMember = { email: string; active: boolean };
export type DashboardSummaryData = {
  month: string;
  hiveStatuses: Record<"Strong" | "Normal" | "Weak" | "Empty", number>;
  hiveCount: number;
  harvestCount: number;
  inspectionCount: number;
  totalHoneyMl: number;
  totalPropolisG: number;
  monthlyHarvestCount: number;
  monthlyHoneyMl: number;
  monthlyPropolisG: number;
};
export type Dashboard = {
  staff: Staff;
  summary: DashboardSummaryData;
  hives: Hive[];
  harvests: Harvest[];
  inspections: Inspection[];
  team: TeamMember[];
};
export type Weather = {
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

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        ...(options?.body && !(options.body instanceof Blob)
          ? { "Content-Type": "application/json" }
          : {}),
        ...options?.headers,
      },
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new Error(th.common.networkError);
  }
  if (response.status === 401) throw new Error(th.common.sessionExpired);
  if (response.status === 403) throw new Error(th.common.accessDenied);
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(th.common.sessionExpired);
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error(th.common.invalidResponse);
  }
  if (!response.ok) {
    const error =
      result && typeof result === "object" && "error" in result
        ? result.error
        : null;
    throw new Error(typeof error === "string" ? error : th.common.invalidResponse);
  }
  return result as T;
}
