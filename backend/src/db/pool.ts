import pg from "pg";
import { env } from "../config/env.js";

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
});

pool.on("error", (err: Error) => {
  console.error("[db] unexpected error on idle client", err);
});
