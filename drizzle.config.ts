import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

export default defineConfig({
  out: './drizzle',
  schema: ['./src/db/auth-schema.ts', './src/db/schema.ts'],
  dialect: "turso",
  dbCredentials: {
    url: process.env.DBx_TURSO_DATABASE_URL!,
    authToken: process.env.DBx_TURSO_AUTH_TOKEN!,
  },
});
