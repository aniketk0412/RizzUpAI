import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

const sql = neon(connectionString);

export const db: NeonHttpDatabase<typeof schema> = drizzle(sql, { schema });

export function isDatabaseConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes('placeholder:placeholder')
  );
}
