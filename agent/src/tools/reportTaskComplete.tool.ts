import { SchemaType, type Tool, type ToolExecContext } from "./types.js";

export const reportTaskCompleteTool: Tool = {
  name: "report_task_complete",
  oneLineDescription: "Mencatat klaim pasien bahwa tugas/kegiatan tertentu telah selesai dilakukan.",
  declaration: {
    name: "report_task_complete",
    description:
      "Gunakan tool ini HANYA jika pasien secara spesifik menyebutkan nama kegiatan atau tugas tertentu yang telah selesai " +
      "(contoh: 'sudah minum obat', 'sudah sarapan', 'sudah jalan pagi'). " +
      "JANGAN panggil jika pasien hanya mengatakan kalimat umum seperti 'saya sudah menyelesaikan tugas' tanpa menyebutkan nama tugasnya.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskName: {
          type: SchemaType.STRING,
          description: "Nama tugas atau kata kunci kegiatan spesifik yang dilaporkan selesai oleh pasien.",
        },
      },
      required: ["taskName"],
    },
  },
  async execute(args: unknown, ctx: ToolExecContext) {
    const { taskName } = (args as { taskName?: string }) || {};
    if (!ctx.provider.reportTaskComplete) {
      return { success: false, message: "Pelaporan tugas belum didukung provider data." };
    }
    return await ctx.provider.reportTaskComplete(ctx.patient.id, taskName || "");
  },
};
