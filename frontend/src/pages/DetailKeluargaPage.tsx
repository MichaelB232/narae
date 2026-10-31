import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { PhoneLayout } from "../components/PhoneLayout";
import { Avatar } from "../components/Avatar";
import { BackButton } from "../components/BackButton";
import { Timeline, TaskStatusPill } from "../components/ActivityTimeline";
import { RiwayatTab } from "../components/RiwayatTab";
import { TaskFormSheet } from "../components/TaskFormSheet";
import { TaskStatusSheet } from "../components/TaskStatusSheet";
import { BelongingFormSheet } from "../components/BelongingFormSheet";
import { ConfirmSheet } from "../components/ConfirmSheet";
import { SuccessToast } from "../components/Toast";
import { taskStatusMeta } from "../statusLabels";
import { calcAge, hhmm, addMinutes } from "../utils";
import type { PatientDetail, TaskItem, Belonging } from "../types";

const DAY_LABELS_SHORT: Record<number, string> = {
  1: "Sen", 2: "Sel", 3: "Rab", 4: "Kam", 5: "Jum", 6: "Sab", 7: "Min",
};


const navyCardClass =
  "rounded-2xl border border-[#dce3ed] bg-[#f3f6fa] p-4 flex flex-col gap-4";

const cardClass =
  "rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-3.5";

const buttonBaseClass =
  "inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const approveButtonClass =
  `${buttonBaseClass} bg-[#e5f1e9] text-[#38664a] hover:bg-[#d5e8dc]`;

const rejectButtonClass =
  `${buttonBaseClass} border border-rose-200 bg-white text-rose-600 hover:bg-rose-50`;

function TaskCompletedByPatient({
  pendingTasks,
  patientName,
  onConfirm,
}: {
  pendingTasks: TaskItem[];
  patientName?: string;
  onConfirm: (taskId: number, approve: boolean) => void;
}) {
  if (pendingTasks.length === 0) return null;

  return (
    <section className={cardClass}>
      <div className="px-4 pt-4">
        <h2 className="text-[#426783] font-semibold text-sm">
          Menunggu Persetujuan Caregiver
        </h2>

        <p className="text-xs font-normal text-[#426783]">
          Pasien {patientName ?? "ini"} melapor tugas selesai via Asisten AI.
        </p>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {pendingTasks.map((t) => (
          <div
            key={t.id}
            className="border-t border-slate-200 pt-3 first:border-0 first:pt-0"
          >
            <div className="flex items-center justify-between gap-2 bg-[#527FA8]/10 p-4 rounded-xl">
              <div className="min-w-0 ">
                <h3 className="text-sm font-bold text-[#426783]">
                  {t.task_name}
                </h3>

                <p className="text-[11px] text-[#426783]">
                  Jadwal: {hhmm(t.scheduled_time)}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-[#426783] px-2.5 py-1 text-[10px] font-semibold text-white">
                Laporan AI
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                className={`flex-1 ${approveButtonClass}`}
                onClick={() => onConfirm(t.id, true)}
              >
                Setujui
              </button>

              <button
                className={`flex-1 ${rejectButtonClass}`}
                onClick={() => onConfirm(t.id, false)}
              >
                Tolak
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DetailKeluargaPage() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [belongings, setBelongings] = useState<Belonging[]>([]);

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

  useEffect(() => {
    loadDetail();
    loadAllTasks();
    loadBelongings();
  }, [loadDetail, loadAllTasks, loadBelongings]);

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
      <div className="p-4 pt-[64px] bg-linear-to-br from-[#EAF1F5] to-[#FAF7F0] min-h-screen">
        {toast && <SuccessToast title={toast.title} subtitle={toast.subtitle} />}

        {/* Header Back & Judul */}
        <div className="mb-3.5 flex items-center gap-2.5">
          <BackButton onClick={() => navigate(-1)} />
          <div>
            <h1 className="m-0 text-lg font-bold text-ink">Detail Keluarga</h1>
            <p className="m-0 text-[13px] text-mute">Lihat detail anggota keluarga Anda</p>
          </div>
        </div>

        {/* Kartu Profil Pasien */}
        <div className={`p-4 ${cardClass}`}>
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
            <TaskCompletedByPatient
              pendingTasks={pendingApprovals}
              patientName={detail.patient.name}
              onConfirm={handleConfirmTask}
            />

            {/* Aktivitas Hari Ini (Timeline) */}
            <div className="mb-3.5">
              

              <div className={`p-4 ${cardClass}`}>
              <div className="mb-0.5 text-[15px] font-bold text-ink">Aktivitas Hari Ini</div>
              <div className="mb-2.5 text-xs text-mute">
                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
                {detail.todayTasks.length === 0 ? (
                  <div className="py-6.5 px-3.5 text-center text-[13px] text-mute">
                    Tidak ada jadwal hari ini.
                  </div>
                ) : (
                  <Timeline
                    dotCenter={20}
                    items={detail.todayTasks.map((t) => ({
                      id: t.id,
                      active: !taskStatusMeta[t.status].dotMuted,
                      alert: t.status === "MISSED",
                      children: (
                        <div className="flex items-start gap-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-ink">{t.task_name}</div>
                            <div className="text-xs text-mute">
                              {hhmm(t.scheduled_time)} – {hhmm(addMinutes(t.scheduled_time, t.duration_minutes))} WIB
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TaskStatusPill status={t.status} />
                            <button
                              type="button"
                              className="cursor-pointer rounded-md border border-line bg-navy-soft px-2 py-1 text-[11px] font-bold text-navy transition hover:opacity-90 active:scale-95"
                              onClick={() => setStatusSheet({ open: true, task: t })}
                            >
                              Update Status
                            </button>
                          </div>
                        </div>
                      ),
                    }))}
                  />
                )}
              </div>
            </div>

            {/* Edit Jadwal Keluarga */}
            <div className={`p-4 flex flex-col gap-4 ${cardClass}`}>
              <div className="mb-1 flex items-start justify-between">
                <div>
                  <div className="text-[15px] font-bold text-ink">Edit Jadwal Keluarga</div>
                  <div className="text-xs text-mute">Buat, ubah, dan hapus data</div>
                </div>
                <div className="inline-flex rounded-lg bg-[#A8C1D1]/10 p-1">
                  <button
                    type="button"
                    className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition ${scheduleFilter === "harian" ? "bg-navy font-bold text-white shadow-xs" : "text-mute hover:text-ink"
                      }`}
                    onClick={() => setScheduleFilter("harian")}
                  >
                    Harian
                  </button>
                  <button
                    type="button"
                    className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition ${scheduleFilter === "berulang" ? "bg-navy font-bold text-white shadow-xs" : "text-mute hover:text-ink"
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
                  className={` flex items-center justify-between rounded-xl bg-linear-to-r from-white to-[#A8C1D1]/10 border border-[#A8C1D1] px-3.5 py-3 text-[13px] ${!t.is_active ? "opacity-60" : ""
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
                      className="cursor-pointer rounded-md border-[#A8C1D1]/10 bg-[#A8C1D1]/10 px-2 py-1 text-[11px] font-bold text-[#426783] transition hover:opacity-90 active:scale-95"
                      onClick={() => setTaskSheet({ open: true, existing: t })}
                    >
                      Edit
                    </button>
                    
                    <button
                      type="button"
                      className="cursor-pointer rounded-md border-[#C65353]/10 bg-[#C65353]/10 px-2 py-1 text-[11px] font-bold text-[#C65353] transition hover:opacity-90 active:scale-95"
                      onClick={() => setDeleteTask(t)}
                      aria-label="Hapus"
                    >
                      Hapus
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
          <div className="">
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

        {tab === "riwayat" && <RiwayatTab patientId={patientId} />}

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