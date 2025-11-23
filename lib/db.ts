import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as authSchema from '@/src/db/auth-schema';
import * as appSchema from '@/src/db/schema';

const sqlite = new Database(process.env.DB_FILE_NAME || 'sqlite.db');
export const db = drizzle({
  client: sqlite,
  schema: { ...authSchema, ...appSchema }
});
