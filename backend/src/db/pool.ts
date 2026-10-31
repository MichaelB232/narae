import pg from "pg";
import { env } from "../config/env.js";

// Pertahankan tipe DATE (OID 1082) sebagai string 'YYYY-MM-DD' dari PostgreSQL
pg.types.setTypeParser(1082, (val: string) => val);

const isLocal = env.databaseUrl.includes("localhost") || env.databaseUrl.includes("127.0.0.1");

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

pool.on("error", (err: Error) => {
  console.error("[db] unexpected error on idle client", err);
});
