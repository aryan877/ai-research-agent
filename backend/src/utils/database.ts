import { Pool } from 'pg';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export default pool;
