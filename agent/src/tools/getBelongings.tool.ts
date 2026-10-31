import { SchemaType, type Tool, type ToolExecContext } from "./types.js";

// Fungsi: mencari lokasi terakhir barang milik pasien yang sudah tercatat oleh perawat. (Summary)
export const getBelongingsSummaryTool: Tool = {
  name: "get_belongings_summary",
  oneLineDescription: "Mencari lokasi terakhir dan lokasi biasa/default barang milik pasien yang tercatat.",
  declaration: {
    name: "get_belongings",
    description:
      "Ambil daftar barang pasien beserta lokasi terakhirnya dan tempat biasanya ditaruh (default_location). " +
      "Panggil ini kalau pasien bertanya 'dimana [barang] saya?'. " +
      "Saat menjawab, sebutkan lokasi terakhirnya dan sebutkan juga tempat biasanya barang tersebut ditaruh jika ada datanya.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  async execute(_args: unknown, ctx: ToolExecContext) {
    const belongings = await ctx.provider.getBelongingsSummary(ctx.patient.id);
    return { belongings };
  },
};

// Mencari list barang-barang personal yang dimiliki pasien yang tersimpan di database.
export const getBelongingsTool: Tool = {
  name: "get_belongings",
  oneLineDescription: "Memberikan list barang-barang milik pasien yang tersimpan di database",
  declaration: {
    name: "get_belonging",
    description: "Ambil daftar barang-barang yang dimiliki oleh pasien berdasarkan data yang disimpan di database saja." +
      "Panggil tools ini ketika pasien bertanya mengenai daftar barang yang dimiliki cth : `[Barang] saya apa saja atau [Barang] apa saja yang saya miliki`" +
      "Saat menjawab, cukup sebutkan barang' yang ada sesuai yang ada di database",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  async execute(_args: unknown, ctx: ToolExecContext) {
    const belongings = await ctx.provider.getBelongings(ctx.patient.id)
  }
}