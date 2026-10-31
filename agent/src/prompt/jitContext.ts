import type { PatientIdentity } from "../types.js";

// ======================================================================
// INI bagian "JIT prompt injection" yang dimaksud: dibangun ULANG dari nol
// setiap kali endpoint /ai/converse dipanggil, ditarik langsung dari DB saat
// itu juga lewat backend (bukan template statis, bukan di-cache).
//
// Kenapa cuma identitas pasien + catatan perawatan yang disuntik di sini,
// sementara jadwal/barang TIDAK? Karena dua itu kecil, murah, dan hampir
// selalu relevan di awal percakapan apapun topiknya — sedangkan jadwal/barang
// bisa panjang dan tidak selalu relevan, jadi diambil AI sendiri lewat tool
// hanya kalau benar-benar dibutuhkan (hemat token, dan closed-world tetap
// terjaga karena sumbernya persis sama: query DB yang sama dengan dashboard).
// ======================================================================
export function buildJitContext(patient: PatientIdentity): string {
  return `Pasien yang sedang bicara denganmu saat ini: ${patient.name} (id pasien: ${patient.id}).
Catatan perawatan dari perawat (konteks tambahan, JANGAN dibacakan verbatim ke pasien): ${
    patient.clinical_notes || "(tidak ada catatan khusus)"
  }`;
}
