import type { TaskStatus, RequestStatus } from "./types";

// Label & warna di sini SENGAJA dipetakan ke 4 kata yang dipakai di desain Figma
// (Selesai / Terlewat / Proses / Nanti), bukan menampilkan nama enum mentah dari database.
export const taskStatusMeta: Record<TaskStatus, { label: string; tone: "sage" | "rose" | "neutral" | "navy"; dotMuted: boolean }> = {
  SCHEDULED:                     { label: "Nanti",    tone: "neutral", dotMuted: true },
  REMINDER_PLAYED:               { label: "Proses",   tone: "neutral", dotMuted: false },
  REPORTED_COMPLETE_BY_PATIENT:  { label: "Butuh Persetujuan", tone: "navy", dotMuted: false },
  CONFIRMED_BY_NURSE:            { label: "Selesai",  tone: "sage",    dotMuted: false },
  REJECTED_BY_NURSE:             { label: "Belum Selesai", tone: "rose", dotMuted: false },
  MISSED:                        { label: "Terlewat", tone: "rose",    dotMuted: false },
};

export const requestStatusMeta: Record<RequestStatus, { label: string; tone: "sage" | "rose" | "neutral" | "navy" }> = {
  PENDING:      { label: "Menunggu", tone: "rose" },
  ACKNOWLEDGED: { label: "Ditangani", tone: "navy" },
  RESOLVED:     { label: "Selesai", tone: "sage" },
  EXPIRED:      { label: "Lewat waktu", tone: "rose" },
};

export const DAY_LABELS_SHORT = ["", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
export const DAY_LABELS_FULL = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
