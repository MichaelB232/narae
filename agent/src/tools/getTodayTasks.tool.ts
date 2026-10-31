import { SchemaType, type Tool, type ToolExecContext } from "./types.js";

// Fungsi: mengambil jadwal tugas pasien untuk HARI INI (sumber yang sama dengan dashboard perawat).
export const getTodayTasksTool: Tool = {
  name: "get_today_tasks",
  oneLineDescription: "Mengambil daftar jadwal tugas pasien untuk hari ini (nama tugas, jam, status).",
  declaration: {
    name: "get_today_tasks",
    description:
      "Ambil jadwal tugas pasien untuk HARI INI (misalnya jadwal obat, jadwal kegiatan). " +
      "Panggil ini kalau pasien bertanya soal jadwal atau apa yang harus dia lakukan.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  async execute(_args: unknown, ctx: ToolExecContext) {
    const tasks = await ctx.provider.getTodayTasks(ctx.patient.id);
    return { tasks };
  },
};
