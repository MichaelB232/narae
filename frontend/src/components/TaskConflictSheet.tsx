import { useState, useEffect } from "react";
import { BottomSheet } from "./BottomSheet";
import { hhmm, isTimeOverlap, toMinutes } from "../utils";
import type { TaskItem } from "../types";

export interface ConflictingTaskItem {
  id: number;
  task_name: string;
  scheduled_time: string;
  duration_minutes: number;
  type: "RECURRING" | "ONE_TIME";
  is_active: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  // Aktivitas yang sedang dibuat/diedit (Aktivitas 1)
  currentTask: {
    task_name: string;
    scheduled_time: string;
    duration_minutes: number;
  };
  // Aktivitas yang bertabrakan di database (Aktivitas 2)
  conflictingTask: TaskItem | null;
  onResolve: (action: {
    type: "proceed";
    newCurrentTime?: string;
    deactivateConflictId?: number;
    deleteConflictId?: number;
    updatedConflict?: { id: number; scheduled_time: string; duration_minutes: number };
  }) => void;
}

export function TaskConflictSheet({
  open,
  onClose,
  currentTask,
  conflictingTask,
  onResolve,
}: Props) {
  // Pilihan kartu mana yang di-select (1 = currentTask, 2 = conflictingTask)
  const [selectedSide, setSelectedSide] = useState<1 | 2>(1);

  // State waktu yang bisa diedit langsung
  const [time1, setTime1] = useState(currentTask.scheduled_time.slice(0, 5));
  const [dur1, setDur1] = useState(currentTask.duration_minutes);

  const [time2, setTime2] = useState("12:00");
  const [dur2, setDur2] = useState(15);
  const [isConflictingActive, setIsConflictingActive] = useState(true);

  // Mode inline edit waktu
  const [isEditingTime, setIsEditingTime] = useState(false);

  useEffect(() => {
    if (conflictingTask) {
      setTime1(currentTask.scheduled_time.slice(0, 5));
      setDur1(currentTask.duration_minutes);
      setTime2(conflictingTask.scheduled_time.slice(0, 5));
      setDur2(conflictingTask.duration_minutes);
      setIsConflictingActive(conflictingTask.is_active);
      setSelectedSide(1);
      setIsEditingTime(false);
    }
  }, [conflictingTask, currentTask, open]);

  if (!open || !conflictingTask) return null;

  // Cek apakah masih bertabrakan
  // Jika conflictingTask dinonaktifkan (isActive = false), maka tidak bertabrakan lagi
  const stillOverlaps = isConflictingActive
    ? isTimeOverlap(time1, dur1, time2, dur2)
    : false;

  const isResolved = !stillOverlaps;

  // Handler Hapus (untuk Aktivitas 2 jika ONE_TIME)
  function handleDeleteConflicting() {
    onResolve({
      type: "proceed",
      newCurrentTime: time1,
      deleteConflictId: conflictingTask!.id,
    });
  }

  // Handler Simpan jika sudah disesuaikan
  function handleSaveAdjusted() {
    onResolve({
      type: "proceed",
      newCurrentTime: time1,
      deactivateConflictId: !isConflictingActive ? conflictingTask!.id : undefined,
      updatedConflict:
        time2 !== conflictingTask!.scheduled_time.slice(0, 5) || dur2 !== conflictingTask!.duration_minutes
          ? { id: conflictingTask!.id, scheduled_time: time2, duration_minutes: dur2 }
          : undefined,
    });
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2>{isResolved ? "Jadwal Telah Disesuaikan" : "Jadwal Bertabrakan"}</h2>
      <p className="sheet-sub">
        {isResolved
          ? "Jadwal sudah tidak bertabrakan"
          : "Edit atau sesuaikan salah satu kegiatan untuk melanjutkan"}
      </p>

      {/* Grid 2 Kartu Berdampingan (Sesuai Gambar Desain) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {/* KARTU 1 (Aktivitas Baru yang sedang dibuat) */}
        <div
          onClick={() => { setSelectedSide(1); setIsEditingTime(false); }}
          style={{
            border: `2px solid ${selectedSide === 1 ? "#3e627c" : "var(--line)"}`,
            borderRadius: 14,
            padding: 12,
            background: selectedSide === 1 ? "#edf3f6" : "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: selectedSide === 1 ? "0 2px 8px rgba(62, 98, 124, 0.15)" : "none",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#3e627c", marginBottom: 2 }}>
            Aktivitas Baru
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentTask.task_name}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#22262b" }}>Jam Mulai</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>{time1} WIB</div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#22262b" }}>Durasi</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{dur1} Menit</div>
        </div>

        {/* KARTU 2 (Aktivitas Eksisting yang Bertabrakan) */}
        <div
          onClick={() => { setSelectedSide(2); setIsEditingTime(false); }}
          style={{
            border: `2px solid ${selectedSide === 2 ? "#3e627c" : "var(--line)"}`,
            borderRadius: 14,
            padding: 12,
            background: selectedSide === 2 ? "#edf3f6" : "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease",
            opacity: isConflictingActive ? 1 : 0.6,
            boxShadow: selectedSide === 2 ? "0 2px 8px rgba(62, 98, 124, 0.15)" : "none",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
              {conflictingTask.type === "RECURRING" ? "Berulang" : "Appointment"}
            </span>
            {!isConflictingActive && (
              <span className="pill" style={{ fontSize: 9, background: "var(--rose-soft)", color: "var(--rose)" }}>
                Nonaktif
              </span>
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {conflictingTask.task_name}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#22262b" }}>Jam Mulai</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>{time2} WIB</div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#22262b" }}>Durasi</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{dur2} Menit</div>
        </div>
      </div>

      {/* Panel Edit Waktu atau Aksi Sesuai Kartu yang Dipilih */}
      <div style={{ background: "var(--surface-sunken)", padding: "10px 14px", borderRadius: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
          Pilihan untuk: {selectedSide === 1 ? currentTask.task_name : conflictingTask.task_name}
        </div>

        {/* Jika Kartu 2 (Recurring) dipilih: bisa toggle switch nonaktifkan */}
        {selectedSide === 2 && conflictingTask.type === "RECURRING" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "6px 0" }}>
            <span style={{ fontSize: 12 }}>Status Tugas Berulang:</span>
            <button
              type="button"
              onClick={() => setIsConflictingActive(!isConflictingActive)}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: isConflictingActive ? "var(--sage)" : "var(--rose)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {isConflictingActive ? "Aktif" : "Dinonaktifkan"}
            </button>
          </div>
        )}

        {/* Form Edit Jam Mulai Inline jika mode Edit aktif */}
        {isEditingTime ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <label style={{ fontSize: 12 }}>Ubah Jam:</label>
            <input
              type="time"
              value={selectedSide === 1 ? time1 : time2}
              onChange={(e) => {
                if (selectedSide === 1) setTime1(e.target.value);
                else setTime2(e.target.value);
              }}
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)" }}
            />
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Tekan tombol <b>Edit</b> di bawah untuk mengubah jam aktivitas ini.
          </div>
        )}
      </div>

      {/* Notice apakah masih bertabrakan */}
      {stillOverlaps && (
        <div
          style={{
            background: "var(--rose-soft)",
            color: "var(--rose)",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            marginBottom: 14,
            border: "1px solid rgba(198, 83, 83, 0.2)",
          }}
        >
          ⚠️ Waktu masih bertabrakan ({time1} durasi {dur1}m vs {time2} durasi {dur2}m). Silakan geser jam atau nonaktifkan tugas.
        </div>
      )}

      {/* TOMBOL AKSI (Sesuai 2 Status pada Gambar) */}
      {isResolved ? (
        // Gambar Kanan: Jadwal Telah Disesuaikan -> [Simpan Aktivitas] & [Kembali]
        <div>
          <button
            className="btn sage"
            onClick={handleSaveAdjusted}
            style={{ width: "100%", padding: 13, fontSize: 14, fontWeight: 700 }}
          >
            Simpan Aktivitas
          </button>
          <div style={{ marginTop: 8 }}>
            <button
              className="btn ghost"
              onClick={onClose}
              style={{ width: "100%", padding: 12, fontSize: 14 }}
            >
              Kembali
            </button>
          </div>
        </div>
      ) : (
        // Gambar Kiri: Jadwal Bertabrakan -> [Edit] & [Hapus] + [Kembali]
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <button
              className="btn navy"
              onClick={() => setIsEditingTime(true)}
              style={{ padding: 12, fontSize: 13, fontWeight: 700 }}
            >
              Edit
            </button>
            <button
              className="btn rose"
              disabled={selectedSide === 1 || conflictingTask.type === "RECURRING"}
              title={selectedSide === 1 ? "Pilih aktivitas 2 untuk menghapus" : conflictingTask.type === "RECURRING" ? "Tugas berulang gunakan tombol nonaktifkan" : "Hapus tugas appointment"}
              onClick={handleDeleteConflicting}
              style={{
                padding: 12,
                fontSize: 13,
                fontWeight: 700,
                opacity: selectedSide === 1 || conflictingTask.type === "RECURRING" ? 0.45 : 1,
                cursor: selectedSide === 1 || conflictingTask.type === "RECURRING" ? "not-allowed" : "pointer",
              }}
            >
              Hapus
            </button>
          </div>
          <button
            className="btn ghost"
            onClick={onClose}
            style={{ width: "100%", padding: 12, fontSize: 14 }}
          >
            Kembali
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
