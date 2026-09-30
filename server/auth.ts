import { createRemoteJWKSet, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { staff } from './db/schema';

export type StaffSession = { email: string; role: 'owner' | 'staff' };
export type AppEnv = Env & {
  DATABASE_URL?: string;
  OWNER_EMAIL?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  DEV_AUTH_EMAIL?: string;
  OPENWEATHER_API_KEY?: string;
  FARM_LAT?: string;
  FARM_LON?: string;
  FARM_LOCATION_NAME_TH?: string;
};

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function getStaff(request: Request, bindings: AppEnv): Promise<StaffSession | null> {
  if (!bindings.DATABASE_URL || !bindings.OWNER_EMAIL) return null;

  let email: string | undefined;
  const hostname = new URL(request.url).hostname;
  if (!bindings.ACCESS_AUD && (hostname === '127.0.0.1' || hostname === 'localhost') && bindings.DEV_AUTH_EMAIL) {
    email = bindings.DEV_AUTH_EMAIL;
  } else {
    const token = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!token || !bindings.ACCESS_TEAM_DOMAIN || !bindings.ACCESS_AUD) return null;
    const teamDomain = new URL(bindings.ACCESS_TEAM_DOMAIN).origin;
    let keys = keySets.get(teamDomain);
    if (!keys) {
      keys = createRemoteJWKSet(new URL('/cdn-cgi/access/certs', teamDomain));
      keySets.set(teamDomain, keys);
    }
    try {
      const { payload } = await jwtVerify(token, keys, { issuer: teamDomain, audience: bindings.ACCESS_AUD });
      email = typeof payload.email === 'string' ? payload.email : undefined;
    } catch {
      return null;
    }
  }

  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  if (normalized === bindings.OWNER_EMAIL.trim().toLowerCase()) return { email: normalized, role: 'owner' };
  const [member] = await getDb(bindings.DATABASE_URL).select().from(staff).where(eq(staff.email, normalized)).limit(1);
  return member?.active ? { email: normalized, role: 'staff' } : null;
}
