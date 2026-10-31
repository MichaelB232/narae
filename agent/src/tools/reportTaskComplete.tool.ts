import { SchemaType, type Tool, type ToolExecContext } from "./types.js";

export const reportTaskCompleteTool: Tool = {
  name: "report_task_complete",
  oneLineDescription: "Mencatat klaim pasien bahwa tugas/kegiatan tertentu telah selesai dilakukan.",
  declaration: {
    name: "report_task_complete",
    description:
      "Gunakan tool ini ketika pasien menyatakan atau melapor bahwa ia sudah melakukan/menyelesaikan jadwal atau kegiatan tertentu " +
      "(contoh: 'sudah minum obat', 'sudah sarapan', 'sudah jalan pagi').",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskName: {
          type: SchemaType.STRING,
          description: "Nama tugas atau kata kunci kegiatan yang dilaporkan selesai oleh pasien.",
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
