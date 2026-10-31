import type { PatientIdentity } from "../types.js";

export function buildJitContext(patient: PatientIdentity): string {
  return `Pasien yang sedang bicara denganmu saat ini: ${patient.name} (id pasien: ${patient.id}). yang dirawat oleh : ${patient.caregiver_name}
Catatan perawatan dari perawat (konteks tambahan, JANGAN dibacakan verbatim ke pasien): ${patient.clinical_notes || "(tidak ada catatan khusus)"
    }`;
}
