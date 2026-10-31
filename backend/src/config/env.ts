import dotenv from "dotenv";
import path from "node:path";

// Load .env di direktori saat ini, fallback juga coba load dari root project
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Env var ${name} wajib diisi`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "postgres://narae:narae_dev_password@localhost:5432/narae",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
};
