import { useState, useEffect, useRef } from "react";
import { BottomSheet } from "./BottomSheet";
import { api } from "../api/client";
import { speakNaturalVoice } from "../tts";
import { getWibTimeHHMM, getWibDateISO, isTimeInPastWib, isTimeOverlap } from "../utils";
import { TaskConflictSheet } from "./TaskConflictSheet";
import type { TaskItem } from "../types";

const DAYS = [
  { value: 1, label: "Sen" },
  { value: 2, label: "Sel" },
  { value: 3, label: "Rab" },
  { value: 4, label: "Kam" },
  { value: 5, label: "Jum" },
  { value: 6, label: "Sab" },
  { value: 7, label: "Min" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  patientId: number;
  nurseId: number;
  existing?: TaskItem;
  allTasks?: TaskItem[];
  onShowToast: (title: string, subtitle: string) => void;
}

export function TaskFormSheet({
  open,
  onClose,
  onSaved,
  patientId,
  nurseId,
  existing,
  allTasks = [],
  onShowToast,
}: Props) {
  const isEdit = Boolean(existing);
  const [step, setStep] = useState<"form" | "verify">("form");

  const [taskName, setTaskName] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [days, setDays] = useState<number[]>([1]);
  const [time, setTime] = useState(getWibTimeHHMM());
  const [duration, setDuration] = useState(15);
  const [targetDate, setTargetDate] = useState<string>(getWibDateISO(0));
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // State untuk popup Jadwal Bertabrakan
  const [conflictTask, setConflictTask] = useState<TaskItem | null>(null);

  // Audio preview state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSeconds, setPlaySeconds] = useState(0);
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const today = getWibDateISO(0);
    if (existing) {
      setTaskName(existing.task_name);
      setRecurring(existing.type === "RECURRING");
      setDays(existing.days_of_week ?? []);
      setTime(existing.scheduled_time?.slice(0, 5) ?? getWibTimeHHMM());
      setDuration(existing.duration_minutes ?? 15);
      setIsActive(existing.is_active ?? true);
      if (existing.scheduled_date) {
        setTargetDate(existing.scheduled_date.slice(0, 10));
      } else {
        setTargetDate(today);
      }
    } else {
      setTaskName("");
      setRecurring(true);
      setDays([1]);
      setTime(getWibTimeHHMM());
      setDuration(15);
      setTargetDate(today);
      setIsActive(true);
    }
    setStep("form");
    setConflictTask(null);
    stopPlayback();
  }, [existing, open]);

  function stopPlayback() {
    if (stopVoiceRef.current) {
      try {
        stopVoiceRef.current();
      } catch {}
      stopVoiceRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setPlaySeconds(0);
  }

  function handleClose() {
    stopPlayback();
    setStep("form");
    setConflictTask(null);
    onClose();
  }

  function checkConflictAndProceed() {
    const scheduledDateVal = !recurring ? targetDate : null;

    const overlap = allTasks.find((t) => {
      if (existing && t.id === existing.id) return false;
      if (!t.is_active) return false;

      let dayMatches = false;
      if (recurring) {
        if (!t.days_of_week || t.days_of_week.length === 0) dayMatches = true;
        else if (days.length === 0) dayMatches = true;
        else dayMatches = days.some((d) => t.days_of_week?.includes(d));
      } else {
        if (t.type === "ONE_TIME") {
          dayMatches = t.scheduled_date?.slice(0, 10) === scheduledDateVal;
        } else {
          if (t.days_of_week && t.days_of_week.length > 0) {
            const [y, m, d] = targetDate.split("-").map(Number);
            const dt = new Date(y, m - 1, d);
            const dayOfWeek = dt.getDay() === 0 ? 7 : dt.getDay();
            dayMatches = t.days_of_week.includes(dayOfWeek);
          } else {
            dayMatches = true;
          }
        }
      }

      if (!dayMatches) return false;
      return isTimeOverlap(time, duration, t.scheduled_time.slice(0, 5), t.duration_minutes);
    });

    if (overlap) {
      setConflictTask(overlap);
    } else {
      setStep("verify");
    }
  }

  function toggleAudioPreview() {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    setIsPlaying(true);
    setPlaySeconds(0);

    timerRef.current = setInterval(() => {
      setPlaySeconds((prev) => prev + 1);
    }, 1000);

    const spokenText = `Waktunya ${taskName}. Pukul ${time.replace(":", ".")}, durasi ${duration} menit.`;
    const controller = speakNaturalVoice(
      spokenText,
      () => {},
      () => stopPlayback(),
      () => stopPlayback()
    );
    stopVoiceRef.current = controller.stop;
  }

  async function handleFinalSave() {
    stopPlayback();
    setSaving(true);
    try {
      if (isEdit && existing) {
        await api.updateTask(existing.id, {
          taskName,
          scheduledTime: time,
          durationMinutes: duration,
          isActive,
          type: recurring ? "RECURRING" : "ONE_TIME",
          daysOfWeek: recurring && days.length > 0 ? days : null,
          scheduledDate: !recurring ? targetDate : null,
        });

        onSaved();
        handleClose();
        onShowToast("Aktivitas Berhasil Disimpan", `${taskName} pada ${time} WIB`);
      } else {
        const scheduledDate = !recurring ? targetDate : null;

        await api.createTask({
          patientId,
          createdBy: nurseId,
          taskName,
          spokenInstruction: `Waktunya ${taskName}.`,
          type: recurring ? "RECURRING" : "ONE_TIME",
          daysOfWeek: recurring && days.length > 0 ? days : null,
          scheduledTime: time,
          durationMinutes: duration,
          scheduledDate,
        });

        onSaved();
        handleClose();
        const dateNote = !recurring ? ` (${targetDate})` : "";
        onShowToast(
          "Aktivitas Berhasil Ditambahkan",
          `${taskName} pada ${time} WIB${dateNote}`
        );
      }
    } catch (err: any) {
      alert("Gagal menyimpan aktivitas: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const todayStr = getWibDateISO(0);
  const isTargetToday = !recurring && targetDate === todayStr;
  const timeInPast = !isEdit && isTargetToday && isTimeInPastWib(time);

  const dayDisplay =
    recurring && days.length > 0
      ? days.map((d) => DAYS.find((x) => x.value === d)?.label).join(", ")
      : recurring
      ? "Setiap Hari"
      : targetDate === todayStr
      ? `Hari Ini (${todayStr})`
      : targetDate === getWibDateISO(1)
      ? `Besok (${getWibDateISO(1)})`
      : `Tanggal ${targetDate}`;

  // ========== STEP 2: CEK AI VOICE (VERIFY) ==========
  if (step === "verify") {
    return (
      <BottomSheet open={open} onClose={handleClose}>
        <h2 className="m-0 mb-0.5 text-lg font-bold text-ink">Cek AI Voice</h2>
        <p className="m-0 mb-4 text-[12.5px] text-mute">Pastikan suara AI sesuai dengan aktivitas</p>

        {/* Audio Player Card */}
        <div className="mb-5 flex items-center gap-3.5 rounded-2xl border border-[#dbe6ec] bg-[#edf3f6] p-3.5 px-4">
          <button
            type="button"
            onClick={toggleAudioPreview}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-navy text-lg text-white shadow-[0_2px_6px_rgba(62,98,124,0.3)] transition hover:opacity-90 active:scale-95"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <div className="flex-1 min-w-0">
            <div className="truncate text-base font-bold text-[#1c2b38]">
              {taskName || "Nama Aktivitas"}
            </div>
            <div className="mt-0.5 text-[13px] text-mute">
              {isPlaying
                ? `0:${String(playSeconds).padStart(2, "0")}`
                : "0:30"}
            </div>
          </div>
        </div>

        {/* Summary Info */}
        <div className="mb-5">
          <div className="mb-3">
            <div className="text-[13px] font-bold text-ink">
              Nama Aktivitas
            </div>
            <div className="mt-0.5 text-[15px] text-mute">
              {taskName}
            </div>
          </div>

          <div className="mb-3 flex gap-2.5">
            <div className="flex-1">
              <div className="text-[13px] font-bold text-ink">
                Berulang
              </div>
              <div className="mt-0.5 text-[15px] text-mute">
                {recurring ? "Ya" : "Tidak"}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-ink">
                Jadwal
              </div>
              <div className="mt-0.5 text-[15px] text-mute">
                {dayDisplay}
              </div>
            </div>
          </div>

          <div className="mb-3 flex gap-2.5">
            <div className="flex-1">
              <div className="text-[13px] font-bold text-ink">
                Jam Mulai
              </div>
              <div className="mt-0.5 text-[15px] text-mute">
                {time} WIB
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-ink">
                Durasi
              </div>
              <div className="mt-0.5 text-[15px] text-mute">
                {duration} Menit
              </div>
            </div>
          </div>

          {isEdit && (
            <div className="mt-2">
              <div className="text-[13px] font-bold text-ink">
                Status Tugas
              </div>
              <div className={`mt-0.5 text-sm font-semibold ${isActive ? "text-sage" : "text-alert"}`}>
                {isActive ? "● Aktif Dijalankan" : "○ Dinonaktifkan Sementara"}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6">
          <button
            type="button"
            className="w-full cursor-pointer rounded-full bg-sage py-3.25 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            disabled={saving}
            onClick={handleFinalSave}
          >
            {saving ? "Menyimpan…" : "Simpan Aktivitas"}
          </button>
        </div>
        <div className="mt-2">
          <button
            type="button"
            className="w-full cursor-pointer rounded-full bg-surface-sunken py-3 px-4 text-center text-sm font-bold text-ink transition hover:opacity-90 active:scale-[0.99]"
            onClick={() => {
              stopPlayback();
              setStep("form");
            }}
          >
            Kembali
          </button>
        </div>
      </BottomSheet>
    );
  }

  // ========== STEP 1: FORM (CREATE / EDIT TUGAS) ==========
  return (
    <>
      <BottomSheet open={open} onClose={handleClose}>
        <h2 className="m-0 mb-0.5 text-lg font-bold text-ink">{isEdit ? "Edit Aktivitas" : "Buat Aktivitas"}</h2>
        <p className="m-0 mb-4 text-[12.5px] text-mute">
          {isEdit
            ? "Edit rincian tugas dan jadwal untuk anggota keluarga"
            : "Tambahkan aktivitas untuk anggota keluarga"}
        </p>

        {/* Switch Status Aktif / Nonaktif jika Mode Edit */}
        {isEdit && (
          <div
            className={`mb-4 flex items-center justify-between rounded-xl p-3 px-3.5 border ${
              isActive
                ? "border-sage/20 bg-sage-soft"
                : "border-alert/20 bg-alert-soft"
            }`}
          >
            <div>
              <div className={`text-[13.5px] font-bold ${isActive ? "text-sage" : "text-alert"}`}>
                {isActive ? "Tugas Aktif" : "Tugas Dinonaktifkan"}
              </div>
              <div className="text-[11.5px] text-mute">
                {isActive ? "Pengingat suara akan berjalan sesuai jadwal" : "Pengingat suara ditangguhkan sementara"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                isActive
                  ? "bg-sage text-white"
                  : "border border-alert bg-white text-alert"
              }`}
            >
              {isActive ? "Aktif" : "Nonaktif"}
            </button>
          </div>
        )}

        {/* Field: Nama Aktivitas */}
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[12.5px] font-bold text-ink">Nama Aktivitas</label>
          <input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Ex. Makan Siang / Kontrol Dokter"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-navy focus:outline-none"
          />
        </div>

        {/* Tipe Aktivitas: Berulang atau Sekali Saja */}
        <div className="mb-3.5 flex gap-2.5">
          <div className="flex-1">
            <label className="mb-1.5 block text-[12.5px] font-bold text-ink">Tipe Aktivitas</label>
            <select
              value={recurring ? "ya" : "tidak"}
              onChange={(e) => setRecurring(e.target.value === "ya")}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-navy focus:outline-none"
            >
              <option value="ya">Berulang</option>
              <option value="tidak">Sekali Saja (Appointment)</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-[12.5px] font-bold text-ink">
              {recurring ? "Pilih Hari" : "Waktu Pelaksanaan"}
            </label>
            {recurring ? (
              <div className="flex flex-wrap gap-1">
                {DAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    className={`cursor-pointer rounded-full border px-2 py-1 text-[11px] font-semibold transition active:scale-95 ${
                      days.includes(d.value)
                        ? "border-navy bg-navy text-white"
                        : "border-line bg-surface-sunken text-ink"
                    }`}
                    onClick={() =>
                      setDays((p) =>
                        p.includes(d.value)
                          ? p.filter((x) => x !== d.value)
                          : [...p, d.value]
                      )
                    }
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="date"
                value={targetDate}
                min={isEdit && existing?.scheduled_date && existing.scheduled_date.slice(0, 10) < todayStr ? existing.scheduled_date.slice(0, 10) : todayStr}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] text-ink focus:border-navy focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Jam Mulai & Durasi */}
        <div className="mb-3.5 flex gap-2.5">
          <div className="flex-1">
            <label className="mb-1.5 block text-[12.5px] font-bold text-ink">Jam Mulai (WIB)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-navy focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-[12.5px] font-bold text-ink">Durasi</label>
            <input
              type="text"
              value={`${duration} Menit`}
              onChange={(e) => {
                const num = parseInt(e.target.value.replace(/\D/g, ""), 10);
                if (!isNaN(num)) setDuration(num);
              }}
              placeholder="15 Menit"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-navy focus:outline-none"
            />
          </div>
        </div>

        {/* Warning Waktu Lampau (WIB) hanya jika tugas untuk Hari Ini */}
        {timeInPast && (
          <div className="mb-3.5 rounded-lg border border-alert/20 bg-alert-soft p-2.5 text-[12.5px] text-alert">
            ⚠️ Jam {time} sudah terlewat dari waktu saat ini di WIB ({getWibTimeHHMM()}). Silakan pilih jam yang belum berlalu.
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5">
          <button
            type="button"
            className="w-full cursor-pointer rounded-full bg-navy py-3.25 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            disabled={!taskName.trim() || timeInPast}
            onClick={checkConflictAndProceed}
          >
            Lanjutkan
          </button>
        </div>
        <div className="mt-2">
          <button
            type="button"
            className="w-full cursor-pointer rounded-full bg-surface-sunken py-3 px-4 text-center text-sm font-bold text-ink transition hover:opacity-90 active:scale-[0.99]"
            onClick={handleClose}
          >
            Batal
          </button>
        </div>
      </BottomSheet>

      {/* POPUP JADWAL BERTABRAKAN */}
      <TaskConflictSheet
        open={Boolean(conflictTask)}
        onClose={() => setConflictTask(null)}
        currentTask={{
          task_name: taskName,
          scheduled_time: time,
          duration_minutes: duration,
        }}
        conflictingTask={conflictTask}
        onResolve={async (res) => {
          if (res.newCurrentTime) {
            setTime(res.newCurrentTime);
          }
          if (res.deactivateConflictId) {
            await api.updateTask(res.deactivateConflictId, { isActive: false });
            onSaved();
          }
          if (res.deleteConflictId) {
            await api.deleteTask(res.deleteConflictId);
            onSaved();
          }
          if (res.updatedConflict) {
            await api.updateTask(res.updatedConflict.id, {
              scheduledTime: res.updatedConflict.scheduled_time,
              durationMinutes: res.updatedConflict.duration_minutes,
            });
            onSaved();
          }
          setConflictTask(null);
          setStep("verify");
        }}
      />
    </>
  );
}
