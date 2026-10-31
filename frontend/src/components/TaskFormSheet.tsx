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
  const [targetDay, setTargetDay] = useState<"hari_ini" | "besok">("hari_ini");
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
    if (existing) {
      setTaskName(existing.task_name);
      setRecurring(existing.type === "RECURRING");
      setDays(existing.days_of_week ?? []);
      setTime(existing.scheduled_time?.slice(0, 5) ?? getWibTimeHHMM());
      setDuration(existing.duration_minutes ?? 15);
      setIsActive(existing.is_active ?? true);
      if (existing.scheduled_date === getWibDateISO(1)) {
        setTargetDay("besok");
      } else {
        setTargetDay("hari_ini");
      }
    } else {
      setTaskName("");
      setRecurring(true);
      setDays([1]);
      setTime(getWibTimeHHMM());
      setDuration(15);
      setTargetDay("hari_ini");
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
    const targetDate =
      !recurring
        ? targetDay === "besok"
          ? getWibDateISO(1)
          : getWibDateISO(0)
        : null;

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
          dayMatches = t.scheduled_date === targetDate;
        } else {
          dayMatches = true;
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
          daysOfWeek: recurring && days.length > 0 ? days : null,
        });

        onSaved();
        handleClose();
        onShowToast("Aktivitas Berhasil Disimpan", `${taskName} pada ${time} WIB`);
      } else {
        const scheduledDate =
          !recurring
            ? targetDay === "besok"
              ? getWibDateISO(1)
              : getWibDateISO(0)
            : null;

        await api.createTask({
          patientId,
          createdBy: nurseId,
          taskName,
          spokenInstruction: `Waktunya ${taskName}.`,
          type: recurring && days.length === 0 ? "RECURRING" : days.length > 0 ? "RECURRING" : "ONE_TIME",
          daysOfWeek: recurring && days.length > 0 ? days : null,
          scheduledTime: time,
          durationMinutes: duration,
          scheduledDate,
        });

        onSaved();
        handleClose();
        onShowToast(
          "Aktivitas Berhasil Ditambahkan",
          `${taskName} pada ${time} WIB ${!recurring && targetDay === "besok" ? "(Besok)" : ""}`
        );
      }
    } catch (err: any) {
      alert("Gagal menyimpan aktivitas: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const timeInPast = !isEdit && (!recurring ? targetDay === "hari_ini" && isTimeInPastWib(time) : isTimeInPastWib(time));

  const dayDisplay =
    recurring && days.length > 0
      ? days.map((d) => DAYS.find((x) => x.value === d)?.label).join(", ")
      : recurring
      ? "Setiap Hari"
      : targetDay === "besok"
      ? "Besok (" + getWibDateISO(1) + ")"
      : "Hari Ini (" + getWibDateISO(0) + ")";

  // ========== STEP 2: CEK AI VOICE (VERIFY) ==========
  if (step === "verify") {
    return (
      <BottomSheet open={open} onClose={handleClose}>
        <h2>Cek AI Voice</h2>
        <p className="sheet-sub">Pastikan suara AI sesuai dengan aktivitas</p>

        {/* Audio Player Card */}
        <div
          style={{
            background: "#edf3f6",
            borderRadius: 14,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 20,
            border: "1px solid #dbe6ec",
          }}
        >
          <button
            onClick={toggleAudioPreview}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#3e627c",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 18,
              boxShadow: "0 2px 6px rgba(62, 98, 124, 0.3)",
              cursor: "pointer",
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1c2b38" }}>
              {taskName || "Nama Aktivitas"}
            </div>
            <div style={{ fontSize: 13, color: "#607282", marginTop: 2 }}>
              {isPlaying
                ? `0:${String(playSeconds).padStart(2, "0")}`
                : "0:30"}
            </div>
          </div>
        </div>

        {/* Summary Info */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#22262b" }}>
              Nama Aktivitas
            </div>
            <div style={{ fontSize: 15, color: "#6b7280", marginTop: 2 }}>
              {taskName}
            </div>
          </div>

          <div className="field-row" style={{ marginBottom: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#22262b" }}>
                Berulang
              </div>
              <div style={{ fontSize: 15, color: "#6b7280", marginTop: 2 }}>
                {recurring ? "Ya" : "Tidak"}
              </div>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#22262b" }}>
                Jadwal
              </div>
              <div style={{ fontSize: 15, color: "#6b7280", marginTop: 2 }}>
                {dayDisplay}
              </div>
            </div>
          </div>

          <div className="field-row" style={{ marginBottom: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#22262b" }}>
                Jam Mulai
              </div>
              <div style={{ fontSize: 15, color: "#6b7280", marginTop: 2 }}>
                {time} WIB
              </div>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#22262b" }}>
                Durasi
              </div>
              <div style={{ fontSize: 15, color: "#6b7280", marginTop: 2 }}>
                {duration} Menit
              </div>
            </div>
          </div>

          {isEdit && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#22262b" }}>
                Status Tugas
              </div>
              <div style={{ fontSize: 14, color: isActive ? "var(--sage)" : "var(--rose)", fontWeight: 600, marginTop: 2 }}>
                {isActive ? "● Aktif Dijalankan" : "○ Dinonaktifkan Sementara"}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: 24 }}>
          <button
            className="btn sage"
            disabled={saving}
            onClick={handleFinalSave}
            style={{ width: "100%", padding: 13, fontSize: 14, fontWeight: 700 }}
          >
            {saving ? "Menyimpan…" : "Simpan Aktivitas"}
          </button>
        </div>
        <div style={{ marginTop: 8 }}>
          <button
            className="btn ghost"
            onClick={() => {
              stopPlayback();
              setStep("form");
            }}
            style={{ width: "100%", padding: 12, fontSize: 14 }}
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
        <h2>{isEdit ? "Edit Aktivitas" : "Buat Aktivitas"}</h2>
        <p className="sheet-sub">
          {isEdit
            ? "Edit rincian tugas dan jadwal untuk anggota keluarga"
            : "Tambahkan aktivitas untuk anggota keluarga"}
        </p>

        {/* Switch Status Aktif / Nonaktif jika Mode Edit */}
        {isEdit && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: isActive ? "var(--sage-soft)" : "var(--rose-soft)",
              padding: "10px 14px",
              borderRadius: 12,
              marginBottom: 16,
              border: `1px solid ${isActive ? "rgba(47,111,84,0.2)" : "rgba(198,83,83,0.2)"}`,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: isActive ? "var(--sage)" : "var(--rose)" }}>
                {isActive ? "Tugas Aktif" : "Tugas Dinonaktifkan"}
              </div>
              <div className="mut" style={{ fontSize: 11.5 }}>
                {isActive ? "Pengingat suara akan berjalan sesuai jadwal" : "Pengingat suara ditangguhkan sementara"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                background: isActive ? "var(--sage)" : "#fff",
                color: isActive ? "#fff" : "var(--rose)",
                border: isActive ? "none" : "1px solid var(--rose)",
                cursor: "pointer",
              }}
            >
              {isActive ? "Aktif" : "Nonaktif"}
            </button>
          </div>
        )}

        {/* Field: Nama Aktivitas */}
        <div className="field">
          <label>Nama Aktivitas</label>
          <input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Ex. Makan Siang / Kontrol Dokter"
          />
        </div>

        {/* Mode CREATE: Berulang atau Tugas Khusus */}
        {!isEdit && (
          <>
            <div className="field-row">
              <div className="field">
                <label>Tipe Aktivitas</label>
                <select
                  value={recurring ? "ya" : "tidak"}
                  onChange={(e) => setRecurring(e.target.value === "ya")}
                >
                  <option value="ya">Berulang</option>
                  <option value="tidak">Sekali Saja (Appointment)</option>
                </select>
              </div>
              <div className="field">
                <label>{recurring ? "Pilih Hari" : "Waktu Pelaksanaan"}</label>
                {recurring ? (
                  <div
                    className="day-picker"
                    style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                  >
                    {DAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        className="day-chip"
                        style={{
                          padding: "6px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          border: "1px solid var(--line)",
                          background: days.includes(d.value)
                            ? "var(--navy)"
                            : "var(--surface-sunken)",
                          color: days.includes(d.value) ? "#fff" : "var(--text)",
                        }}
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
                  <select
                    value={targetDay}
                    onChange={(e) => setTargetDay(e.target.value as "hari_ini" | "besok")}
                  >
                    <option value="hari_ini">Hari Ini ({getWibDateISO(0)})</option>
                    <option value="besok">Besok ({getWibDateISO(1)})</option>
                  </select>
                )}
              </div>
            </div>
          </>
        )}

        {/* Jam Mulai & Durasi */}
        <div className="field-row">
          <div className="field">
            <label>Jam Mulai (WIB)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Durasi</label>
            <input
              type="text"
              value={`${duration} Menit`}
              onChange={(e) => {
                const num = parseInt(e.target.value.replace(/\D/g, ""), 10);
                if (!isNaN(num)) setDuration(num);
              }}
              placeholder="15 Menit"
            />
          </div>
        </div>

        {/* Warning Waktu Lampau (WIB) hanya jika tugas untuk Hari Ini */}
        {timeInPast && (
          <div
            style={{
              background: "var(--rose-soft)",
              color: "var(--rose)",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12.5,
              marginBottom: 12,
              border: "1px solid rgba(198, 83, 83, 0.2)",
            }}
          >
            ⚠️ Jam {time} sudah terlewat dari waktu saat ini di WIB ({getWibTimeHHMM()}). Silakan pilih jam yang belum berlalu.
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: 20 }}>
          <button
            className="btn navy"
            disabled={!taskName.trim() || timeInPast}
            onClick={checkConflictAndProceed}
            style={{ width: "100%", padding: 13, fontSize: 14, fontWeight: 700 }}
          >
            Lanjutkan
          </button>
        </div>
        <div style={{ marginTop: 8 }}>
          <button
            className="btn ghost"
            onClick={handleClose}
            style={{ width: "100%", padding: 12, fontSize: 14 }}
          >
            Batal
          </button>
        </div>
      </BottomSheet>

      {/* POPUP JADWAL BERTABRAKAN (Bottom Sheet Sesuai Desain Figma) */}
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
