import { useState, useEffect } from "react";
import { BottomSheet } from "./BottomSheet";
import { isTimeOverlap } from "../utils";
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
  currentTask: {
    task_name: string;
    scheduled_time: string;
    duration_minutes: number;
  };
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
  const [selectedSide, setSelectedSide] = useState<1 | 2>(1);

  const [time1, setTime1] = useState(currentTask.scheduled_time.slice(0, 5));
  const [dur1, setDur1] = useState(currentTask.duration_minutes);

  const [time2, setTime2] = useState("12:00");
  const [dur2, setDur2] = useState(15);
  const [isConflictingActive, setIsConflictingActive] = useState(true);

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

  const stillOverlaps = isConflictingActive
    ? isTimeOverlap(time1, dur1, time2, dur2)
    : false;

  const isResolved = !stillOverlaps;

  function handleDeleteConflicting() {
    onResolve({
      type: "proceed",
      newCurrentTime: time1,
      deleteConflictId: conflictingTask!.id,
    });
  }

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
      <h2 className="m-0 mb-0.5 text-lg font-bold text-ink">
        {isResolved ? "Jadwal Telah Disesuaikan" : "Jadwal Bertabrakan"}
      </h2>
      <p className="m-0 mb-4 text-[12.5px] text-mute">
        {isResolved
          ? "Jadwal sudah tidak bertabrakan"
          : "Edit atau sesuaikan salah satu kegiatan untuk melanjutkan"}
      </p>

      {/* Grid 2 Kartu Berdampingan */}
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        {/* KARTU 1 (Aktivitas Baru yang sedang dibuat) */}
        <div
          onClick={() => { setSelectedSide(1); setIsEditingTime(false); }}
          className={`cursor-pointer rounded-2xl p-3 transition-all duration-200 border-2 ${
            selectedSide === 1
              ? "border-navy bg-navy-soft shadow-[0_2px_8px_rgba(62,98,124,0.15)]"
              : "border-line bg-surface"
          }`}
        >
          <div className="mb-0.5 text-xs font-bold text-navy">
            Aktivitas Baru
          </div>
          <div className="mb-2 truncate text-sm font-bold text-ink">
            {currentTask.task_name}
          </div>

          <div className="text-xs font-bold text-ink">Jam Mulai</div>
          <div className="mb-1.5 text-[13px] text-mute">{time1} WIB</div>

          <div className="text-xs font-bold text-ink">Durasi</div>
          <div className="text-[13px] text-mute">{dur1} Menit</div>
        </div>

        {/* KARTU 2 (Aktivitas Eksisting yang Bertabrakan) */}
        <div
          onClick={() => { setSelectedSide(2); setIsEditingTime(false); }}
          className={`cursor-pointer rounded-2xl p-3 transition-all duration-200 border-2 ${
            selectedSide === 2
              ? "border-navy bg-navy-soft shadow-[0_2px_8px_rgba(62,98,124,0.15)]"
              : "border-line bg-surface"
          } ${isConflictingActive ? "opacity-100" : "opacity-60"}`}
        >
          <div className="mb-0.5 flex items-center justify-between">
            <span className="text-xs font-bold text-mute">
              {conflictingTask.type === "RECURRING" ? "Berulang" : "Appointment"}
            </span>
            {!isConflictingActive && (
              <span className="rounded-full bg-alert-soft px-1.5 py-0.5 text-[9px] font-bold text-alert">
                Nonaktif
              </span>
            )}
          </div>
          <div className="mb-2 truncate text-sm font-bold text-ink">
            {conflictingTask.task_name}
          </div>

          <div className="text-xs font-bold text-ink">Jam Mulai</div>
          <div className="mb-1.5 text-[13px] text-mute">{time2} WIB</div>

          <div className="text-xs font-bold text-ink">Durasi</div>
          <div className="text-[13px] text-mute">{dur2} Menit</div>
        </div>
      </div>

      {/* Panel Edit Waktu atau Aksi Sesuai Kartu yang Dipilih */}
      <div className="mb-4 rounded-xl bg-surface-sunken px-3.5 py-2.5">
        <div className="mb-1.5 text-xs font-bold text-ink">
          Pilihan untuk: {selectedSide === 1 ? currentTask.task_name : conflictingTask.task_name}
        </div>

        {selectedSide === 2 && conflictingTask.type === "RECURRING" && (
          <div className="my-1.5 flex items-center justify-between">
            <span className="text-xs text-ink">Status Tugas Berulang:</span>
            <button
              type="button"
              onClick={() => setIsConflictingActive(!isConflictingActive)}
              className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-bold text-white transition active:scale-95 ${
                isConflictingActive ? "bg-sage" : "bg-alert"
              }`}
            >
              {isConflictingActive ? "Aktif" : "Dinonaktifkan"}
            </button>
          </div>
        )}

        {isEditingTime ? (
          <div className="mt-1.5 flex items-center gap-2">
            <label className="text-xs font-bold text-ink">Ubah Jam:</label>
            <input
              type="time"
              value={selectedSide === 1 ? time1 : time2}
              onChange={(e) => {
                if (selectedSide === 1) setTime1(e.target.value);
                else setTime2(e.target.value);
              }}
              className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink focus:border-navy focus:outline-none"
            />
          </div>
        ) : (
          <div className="text-xs text-mute">
            Tekan tombol <b>Edit</b> di bawah untuk mengubah jam aktivitas ini.
          </div>
        )}
      </div>

      {/* Notice apakah masih bertabrakan */}
      {stillOverlaps && (
        <div className="mb-3.5 rounded-lg border border-alert/20 bg-alert-soft p-2.5 text-xs text-alert">
          ⚠️ Waktu masih bertabrakan ({time1} durasi {dur1}m vs {time2} durasi {dur2}m). Silakan geser jam atau nonaktifkan tugas.
        </div>
      )}

      {/* TOMBOL AKSI */}
      {isResolved ? (
        <div>
          <button
            type="button"
            className="w-full cursor-pointer rounded-full bg-sage py-3.25 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99]"
            onClick={handleSaveAdjusted}
          >
            Simpan Aktivitas
          </button>
          <div className="mt-2">
            <button
              type="button"
              className="w-full cursor-pointer rounded-full bg-surface-sunken py-3 px-4 text-center text-sm font-bold text-ink transition hover:opacity-90 active:scale-[0.99]"
              onClick={onClose}
            >
              Kembali
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-2 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              className="cursor-pointer rounded-full bg-navy py-3 px-4 text-center text-[13px] font-bold text-white transition hover:opacity-90 active:scale-[0.99]"
              onClick={() => setIsEditingTime(true)}
            >
              Edit
            </button>
            <button
              type="button"
              disabled={selectedSide === 1 || conflictingTask.type === "RECURRING"}
              title={selectedSide === 1 ? "Pilih aktivitas 2 untuk menghapus" : conflictingTask.type === "RECURRING" ? "Tugas berulang gunakan tombol nonaktifkan" : "Hapus tugas appointment"}
              onClick={handleDeleteConflicting}
              className={`rounded-full py-3 px-4 text-center text-[13px] font-bold text-white transition ${
                selectedSide === 1 || conflictingTask.type === "RECURRING"
                  ? "cursor-not-allowed bg-alert/45 opacity-50"
                  : "cursor-pointer bg-alert hover:opacity-90 active:scale-[0.99]"
              }`}
            >
              Hapus
            </button>
          </div>
          <button
            type="button"
            className="w-full cursor-pointer rounded-full bg-surface-sunken py-3 px-4 text-center text-sm font-bold text-ink transition hover:opacity-90 active:scale-[0.99]"
            onClick={onClose}
          >
            Kembali
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
