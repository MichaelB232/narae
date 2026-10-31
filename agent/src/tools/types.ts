import { Type, type FunctionDeclaration } from "@google/genai";
import type { AgentDataProvider, PatientIdentity } from "../types.js";

export { Type as SchemaType };

export interface ToolExecContext {
  patient: PatientIdentity;
  provider: AgentDataProvider;
  markEscalate: () => void;
}

export interface Tool {
  name: string;
  /** Penjelasan singkat 1 kalimat — dipakai juga sebagai dokumentasi di README agent. */
  oneLineDescription: string;
  /** Skema function-calling yang dikirim ke Gemini. */
  declaration: FunctionDeclaration;
  execute(args: unknown, ctx: ToolExecContext): Promise<unknown>;
}
