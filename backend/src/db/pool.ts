import pg from "pg";
import { env } from "../config/env.js";

// Pertahankan tipe DATE (OID 1082) sebagai string 'YYYY-MM-DD' dari PostgreSQL
pg.types.setTypeParser(1082, (val: string) => val);

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
});

pool.on("error", (err: Error) => {
  console.error("[db] unexpected error on idle client", err);
});
