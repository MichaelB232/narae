import { SchemaType, type Tool, type ToolExecContext } from "./types.js";

// Fungsi: menandai pasien MINTA secara eksplisit dipanggilkan perawat — satu-satunya tool
// yang boleh memicu pembuatan help_request. Jangan dipanggil hanya karena AI tidak tahu jawaban.
export const requestNurseCallTool: Tool = {
  name: "request_nurse_call",
  oneLineDescription: "Menandai bahwa pasien secara eksplisit minta dipanggilkan perawat.",
  declaration: {
    name: "request_nurse_call",
    description:
      "Panggil HANYA kalau pasien secara eksplisit bilang dia butuh/minta perawat dipanggil " +
      "(misal 'panggilkan suster', atau dia menjawab 'ya' saat kamu tawarkan memanggil perawat). " +
      "JANGAN panggil ini hanya karena kamu tidak tahu jawaban suatu pertanyaan.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  async execute(_args: unknown, ctx: ToolExecContext) {
    ctx.markEscalate();
    return { acknowledged: true };
  },
};
