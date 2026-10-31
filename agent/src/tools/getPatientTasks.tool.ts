import { SchemaType, type Tool, type ToolExecContext } from "./types.js";

// Mengambil daftar kegiatan/jadwal tugas pasien (hari ini dan mendatang).
export const getPatientTasksTool: Tool = {
  name: "get_patient_tasks",
  oneLineDescription: "Mengambil daftar jadwal tugas pasien (nama tugas, jam, durasi, tanggal, status).",
  declaration: {
    name: "get_patient_tasks",
    description:
      "Ambil seluruh daftar jadwal kegiatan atau tugas pasien" +
      "Sesuaikan dengan apa yang patient minta (misalnya hanya hari ini saja, besok atau mungkin spesifik tanggal), jika tidak ketemu cukup balas bahwa tidak memiliki data tsb"+
      "lengkap beserta jam pelaksanaan, durasi aktivitas dalam menit, tanggal, dan statusnya. " +
      "Panggil ini jika pasien bertanya tentang jadwal, kegiatan spesifik, atau menanyakan kegiatan apa selanjutnya/terdekat.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  async execute(_args: unknown, ctx: ToolExecContext) {
    const tasks = await ctx.provider.getPatientTasks(ctx.patient.id);
    return { tasks };
  },
};
