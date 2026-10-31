import { SchemaType, type Tool, type ToolExecContext } from "./types.js";

// Memberi tahu tanggal & jam saat ini (sering ditanya pasien demensia yang disorientasi waktu).
export const getCurrentDateTimeTool: Tool = {
  name: "get_current_datetime",
  oneLineDescription: "Memberi tahu tanggal dan jam saat ini sesuai waktu server.",
  declaration: {
    name: "get_current_datetime",
    description: "Ambil tanggal dan jam sekarang. Panggil ini kalau pasien bertanya 'sekarang jam berapa' atau 'hari apa ini', jika bertanya jam cukup tanya jamnya, jika tanya hari cukup jawab hari jika tanya keduanya jawab keduanya.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  async execute(_args: unknown, _ctx: ToolExecContext) {
    const now = new Date();
    return {
      iso: now.toISOString(),
      // locale Indonesia dan zona waktu WIB (Asia/Jakarta)
      display: now.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  },
};
