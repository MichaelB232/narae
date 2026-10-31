import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { PhoneLayout } from "../components/PhoneLayout";
import { Avatar } from "../components/Avatar";
import { TaskFormSheet } from "../components/TaskFormSheet";
import { TaskStatusSheet } from "../components/TaskStatusSheet";
import { BelongingFormSheet } from "../components/BelongingFormSheet";
import { ConfirmSheet } from "../components/ConfirmSheet";
import { SuccessToast } from "../components/Toast";
import { taskStatusMeta } from "../statusLabels";
import { calcAge, hhmm, addMinutes } from "../utils";
import type { PatientDetail, TaskItem, Belonging, AiLogItem } from "../types";

const DAY_LABELS_SHORT: Record<number, string> = {
  1: "Sen", 2: "Sel", 3: "Rab", 4: "Kam", 5: "Jum", 6: "Sab", 7: "Min",
};

export function DetailKeluargaPage() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [belongings, setBelongings] = useState<Belonging[]>([]);
  const [aiLogs, setAiLogs] = useState<AiLogItem[]>([]);

  const [tab, setTab] = useState<"aktivitas" | "inventori" | "riwayat">("aktivitas");
  const [scheduleFilter, setScheduleFilter] = useState<"harian" | "berulang">("harian");

  const [taskSheet, setTaskSheet] = useState<{ open: boolean; existing?: TaskItem }>({ open: false });
  const [statusSheet, setStatusSheet] = useState<{ open: boolean; task: TaskItem | null }>({ open: false, task: null });
  const [belongingSheet, setBelongingSheet] = useState<{ open: boolean; existing?: Belonging }>({ open: false });
  const [deleteTask, setDeleteTask] = useState<TaskItem | null>(null);
  const [deleteBelonging, setDeleteBelonging] = useState<Belonging | null>(null);

  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  function showToast(title: string, subtitle: string) {
    setToast({ title, subtitle });
    setTimeout(() => setToast(null), 3000);
  }

  const loadDetail = useCallback(async () => {
    setDetail(await api.patientDetail(patientId));
  }, [patientId]);

  const loadAllTasks = useCallback(async () => {
    setAllTasks(await api.tasksForPatient(patientId));
  }, [patientId]);

  const loadBelongings = useCallback(async () => {
    setBelongings(await api.belongings(patientId));
  }, [patientId]);

  const loadAiLogs = useCallback(async () => {
    setAiLogs(await api.aiHistory(patientId));
  }, [patientId]);

  useEffect(() => {
    loadDetail();
    loadAllTasks();
    loadBelongings();
    loadAiLogs();
  }, [loadDetail, loadAllTasks, loadBelongings, loadAiLogs]);

  if (!detail) {
    return (
      <PhoneLayout>
        <p className="p-5 text-[13px] text-mute">Memuat…</p>
      </PhoneLayout>
    );
  }

  const age = calcAge(detail.patient.date_of_birth);
  const doneToday = detail.todayTasks.filter((t) => t.status === "CONFIRMED_BY_NURSE").length;
  const pendingApprovals = detail.todayTasks.filter((t) => t.status === "REPORTED_COMPLETE_BY_PATIENT");

  async function handleConfirmTask(taskId: number, approve: boolean) {
    if (!user) return;
    await api.confirmTask(taskId, user.id, approve);
    loadDetail();
    loadAllTasks();
    showToast(
      approve ? "Tugas Dikonfirmasi Selesai" : "Tugas Ditandai Belum Selesai",
      "Status aktivitas telah diperbarui"
    );
  }

  const scheduleTasks = allTasks.filter((t) =>
    scheduleFilter === "harian"
      ? t.type === "RECURRING" && (!t.days_of_week || t.days_of_week.length === 0)
      : (t.days_of_week && t.days_of_week.length > 0) || t.type === "ONE_TIME"
  );

  function scheduleLine(t: TaskItem) {
    const days =
      t.type === "RECURRING" && t.days_of_week?.length
        ? t.days_of_week.map((d) => DAY_LABELS_SHORT[d]).join("/")
        : t.type === "RECURRING"
          ? "Setiap hari"
          : t.scheduled_date
            ? `Tgl ${t.scheduled_date.slice(0, 10)}`
            : "Sekali";
    return `${days}, ${hhmm(t.scheduled_time)}`;
  }

  return (
    <PhoneLayout>
      <div className="p-4 bg-linear-to-br from-[#EAF1F5] to-[#FAF7F0]">
        {toast && <SuccessToast title={toast.title} subtitle={toast.subtitle} />}

        {/* Header Back & Judul */}
        <div className="mb-3.5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-[32px] cursor-pointer items-center justify-center rounded-full bg-none border-[0.5px] text-black transition active:scale-95"
            aria-label="Kembali"
          >
            ‹
          </button>
          <div>
            <h1 className="m-0 text-lg font-bold text-ink">Detail Keluarga</h1>
            <p className="m-0 text-[13px] text-mute">Lihat detail anggota keluarga Anda</p>
          </div>
        </div>

        {/* Kartu Profil Pasien */}
        <div className="mb-3.5 rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-3">
            <Avatar name={detail.patient.name} />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-ink">{detail.patient.name}</div>
              <div className="text-xs text-mute">{age ? `${age} Tahun` : ""}</div>
            </div>
            <div className="flex gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${detail.patient.is_online ? "bg-sage-soft text-sage" : "bg-neutral-badge text-neutral-badge-text"
                  }`}
              >
                {detail.patient.is_online ? "• Online" : "• Offline"}
              </span>
              <span className="rounded-full bg-[#378568] px-2 py-0.5 text-[10px] font-bold text-white">
                {detail.patient.battery_percentage ?? "-"}%
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs text-mute">
            ↗ {doneToday} dari {detail.todayTasks.length} aktivitas dilakukan hari ini
          </div>
        </div>

        {/* Segmented Tabs */}
        <div className="my-3.5 flex gap-0.5 rounded-xl bg-white p-2 border border-line">
          {(["aktivitas", "inventori", "riwayat"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`flex-1 cursor-pointer rounded-full py-2 px-1 text-center text-[12.5px] capitalize transition ${tab === t ? "bg-navy font-bold text-white shadow-xs" : "font-semibold text-mute hover:text-ink"
                }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* TAB AKTIVITAS */}
        {tab === "aktivitas" && (
          <>
            {/* Menunggu Persetujuan Caregiver */}
            {pendingApprovals.length > 0 && (
              <div className="mb-3.5 rounded-2xl border border-[#c9d7df] bg-navy-soft p-4">
                <div className="text-[15px] font-bold text-ink">Menunggu Persetujuan Caregiver</div>
                <div className="mb-2.5 text-xs text-mute">
                  Pasien melapor tugas telah diselesaikan melalui Asisten AI di gelang
                </div>
                {pendingApprovals.map((t) => (
                  <div key={t.id} className="mt-2 border-t border-line/60 pt-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[13.5px] font-bold text-ink">{t.task_name}</div>
                        <div className="text-[11.5px] text-mute">Jadwal: {hhmm(t.scheduled_time)}</div>
                      </div>
                      <span className="rounded-full bg-navy-soft px-2.5 py-1 text-[11px] font-bold text-navy">
                        Laporan AI
                      </span>
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <button
                        type="button"
                        className="flex-1 cursor-pointer rounded-full bg-sage py-2 px-3 text-center text-[13px] font-bold text-white transition hover:opacity-90 active:scale-[0.99]"
                        onClick={() => handleConfirmTask(t.id, true)}
                      >
                        ✓ Setujui Selesai
                      </button>
                      <button
                        type="button"
                        className="flex-1 cursor-pointer rounded-full border border-line bg-surface py-2 px-3 text-center text-[13px] font-bold text-alert transition hover:bg-alert-soft active:scale-[0.99]"
                        onClick={() => handleConfirmTask(t.id, false)}
                      >
                        ✕ Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Aktivitas Hari Ini (Timeline) */}
            <div className="mb-3.5">
              <div className="mb-0.5 text-[15px] font-bold text-ink">Aktivitas Hari Ini</div>
              <div className="mb-2.5 text-xs text-mute">
                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>

              <div className="rounded-2xl border border-line bg-surface p-4">
                <div className="relative ml-1.5">
                  {detail.todayTasks.length === 0 && (
                    <div className="py-6.5 px-3.5 text-center text-[13px] text-mute">
                      Tidak ada jadwal hari ini.
                    </div>
                  )}
                  {detail.todayTasks.map((t, idx) => {
                    const meta = taskStatusMeta[t.status];
                    const isMissed = t.status === "MISSED";
                    const isLast = idx === detail.todayTasks.length - 1;
                    return (
                      <div
                        key={t.id}
                        className={`relative flex items-start gap-3 py-2.5 ${isMissed ? "my-1 rounded-xl bg-alert-soft p-2.5" : ""
                          }`}
                      >
                        {/* Vertical line connecting timeline dots */}
                        {!isLast && !isMissed && (
                          <div className="absolute top-4.5 bottom-[-10px] left-1 w-px bg-line" />
                        )}
                        <span
                          className={`relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full ${meta.dotMuted ? "bg-[#c9cdd3]" : "bg-navy"
                            }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-ink">{t.task_name}</div>
                          <div className="text-xs text-mute">
                            {hhmm(t.scheduled_time)} – {hhmm(addMinutes(t.scheduled_time, t.duration_minutes))} WIB
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${meta.tone === "sage"
                              ? "bg-sage-soft text-sage"
                              : meta.tone === "rose"
                                ? "bg-alert-soft text-alert"
                                : meta.tone === "navy"
                                  ? "bg-navy-soft text-navy"
                                  : "bg-neutral-badge text-neutral-badge-text"
                            }`}>
                            {meta.label}
                          </span>
                          <button
                            type="button"
                            className="cursor-pointer rounded-md border border-line bg-navy-soft px-2 py-1 text-[11px] font-bold text-navy transition hover:opacity-90 active:scale-95"
                            onClick={() => setStatusSheet({ open: true, task: t })}
                          >
                            Update Status
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Edit Jadwal Keluarga */}
            <div className="mb-3.5">
              <div className="mb-1 flex items-start justify-between gap-2.5">
                <div>
                  <div className="text-[15px] font-bold text-ink">Edit Jadwal Keluarga</div>
                  <div className="text-xs text-mute">Buat, ubah, dan hapus data</div>
                </div>
                <div className="inline-flex rounded-full bg-surface-sunken p-[3px]">
                  <button
                    type="button"
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition ${scheduleFilter === "harian" ? "bg-navy font-bold text-white shadow-xs" : "text-mute hover:text-ink"
                      }`}
                    onClick={() => setScheduleFilter("harian")}
                  >
                    Harian
                  </button>
                  <button
                    type="button"
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition ${scheduleFilter === "berulang" ? "bg-navy font-bold text-white shadow-xs" : "text-mute hover:text-ink"
                      }`}
                    onClick={() => setScheduleFilter("berulang")}
                  >
                    Berulang
                  </button>
                </div>
              </div>

              {scheduleTasks.length === 0 && (
                <div className="py-6.5 px-3.5 text-center text-[13px] text-mute">
                  Belum ada jadwal di kategori ini.
                </div>
              )}
              {scheduleTasks.map((t) => (
                <div
                  key={t.id}
                  className={`mb-2 flex items-center justify-between rounded-xl bg-surface-sunken px-3.5 py-3 text-[13px] ${!t.is_active ? "opacity-60" : ""
                    }`}
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setTaskSheet({ open: true, existing: t })}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-ink">
                      <span className="truncate">{t.task_name}</span>
                      {!t.is_active && (
                        <span className="rounded-full bg-alert-soft px-2 py-0.5 text-[10px] font-bold text-alert">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-mute">{scheduleLine(t)} WIB</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="cursor-pointer rounded-md border border-line bg-navy-soft px-2 py-1 text-[11px] font-bold text-navy transition hover:opacity-90 active:scale-95"
                      onClick={() => setTaskSheet({ open: true, existing: t })}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-bold text-ink transition hover:opacity-90 active:scale-95"
                      onClick={() => setStatusSheet({ open: true, task: t })}
                    >
                      Status
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer p-1 text-xs text-mute transition hover:text-alert"
                      onClick={() => setDeleteTask(t)}
                      aria-label="Hapus"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="mt-2 w-full cursor-pointer rounded-full bg-navy py-3 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99]"
                onClick={() => setTaskSheet({ open: true })}
              >
                Tambah
              </button>
            </div>
          </>
        )}

        {/* TAB INVENTORI */}
        {tab === "inventori" && (
          <div className="mb-3.5">
            <div className="text-[15px] font-bold text-ink">Daftar Inventori Keluarga</div>
            <div className="mb-2.5 text-xs text-mute">Koordinasi barang milik keluarga</div>

            {belongings.length === 0 && (
              <div className="py-6.5 px-3.5 text-center text-[13px] text-mute">
                Belum ada barang tercatat.
              </div>
            )}
            {belongings.map((b) => (
              <div
                key={b.id}
                className="mb-2 flex items-center justify-between rounded-xl bg-surface-sunken px-3.5 py-3 text-[13px]"
              >
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setBelongingSheet({ open: true, existing: b })}
                >
                  <div className="font-semibold text-ink">{b.item_name}</div>
                  <div className="text-xs text-mute">Lokasi Terakhir: {b.last_location}</div>
                </div>
                <button
                  type="button"
                  className="cursor-pointer p-1 text-xs text-mute transition hover:text-alert"
                  onClick={() => setDeleteBelonging(b)}
                  aria-label="Hapus"
                >
                  🗑
                </button>
              </div>
            ))}

            <button
              type="button"
              className="mt-2 w-full cursor-pointer rounded-full bg-navy py-3 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99]"
              onClick={() => setBelongingSheet({ open: true })}
            >
              Tambah
            </button>
          </div>
        )}

        {/* TAB RIWAYAT */}
        {tab === "riwayat" && (
          <div className="mb-3.5">
            <div className="text-[15px] font-bold text-ink">Riwayat Interaksi AI</div>
            <div className="mb-2.5 text-xs text-mute">Percakapan pasien dengan NARAE</div>

            {aiLogs.length === 0 && (
              <div className="py-6.5 px-3.5 text-center text-[13px] text-mute">
                Belum ada riwayat percakapan.
              </div>
            )}
            {aiLogs.map((log) => (
              <div key={log.id} className="mb-2.5 rounded-2xl border border-line bg-surface p-4">
                <div className="mb-2 text-[11px] text-mute">
                  {new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </div>
                <div className="mb-1.5 max-w-[85%] rounded-xl bg-surface-sunken p-2.5 px-3 text-[13px] text-ink">
                  {log.patient_speech_transcript}
                </div>
                <div className="ml-auto max-w-[85%] rounded-xl bg-navy-soft p-2.5 px-3 text-[13px] text-navy">
                  {log.ai_response_text}
                </div>
                {log.action_triggered === "escalate_to_nurse" && (
                  <div className="mt-2">
                    <span className="rounded-full bg-alert-soft px-2.5 py-1 text-[11px] font-bold text-alert">
                      Memanggil perawat
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom Sheets */}
        <TaskFormSheet
          open={taskSheet.open}
          existing={taskSheet.existing}
          allTasks={allTasks}
          patientId={patientId}
          nurseId={user!.id}
          onClose={() => setTaskSheet({ open: false })}
          onSaved={() => { loadDetail(); loadAllTasks(); }}
          onShowToast={showToast}
        />
        <TaskStatusSheet
          open={statusSheet.open}
          task={statusSheet.task}
          nurseId={user!.id}
          onClose={() => setStatusSheet({ open: false, task: null })}
          onSaved={() => { loadDetail(); loadAllTasks(); }}
          onShowToast={showToast}
        />
        <BelongingFormSheet
          open={belongingSheet.open}
          existing={belongingSheet.existing}
          patientId={patientId}
          onClose={() => setBelongingSheet({ open: false })}
          onSaved={loadBelongings}
          onShowToast={showToast}
        />
        <ConfirmSheet
          open={Boolean(deleteTask)}
          title="Hapus Aktivitas?"
          subtitle="Aktivitas akan dihapus dari jadwal"
          onConfirm={async () => {
            if (deleteTask) {
              await api.deleteTask(deleteTask.id);
              setDeleteTask(null);
              loadDetail();
              loadAllTasks();
            }
          }}
          onClose={() => setDeleteTask(null)}
        />
        <ConfirmSheet
          open={Boolean(deleteBelonging)}
          title="Hapus Barang?"
          subtitle="Barang akan dihapus dari daftar"
          onConfirm={async () => {
            if (deleteBelonging) {
              await api.deleteBelonging(deleteBelonging.id);
              setDeleteBelonging(null);
              loadBelongings();
            }
          }}
          onClose={() => setDeleteBelonging(null)}
        />
      </div>
    </PhoneLayout>
  );
}
