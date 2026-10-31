
import { GoogleGenAI } from "@google/genai";

export interface GeminiClientOptions {
  apiKey: string;
  model: string;
}

export function createGeminiClient(opts: GeminiClientOptions) {
  if (!opts.apiKey) {
    throw new Error(
      "GEMINI_API_KEY belum diisi — isi di .env sebelum memanggil endpoint AI."
    );
  }

  return new GoogleGenAI({
    apiKey: opts.apiKey,
  });
}
