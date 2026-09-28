import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function getDb(databaseUrl: string) {
  return drizzle(databaseUrl, { schema });
}
