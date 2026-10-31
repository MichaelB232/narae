import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { PhoneLayout } from "../components/PhoneLayout";
import { Avatar } from "../components/Avatar";
import { SuccessToast } from "../components/Toast";
import { TaskFormSheet } from "../components/TaskFormSheet";
import { TaskStatusSheet } from "../components/TaskStatusSheet";
import { BelongingFormSheet } from "../components/BelongingFormSheet";
import { ConfirmSheet } from "../components/ConfirmSheet";
import { taskStatusMeta, DAY_LABELS_SHORT } from "../statusLabels";
import { calcAge, hhmm, addMinutes } from "../utils";
import type { PatientDetail, TaskItem, Belonging, AiLogItem } from "../types";

type Tab = "aktivitas" | "inventori" | "riwayat";

export function DetailKeluargaPage() {
  const { id } = useParams();
  const patientId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [belongings, setBelongings] = useState<Belonging[]>([]);
  const [aiLogs, setAiLogs] = useState<AiLogItem[]>([]);
  const [tab, setTab] = useState<Tab>("aktivitas");
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  const [scheduleFilter, setScheduleFilter] = useState<"harian" | "berulang">("harian");
  const [taskSheet, setTaskSheet] = useState<{ open: boolean; existing?: TaskItem }>({ open: false });
  const [statusSheet, setStatusSheet] = useState<{ open: boolean; task: TaskItem | null }>({ open: false, task: null });
  const [belongingSheet, setBelongingSheet] = useState<{ open: boolean; existing?: Belonging }>({ open: false });
  const [deleteTask, setDeleteTask] = useState<TaskItem | null>(null);
  const [deleteBelonging, setDeleteBelonging] = useState<Belonging | null>(null);

  const loadDetail = useCallback(async () => setDetail(await api.patientDetail(patientId)), [patientId]);
  const loadAllTasks = useCallback(async () => setAllTasks(await api.tasksForPatient(patientId)), [patientId]);
  const loadBelongings = useCallback(async () => setBelongings(await api.belongings(patientId)), [patientId]);
  const loadAiLogs = useCallback(async () => setAiLogs(await api.aiHistory(patientId)), [patientId]);

  useEffect(() => { loadDetail(); loadAllTasks(); loadBelongings(); }, [loadDetail, loadAllTasks, loadBelongings]);
  useEffect(() => { if (tab === "riwayat") loadAiLogs(); }, [tab, loadAiLogs]);

  function showToast(title: string, subtitle: string) {
    setToast({ title, subtitle });
    setTimeout(() => setToast(null), 3200);
  }

  if (!detail) return <PhoneLayout><p className="mut" style={{ padding: 20 }}>Memuat…</p></PhoneLayout>;

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
    scheduleFilter === "harian" ? t.type === "RECURRING" && (!t.days_of_week || t.days_of_week.length === 0) : (t.days_of_week && t.days_of_week.length > 0) || t.type === "ONE_TIME"
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
      {toast && <SuccessToast title={toast.title} subtitle={toast.subtitle} />}

      <div className="block" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface-sunken)" }}>‹</button>
        <div>
          <h1 style={{ fontSize: 18, margin: 0 }}>Detail Keluarga</h1>
          <p className="mut" style={{ margin: 0 }}>Lihat detail anggota keluarga Anda</p>
        </div>
      </div>

      <div className="card block">
        <div className="patient-mini">
          <Avatar name={detail.patient.name} />
          <div style={{ flex: 1 }}>
            <div className="name">{detail.patient.name}</div>
            <div className="age">{age ? `${age} Tahun` : ""}</div>
          </div>
          <div>
            <span className="pill online">{detail.patient.is_online ? "• Online" : "• Offline"}</span>{" "}
            <span className="pill battery">{detail.patient.battery_percentage ?? "-"}%</span>
          </div>
        </div>
        <div className="mut" style={{ marginTop: 8, fontSize: 12 }}>
          ↗ {doneToday} dari {detail.todayTasks.length} aktivitas dilakukan hari ini
        </div>
      </div>

      <div className="seg-tabs">
        <button className={tab === "aktivitas" ? "active" : ""} onClick={() => setTab("aktivitas")}>Aktivitas</button>
        <button className={tab === "inventori" ? "active" : ""} onClick={() => setTab("inventori")}>Inventori</button>
        <button className={tab === "riwayat" ? "active" : ""} onClick={() => setTab("riwayat")}>Riwayat</button>
      </div>

      {tab === "aktivitas" && (
        <>
          {pendingApprovals.length > 0 && (
            <div className="card tint-navy block">
              <div className="card-title">Menunggu Persetujuan Caregiver</div>
              <div className="card-sub" style={{ marginBottom: 10 }}>
                Pasien melapor tugas telah diselesaikan melalui Asisten AI di gelang
              </div>
              {pendingApprovals.map((t) => (
                <div key={t.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.task_name}</div>
                      <div className="mut" style={{ fontSize: 11.5 }}>Jadwal: {hhmm(t.scheduled_time)}</div>
                    </div>
                    <span className="status-badge navy">Laporan AI</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      className="btn sage"
                      style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
                      onClick={() => handleConfirmTask(t.id, true)}
                    >
                      ✓ Setujui Selesai
                    </button>
                    <button
                      className="btn ghost"
                      style={{ flex: 1, padding: "8px 12px", fontSize: 13, color: "var(--rose)", border: "1px solid var(--line)" }}
                      onClick={() => handleConfirmTask(t.id, false)}
                    >
                      ✕ Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="block">
            <div className="card-title" style={{ marginBottom: 2 }}>Aktivitas Hari Ini</div>
            <div className="card-sub" style={{ marginBottom: 10 }}>
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div className="card">
              <div className="timeline">
                {detail.todayTasks.length === 0 && <div className="empty-state">Tidak ada jadwal hari ini.</div>}
                {detail.todayTasks.map((t) => {
                  const meta = taskStatusMeta[t.status];
                  const isMissed = t.status === "MISSED";
                  return (
                    <div
                      key={t.id}
                      className="timeline-item"
                      style={
                        isMissed
                          ? {
                              background: "var(--rose-soft)",
                              padding: "8px 10px",
                              borderRadius: 10,
                              margin: "4px 0",
                            }
                          : {}
                      }
                    >
                      <span className={`dot${meta.dotMuted ? " muted" : ""}`} />
                      <div className="body">
                        <div className="ttitle">{t.task_name}</div>
                        <div className="ttime">
                          {hhmm(t.scheduled_time)} – {hhmm(addMinutes(t.scheduled_time, t.duration_minutes))} WIB
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className={`status-badge ${meta.tone}`}>{meta.label}</span>
                        <button
                          className="btn ghost-navy"
                          style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)" }}
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

          <div className="block">
            <div className="card-header-row" style={{ marginBottom: 2 }}>
              <div>
                <div className="card-title">Edit Jadwal Keluarga</div>
                <div className="card-sub">Buat, ubah, dan hapus data</div>
              </div>
              <div className="toggle-pair">
                <button className={scheduleFilter === "harian" ? "active" : ""} onClick={() => setScheduleFilter("harian")}>Harian</button>
                <button className={scheduleFilter === "berulang" ? "active" : ""} onClick={() => setScheduleFilter("berulang")}>Berulang</button>
              </div>
            </div>

            {scheduleTasks.length === 0 && <div className="empty-state">Belum ada jadwal di kategori ini.</div>}
            {scheduleTasks.map((t) => (
              <div key={t.id} className="list-row" style={!t.is_active ? { opacity: 0.6 } : {}}>
                <div className="clickable" style={{ flex: 1 }} onClick={() => setTaskSheet({ open: true, existing: t })}>
                  <div className="rt" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {t.task_name}
                    {!t.is_active && (
                      <span className="pill" style={{ fontSize: 10, background: "var(--rose-soft)", color: "var(--rose)" }}>
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <div className="rs">{scheduleLine(t)} WIB</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    className="btn ghost-navy"
                    style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)" }}
                    onClick={() => setTaskSheet({ open: true, existing: t })}
                  >
                    Edit
                  </button>
                  <button
                    className="btn ghost"
                    style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)" }}
                    onClick={() => setStatusSheet({ open: true, task: t })}
                  >
                    Status
                  </button>
                  <button className="mut" style={{ padding: "4px 6px" }} onClick={() => setDeleteTask(t)} aria-label="Hapus">🗑</button>
                </div>
              </div>
            ))}

            <button className="btn navy" style={{ marginTop: 8 }} onClick={() => setTaskSheet({ open: true })}>Tambah</button>
          </div>
        </>
      )}

      {tab === "inventori" && (
        <div className="block">
          <div className="card-title">Daftar Inventori Keluarga</div>
          <div className="card-sub" style={{ marginBottom: 10 }}>Koordinasi barang milik keluarga</div>

          {belongings.length === 0 && <div className="empty-state">Belum ada barang tercatat.</div>}
          {belongings.map((b) => (
            <div key={b.id} className="list-row">
              <div className="clickable" style={{ flex: 1 }} onClick={() => setBelongingSheet({ open: true, existing: b })}>
                <div className="rt">{b.item_name}</div>
                <div className="rs">Lokasi Terakhir: {b.last_location}</div>
              </div>
              <button className="mut" style={{ padding: "4px 6px" }} onClick={() => setDeleteBelonging(b)} aria-label="Hapus">🗑</button>
            </div>
          ))}

          <button className="btn navy" style={{ marginTop: 8 }} onClick={() => setBelongingSheet({ open: true })}>Tambah</button>
        </div>
      )}

      {tab === "riwayat" && (
        <div className="block">
          <div className="card-title">Riwayat Interaksi AI</div>
          <div className="card-sub" style={{ marginBottom: 10 }}>Percakapan pasien dengan NARAE</div>

          {aiLogs.length === 0 && <div className="empty-state">Belum ada riwayat percakapan.</div>}
          {aiLogs.map((log) => (
            <div key={log.id} className="card" style={{ marginBottom: 10 }}>
              <div className="mut" style={{ fontSize: 11, marginBottom: 8 }}>
                {new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
              </div>
              <div style={{
                background: "var(--surface-sunken)", borderRadius: 12, padding: "8px 12px",
                marginBottom: 6, fontSize: 13, maxWidth: "85%",
              }}>
                {log.patient_speech_transcript}
              </div>
              <div style={{
                background: "var(--navy-soft)", color: "var(--navy)", borderRadius: 12, padding: "8px 12px",
                fontSize: 13, maxWidth: "85%", marginLeft: "auto",
              }}>
                {log.ai_response_text}
              </div>
              {log.action_triggered === "escalate_to_nurse" && (
                <div style={{ marginTop: 8 }}><span className="status-badge rose">Memanggil perawat</span></div>
              )}
            </div>
          ))}
        </div>
      )}

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
        onConfirm={async () => { if (deleteTask) { await api.deleteTask(deleteTask.id); setDeleteTask(null); loadDetail(); loadAllTasks(); } }}
        onClose={() => setDeleteTask(null)}
      />
      <ConfirmSheet
        open={Boolean(deleteBelonging)}
        title="Hapus Barang?"
        subtitle="Barang akan dihapus dari daftar"
        onConfirm={async () => { if (deleteBelonging) { await api.deleteBelonging(deleteBelonging.id); setDeleteBelonging(null); loadBelongings(); } }}
        onClose={() => setDeleteBelonging(null)}
      />
    </PhoneLayout>
  );
}

function addMin(time: string, minutes: number): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor((total % (24 * 60)) / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}
