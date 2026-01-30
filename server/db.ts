import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Default to a dummy connection if not set, as we are primarily using MemStorage 
// per user requirements ("Projects exist in memory only").
// However, we keep this structure for compatibility with the template.
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgres://user:password@localhost:5432/db" 
});

export const db = drizzle(pool, { schema });
