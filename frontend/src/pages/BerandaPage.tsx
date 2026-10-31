import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { PhoneLayout } from "../components/PhoneLayout";
import { Avatar } from "../components/Avatar";
import { PatientSwitcher } from "../components/PatientSwitcher";
import { HelpRequestSheet } from "../components/HelpRequestSheet";
import { taskStatusMeta } from "../statusLabels";
import { calcAge, hhmm } from "../utils";
import type { PatientListItem, PatientDetail, HelpRequestItem, TaskItem } from "../types";

export function BerandaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientListItem[] | null>(null);
  const [helpRequests, setHelpRequests] = useState<HelpRequestItem[]>([]);
  const [sheetItem, setSheetItem] = useState<HelpRequestItem | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const loadPatients = useCallback(async () => {
    if (!user) return;
    setPatients(await api.patientsForNurse(user.id));
  }, [user]);

  const loadHelp = useCallback(async () => {
    if (!user) return;
    setHelpRequests(await api.helpRequests(user.id));
  }, [user]);

  useEffect(() => {
    loadPatients();
    loadHelp();
    const t = setInterval(loadHelp, 4000);
    return () => clearInterval(t);
  }, [loadPatients, loadHelp]);

  // Auto-munculkan bottom sheet begitu ada panggilan PENDING baru yang belum pernah
  // ditampilkan/ditutup di sesi ini — sesuai arahan: panggilan pop-up dari bawah, bukan
  // menunggu perawat klik sesuatu dulu untuk melihatnya.
  useEffect(() => {
    if (sheetItem) return;
    const fresh = helpRequests.find((h) => h.status === "PENDING" && !dismissedIds.has(h.id));
    if (fresh) setSheetItem(fresh);
  }, [helpRequests, dismissedIds, sheetItem]);

  if (!patients || !user) {
    return <PhoneLayout><p className="mut" style={{ padding: 20 }}>Memuat…</p></PhoneLayout>;
  }

  async function handleAcknowledgeFromSheet() {
    if (!sheetItem) return;
    const currentId = Number(sheetItem.id);
    const targetPatientId = sheetItem.patient_id;
    try {
      await api.acknowledgeHelp(currentId);
    } catch (e) {
      console.warn("Acknowledge help warning:", e);
    }
    setDismissedIds((prev) => new Set(prev).add(currentId));
    setSheetItem(null);
    loadHelp();
    if (targetPatientId) {
      navigate(`/keluarga/${targetPatientId}`);
    }
  }

  function handleLaterFromSheet() {
    if (!sheetItem) return;
    const currentId = Number(sheetItem.id);
    setDismissedIds((prev) => new Set(prev).add(currentId));
    setSheetItem(null);
  }

  if (patients.length <= 1) {
    return (
      <PhoneLayout>
        <SingleDashboard patient={patients[0]} nurseId={user.id} nurseName={user.full_name} navigate={navigate} />
        <HelpRequestSheet
          item={sheetItem}
          onAcknowledge={handleAcknowledgeFromSheet}
          onLater={handleLaterFromSheet}
        />
      </PhoneLayout>
    );
  }

  return (
    <PhoneLayout>
      <MultiDashboard
        patients={patients}
        helpRequests={helpRequests}
        nurseName={user.full_name}
        onOpenCall={(h) => setSheetItem(h)}
        navigate={navigate}
      />
      <HelpRequestSheet
        item={sheetItem}
        onAcknowledge={handleAcknowledgeFromSheet}
        onLater={handleLaterFromSheet}
      />
    </PhoneLayout>
  );
}

// ======================= DASHBOARD 1 PASIEN =======================
function SingleDashboard({ patient, nurseId, nurseName, navigate }: { patient: PatientListItem; nurseId: number; nurseName: string; navigate: (p: string) => void }) {
  const [detail, setDetail] = useState<PatientDetail | null>(null);

  const load = useCallback(async () => {
    setDetail(await api.patientDetail(patient.id));
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  if (!detail) return <p className="mut">Memuat pasien…</p>;

  const done = detail.todayTasks.filter((t) => t.status === "CONFIRMED_BY_NURSE").length;
  const total = detail.todayTasks.length;
  const pendingConfirm = detail.todayTasks.find((t) => t.status === "REPORTED_COMPLETE_BY_PATIENT");
  const age = calcAge(detail.patient.date_of_birth);

  async function confirm(taskId: number, approve: boolean) {
    await api.confirmTask(taskId, nurseId, approve);
    load();
  }

  return (
    <>
      <div className="greeting block">
        <h1>Selamat Pagi, {nurseName.split(" ")[1] ?? nurseName}</h1>
        <p>Ringkasan pendampingan pasien untuk hari ini.</p>
      </div>

      <div className="card block">
        <div className="patient-mini">
          <Avatar name={detail.patient.name} />
          <div>
            <div className="mut" style={{ fontSize: 11 }}>Kamu Mendampingi</div>
            <div className="name">{detail.patient.name}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span className="pill online">{detail.patient.is_online ? "• Online" : "• Offline"}</span>{" "}
            <span className="pill battery">{detail.patient.battery_percentage ?? "-"}%</span>
          </div>
        </div>
      </div>

      <div className="card tint-navy block">
        <div className="card-title">{total === 0 ? "Belum Ada Jadwal Hari Ini" : done === total ? "Hari ini Berjalan Sangat Baik" : "Hari ini Sedang Berjalan"}</div>
        <div className="card-sub" style={{ marginBottom: 10 }}>{done} dari {total} aktivitas selesai</div>
        <div className="timeline">
          {detail.todayTasks.map((t) => (
            <TimelineRow key={t.id} task={t} />
          ))}
        </div>
      </div>

      {pendingConfirm && (
        <div className="card tint-navy block">
          <div className="card-title">Menunggu Persetujuan Caregiver</div>
          <div className="card-sub" style={{ marginBottom: 12 }}>
            Pasien melapor tugas telah selesai via Asisten AI di gelang
          </div>
          <div className="patient-mini" style={{ marginBottom: 10 }}>
            <Avatar name={detail.patient.name} size={40} />
            <div>
              <div className="name" style={{ fontSize: 14 }}>{detail.patient.name}</div>
              <div className="age">{age ? `${age} Tahun` : ""}{detail.patient.room_number ? ` • ${detail.patient.room_number}` : ""}</div>
            </div>
          </div>
          <div className="list-row">
            <div>
              <div className="rt">{pendingConfirm.task_name}</div>
              <div className="rs">{hhmm(pendingConfirm.scheduled_time)}</div>
            </div>
            <span className="status-badge navy">Laporan AI</span>
          </div>
          <div className="btn-row" style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn sage" style={{ flex: 1, padding: "9px 12px", fontSize: 13 }} onClick={() => confirm(pendingConfirm.id, true)}>
              ✓ Setujui Selesai
            </button>
            <button className="btn ghost" style={{ flex: 1, padding: "9px 12px", fontSize: 13, color: "var(--rose)", border: "1px solid var(--line)" }} onClick={() => confirm(pendingConfirm.id, false)}>
              ✕ Tolak
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="btn ghost" onClick={() => navigate(`/keluarga/${detail.patient.id}`)}>Cek Pasien</button>
          </div>
        </div>
      )}
    </>
  );
}

// ======================= DASHBOARD >1 PASIEN =======================
function MultiDashboard({
  patients, helpRequests, nurseName, onOpenCall, navigate,
}: {
  patients: PatientListItem[];
  helpRequests: HelpRequestItem[];
  nurseName: string;
  onOpenCall: (h: HelpRequestItem) => void;
  navigate: (p: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(patients[0].id);
  const [selectedDetail, setSelectedDetail] = useState<PatientDetail | null>(null);

  useEffect(() => {
    api.patientDetail(selectedId).then(setSelectedDetail);
  }, [selectedId]);

  const activeCalls = helpRequests.filter((h) => h.status === "PENDING" || h.status === "ACKNOWLEDGED");
  const onlineCount = patients.filter((p) => p.is_online).length;
  const pendingMulti = selectedDetail?.todayTasks.filter(
    (t) => t.status === "REPORTED_COMPLETE_BY_PATIENT"
  ) ?? [];

  async function handleConfirmMulti(taskId: number, approve: boolean) {
    await api.confirmTask(taskId, 2, approve);
    api.patientDetail(selectedId).then(setSelectedDetail);
  }

  return (
    <>
      <div className="greeting block">
        <h1>Selamat Pagi, {nurseName.split(" ")[1] ?? nurseName}</h1>
        <p>Ringkasan pendampingan pasien untuk hari ini.</p>
      </div>

      <div className="card block">
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1 }}>
            <div className="mut">Pasien Terdaftar</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{patients.length}</div>
            <div className="mut" style={{ fontSize: 11 }}>{onlineCount} perangkat online</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="mut">Tugas Hari ini</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{selectedDetail?.todayTasks.length ?? "-"}</div>
            <div className="mut" style={{ fontSize: 11 }}>untuk {selectedDetail?.patient.name ?? "…"}</div>
          </div>
        </div>
      </div>

      {activeCalls.length > 0 && (
        <div className="block">
          <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Panggilan menunggu respons</h2>
          {activeCalls.map((h) => (
            <div key={h.id} className="card tint-rose" style={{ position: "relative", marginBottom: 10 }}>
              <span className="pill urgent" style={{ position: "absolute", top: 14, right: 14 }}>URGENT</span>
              <div className="patient-mini" style={{ marginBottom: 10 }}>
                <Avatar name={h.patient_name} />
                <div>
                  <div className="name">{h.patient_name}</div>
                  <div className="age">{h.room_number ?? ""}</div>
                </div>
              </div>
              {h.patient_speech_transcript && (
                <div className="quote-box" style={{ margin: "0 0 10px" }}>
                  <div className="label">PESAN PASIEN</div>
                  "{h.patient_speech_transcript}"
                </div>
              )}
              <button className="btn rose" onClick={() => onOpenCall(h)}>Tangani</button>
            </div>
          ))}
        </div>
      )}

      {pendingMulti.length > 0 && (
        <div className="card tint-navy block">
          <div className="card-title">Menunggu Persetujuan Caregiver</div>
          <div className="card-sub" style={{ marginBottom: 10 }}>
            Pasien {selectedDetail?.patient.name} melapor tugas selesai via Asisten AI
          </div>
          {pendingMulti.map((t) => (
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
                  onClick={() => handleConfirmMulti(t.id, true)}
                >
                  ✓ Setujui Selesai
                </button>
                <button
                  className="btn ghost"
                  style={{ flex: 1, padding: "8px 12px", fontSize: 13, color: "var(--rose)", border: "1px solid var(--line)" }}
                  onClick={() => handleConfirmMulti(t.id, false)}
                >
                  ✕ Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card tint-navy block">
        <div className="card-title">Jadwal Hari Ini</div>
        <div className="card-sub" style={{ marginBottom: 10 }}>Lihat jadwal anggota keluarga</div>
        <PatientSwitcher patients={patients} selectedId={selectedId} onChange={setSelectedId} />
        <div className="timeline">
          {selectedDetail && selectedDetail.todayTasks.length === 0 && (
            <div className="empty-state">Tidak ada jadwal hari ini.</div>
          )}
          {selectedDetail?.todayTasks.slice(0, 4).map((t) => (
            <TimelineRow key={t.id} task={t} />
          ))}
        </div>
        <button className="btn ghost-navy" style={{ marginTop: 10 }} onClick={() => navigate(`/keluarga/${selectedId}`)}>
          Lihat Semua
        </button>
      </div>
    </>
  );
}

function TimelineRow({ task }: { task: TaskItem }) {
  const meta = taskStatusMeta[task.status];
  const isMissed = task.status === "MISSED";
  return (
    <div
      className="timeline-item"
      style={
        isMissed
          ? {
              background: "var(--rose-soft)",
              padding: "6px 8px",
              borderRadius: 8,
              margin: "3px 0",
            }
          : {}
      }
    >
      <span className={`dot${meta.dotMuted ? " muted" : ""}`} />
      <div className="body">
        <div className="ttitle">{task.task_name}</div>
        <div className="ttime">{hhmm(task.scheduled_time)} WIB</div>
      </div>
      <span className={`status-badge ${meta.tone}`}>{meta.label}</span>
    </div>
  );
}
