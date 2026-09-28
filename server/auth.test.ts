import { describe, expect, it } from 'vitest';
import { getStaff, type AppEnv } from './auth';

const localRequest = new Request('http://127.0.0.1:8787/api/me');
const env = {
  DATABASE_URL: 'postgresql://local:local@localhost:5432/metafarm',
  OWNER_EMAIL: 'owner@example.com',
  DEV_AUTH_EMAIL: 'Owner@Example.com'
} as AppEnv;

describe('admin authorization', () => {
  it('allows the owner in local development only', async () => {
    expect(await getStaff(localRequest, env)).toEqual({ email: 'owner@example.com', role: 'owner' });
  });

  it('does not bypass Access when an audience is configured', async () => {
    expect(await getStaff(localRequest, { ...env, ACCESS_AUD: 'production-app' })).toBeNull();
  });

  it('does not bypass Access on a public hostname', async () => {
    expect(await getStaff(new Request('https://metafarm.example/api/me'), env)).toBeNull();
  });
});
