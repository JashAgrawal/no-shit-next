import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as authSchema from '@/src/db/auth-schema';
import * as appSchema from '@/src/db/schema';

const client = createClient({
  url: process.env.DBx_TURSO_DATABASE_URL!,
  authToken: process.env.DBx_TURSO_AUTH_TOKEN!
});

export const db = drizzle(client, {
  schema: { ...authSchema, ...appSchema }
});
