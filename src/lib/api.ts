export type Staff = { email: string; role: 'owner' | 'staff' };
export type Hive = { id: string; code: string; name: string; species: string | null; location: string | null; status: string };
export type Harvest = { id: string; hiveId: string; harvestedAt: string; honeyMl: number; propolisG: number };
export type Inspection = { id: string; hiveId: string; inspectedAt: string; status: string; notes: string | null; imageKey: string | null };
export type TeamMember = { email: string; active: boolean };
export type Dashboard = { staff: Staff; hives: Hive[]; harvests: Harvest[]; inspections: Inspection[]; team: TeamMember[] };

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { ...(options?.body && !(options.body instanceof Blob) ? { 'Content-Type': 'application/json' } : {}), ...options?.headers },
    credentials: 'same-origin',
    cache: 'no-store'
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}
