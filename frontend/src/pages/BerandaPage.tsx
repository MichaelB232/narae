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
import type {
  PatientListItem,
  PatientDetail,
  HelpRequestItem,
  TaskItem,
} from "../types";

// ======================= SHARED STYLES =======================

const cardClass =
  "rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden";

const navyCardClass =
  "rounded-2xl border border-[#dce3ed] bg-[#f3f6fa] p-4";

const headingClass = "text-sm font-bold text-slate-900";
const headingBlueClass = "text-sm font-bold text-slate-900 bg-linear-to-r from-[#426783] to-[#A8C1D1] p-4";

const descriptionClass = "text-xs leading-relaxed text-slate-500";

const buttonBaseClass =
  "inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const approveButtonClass =
  `${buttonBaseClass} bg-[#e5f1e9] text-[#38664a] hover:bg-[#d5e8dc]`;

const rejectButtonClass =
  `${buttonBaseClass} border border-rose-200 bg-white text-rose-600 hover:bg-rose-50`;

const navyButtonClass =
  `${buttonBaseClass} border border-[#d5deea] bg-white text-[#344966] hover:bg-[#eaf0f7]`;

const statusToneClasses: Record<string, string> = {
  navy: "bg-[#e3eaf3] text-[#344966]",
  sage: "bg-[#e5f1e9] text-[#38664a]",
  rose: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
  muted: "bg-slate-100 text-slate-500",
  gray: "bg-slate-100 text-slate-600",
};

function getStatusClass(tone: string) {
  return statusToneClasses[tone] ?? "bg-slate-100 text-slate-600";
}

// ======================= MAIN PAGE =======================

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

  // Automatically show a new pending help request.
  useEffect(() => {
    if (sheetItem) return;

    const fresh = helpRequests.find(
      (h) => h.status === "PENDING" && !dismissedIds.has(h.id)
    );

    if (fresh) setSheetItem(fresh);
  }, [helpRequests, dismissedIds, sheetItem]);

  if (!patients || !user) {
    return (
      <PhoneLayout>
        <p className="p-5 text-sm text-slate-500">
          Memuat…
        </p>
      </PhoneLayout>
    );
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

  // No registered patients.
  if (patients.length === 0) {
    return (
      <PhoneLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf0f7] text-2xl">
            ♡
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Belum Ada Pasien
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
            Belum ada pasien yang terdaftar dalam pendampinganmu.
          </p>
        </div>
      </PhoneLayout>
    );
  }

  // Dashboard for one patient.
  if (patients.length === 1) {
    return (
      <PhoneLayout>
        <SingleDashboard
          patient={patients[0]}
          nurseId={user.id}
          nurseName={user.full_name}
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

  // Dashboard for multiple patients.
  return (
    <PhoneLayout>
      <MultiDashboard
        patients={patients}
        helpRequests={helpRequests}
        nurseId={user.id}
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

function SingleDashboard({
  patient,
  nurseId,
  nurseName,
  navigate,
}: {
  patient: PatientListItem;
  nurseId: number;
  nurseName: string;
  navigate: (p: string) => void;
}) {
  const [detail, setDetail] = useState<PatientDetail | null>(null);

  const load = useCallback(async () => {
    setDetail(await api.patientDetail(patient.id));
  }, [patient.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!detail) {
    return (
      <p className="p-5 text-sm text-slate-500">
        Memuat pasien…
      </p>
    );
  }

  const done = detail.todayTasks.filter(
    (t) => t.status === "CONFIRMED_BY_NURSE"
  ).length;

  const total = detail.todayTasks.length;

  const pendingConfirm = detail.todayTasks.find(
    (t) => t.status === "REPORTED_COMPLETE_BY_PATIENT"
  );

  const age = calcAge(detail.patient.date_of_birth);

  async function confirm(taskId: number, approve: boolean) {
    await api.confirmTask(taskId, nurseId, approve);
    load();
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 pb-24 font-sans antialiased">

      {/* ================= HEADER BIRU DENGAN LENGKUNGAN ================= */}
      <div className="relative bg-gradient-to-b from-[#64849B] to-[#7E9EB2] pt-[64px] pb-20 px-6 text-white">

        {/* Logo */}
        <h1 className="text-xl font-bold tracking-wider">narae.</h1>

        {/* Sambutan */}
        <div className="mt-5">
          <h2 className="text-2xl font-bold">Selamat Pagi, {nurseName.split(" ")[1] ?? nurseName}</h2>
          <p className="text-xs text-slate-100 opacity-90 mt-1">
            Ringkasan pendampingan pasien untuk hari ini.
          </p>
        </div>

        {/* SVG Wave / Kurva di Bagian Bawah Header */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
          <svg
            viewBox="0 0 500 40"
            preserveAspectRatio="none"
            className="w-full h-8 text-[#FDFBF7] fill-current"
          >
            <path d="M0,0 C150,35 350,35 500,0 L500,40 L0,40 Z"></path>
          </svg>
        </div>
      </div>


      {/* ================= KONTEN UTAMA (CARD CONTAINER) ================= */}
      {/* Menggunakan -mt-12 agar card naik dan menumpang di atas header biru */}
      <div className="px-5 -mt-12 relative z-10 max-w-md mx-auto space-y-4">

        {/* --- Card 1: Profil Pasien (Ibu Odette) --- */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
              // name={detail.patient.name}
              alt="Ibu Odette"
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <p className="text-xs text-slate-400 font-medium">Kamu Mendampingi</p>
              <h3 className="text-base font-bold text-slate-800">{detail.patient.name}</h3>
            </div>
          </div>

          <div className="text-right flex">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1">
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${detail.patient.is_online
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
                  }`}
              >
                {detail.patient.is_online ? "• Online" : "• Offline"}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${detail.patient.is_online
                  ? "text-emerald-50 bg-emerald-700"
                  : "text-slate-100 bg-slate-500"
                  }`}
              >
                67%
              </span>
            </div>
          </div>
        </div>


        {/* --- Card 2: Aktivitas Hari Ini --- */}
        <section className={cardClass}>
          <div className={headingBlueClass}>
            <h2 className="text-white">
              {total === 0
                ? "Belum Ada Jadwal Hari Ini"
                : done === total
                  ? "Hari ini Berjalan Sangat Baik"
                  : "Hari ini Sedang Berjalan"}
            </h2>

            <p className="text-xs font-medium text-white">
              {done} dari {total} aktivitas selesai
            </p>
          </div>


          <div className="flex flex-col gap-1 p-4">
            {detail.todayTasks.map((t) => (
              <TimelineRow key={t.id} task={t} />
            ))}
          </div>
        </section>


      </div>




    </div>
  );
}

// ======================= DASHBOARD >1 PASIEN =======================

function MultiDashboard({
  patients,
  helpRequests,
  nurseId,
  nurseName,
  onOpenCall,
  navigate,
}: {
  patients: PatientListItem[];
  helpRequests: HelpRequestItem[];
  nurseId: number;
  nurseName: string;
  onOpenCall: (h: HelpRequestItem) => void;
  navigate: (p: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(patients[0].id);

  const [selectedDetail, setSelectedDetail] =
    useState<PatientDetail | null>(null);

  useEffect(() => {
    setSelectedDetail(null);
    api.patientDetail(selectedId).then(setSelectedDetail);
  }, [selectedId]);

  const activeCalls = helpRequests.filter(
    (h) => h.status === "PENDING" || h.status === "ACKNOWLEDGED"
  );

  const onlineCount = patients.filter((p) => p.is_online).length;

  const pendingMulti =
    selectedDetail?.todayTasks.filter(
      (t) => t.status === "REPORTED_COMPLETE_BY_PATIENT"
    ) ?? [];

  async function handleConfirmMulti(taskId: number, approve: boolean) {
    await api.confirmTask(taskId, nurseId, approve);
    api.patientDetail(selectedId).then(setSelectedDetail);
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 pb-24 font-sans antialiased no-scrollbar overflow-y-auto">

      {/* ================= HEADER BIRU DENGAN LENGKUNGAN ================= */}
      <div className="relative bg-gradient-to-b from-[#64849B] to-[#7E9EB2] pt-[64px] pb-20 px-6 text-white">

        {/* Logo */}
        <h1 className="text-xl font-bold tracking-wider">narae.</h1>

        {/* Sambutan */}
        <div className="mt-5">
          <h2 className="text-2xl font-bold">
            Selamat Pagi, {nurseName.split(" ")[1] ?? nurseName}
          </h2>
          <p className="text-xs text-slate-100 opacity-90 mt-1">
            Ringkasan pendampingan pasien untuk hari ini.
          </p>
        </div>

        {/* SVG Wave / Kurva di Bagian Bawah Header */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
          <svg
            viewBox="0 0 500 40"
            preserveAspectRatio="none"
            className="w-full h-8 text-[#FDFBF7] fill-current"
          >
            <path d="M0,0 C150,35 350,35 500,0 L500,40 L0,40 Z"></path>
          </svg>
        </div>
      </div>


      {/* ================= KONTEN UTAMA (CARD CONTAINER) ================= */}
      <div className="px-5 -mt-12 relative z-10 max-w-md mx-auto flex flex-col gap-6">

        {/* --- Card 1: Profil Pasien & Ringkasan Perangkat --- */}
        <section className={cardClass}>
          <div className="flex">
            <div className="min-w-0 flex-1 p-4">
              <p className="text-xs text-slate-500">
                Pasien Terdaftar
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {patients.length}
              </p>

              <p className="mt-1 text-[11px] text-emerald-700">
                {onlineCount} perangkat online
              </p>
            </div>

            <div className="min-w-0 flex-1 p-4">
              <p className="text-xs text-slate-500">
                Tugas Hari Ini
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {selectedDetail?.todayTasks.length ?? "-"}
              </p>

              <p className="mt-1 truncate text-[11px] text-slate-500">
                untuk {selectedDetail?.patient.name ?? "…"}
              </p>
            </div>
          </div>
        </section>


        {/* --- PANGGILAN MENUNGGU RESPON (URGENT) --- */}
        {activeCalls.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800">
              Panggilan Menunggu Respons
            </h2>

            <div className="flex flex-col gap-3">
              {activeCalls.map((h) => (
                <div
                  key={h.id}
                  className="relative rounded-2xl border border-[#C65353] bg-[#C65353]/10 p-4 shadow-sm"
                >
                  <span className="absolute right-4 top-4 rounded-full bg-[#C65353] px-2.5 py-1 text-[9px] font-bold tracking-wide text-white">
                    URGENT
                  </span>

                  <div className="mb-3 flex items-center gap-3 pr-16">
                    <Avatar name={h.patient_name} />

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-800">
                        {h.patient_name}
                      </h3>

                      <p className="text-xs text-slate-500">
                        {h.room_number ?? ""}
                      </p>
                    </div>
                  </div>

                  {h.patient_speech_transcript && (
                    <div className="mb-3 rounded-xl border border-rose-100 bg-white p-3">
                      <p className="mb-1 text-[10px] font-bold tracking-wide text-[#C65353]">
                        PESAN PASIEN
                      </p>

                      <p className="text-xs leading-relaxed text-slate-700">
                        "{h.patient_speech_transcript}"
                      </p>
                    </div>
                  )}

                  <button
                    className={`${buttonBaseClass} w-full bg-[#C65353] text-white hover:bg-[#ab4949]`}
                    onClick={() => onOpenCall(h)}
                  >
                    Tangani
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* --- MENUNGGU PERSETUJUAN CAREGIVER --- */}
        {pendingMulti.length > 0 && (
          <section className={navyCardClass}>
            <h2 className={headingClass}>
              Menunggu Persetujuan Caregiver
            </h2>

            <p className="mb-3 mt-1 text-xs leading-relaxed text-slate-500">
              Pasien {selectedDetail?.patient.name} melapor tugas selesai via Asisten AI.
            </p>

            <div className="flex flex-col gap-3">
              {pendingMulti.map((t) => (
                <div
                  key={t.id}
                  className="border-t border-slate-200 pt-3 first:border-0 first:pt-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-800">
                        {t.task_name}
                      </h3>

                      <p className="mt-1 text-[11px] text-slate-500">
                        Jadwal: {hhmm(t.scheduled_time)}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-[#e3eaf3] px-2.5 py-1 text-[10px] font-semibold text-[#344966]">
                      Laporan AI
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      className={`flex-1 ${approveButtonClass}`}
                      onClick={() => handleConfirmMulti(t.id, true)}
                    >
                      ✓ Setujui Selesai
                    </button>

                    <button
                      className={`flex-1 ${rejectButtonClass}`}
                      onClick={() => handleConfirmMulti(t.id, false)}
                    >
                      ✕ Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* --- CARD 2: AKTIVITAS / JADWAL HARI INI --- */}
        <section className={cardClass}>
          <div className={headingBlueClass}>
            <h2 className="text-sm font-bold text-white">
              {selectedDetail?.todayTasks.length === 0
                ? "Belum Ada Jadwal Hari Ini"
                : "Hari ini Berjalan Sangat Baik"}
            </h2>

            <p className="text-xs opacity-90 mt-0.5  text-white">
              {selectedDetail?.todayTasks.filter(t => t.status === 'CONFIRMED_BY_NURSE').length ?? 0} dari {selectedDetail?.todayTasks.length ?? 0} aktivitas selesai
            </p>
          </div>

          <div className="p-4">
            {/* Switcher Pasien jika ingin tetap bisa ganti-ganti */}
            <div className="mb-3">
              <PatientSwitcher
                patients={patients}
                selectedId={selectedId}
                onChange={setSelectedId}
              />
            </div>

            <div className="flex flex-col gap-1">
              {!selectedDetail && (
                <p className="py-3 text-center text-xs text-slate-400">
                  Memuat jadwal…
                </p>
              )}

              {selectedDetail && selectedDetail.todayTasks.length === 0 && (
                <div className="rounded-xl bg-slate-50 px-3 py-5 text-center text-xs text-slate-500">
                  Tidak ada jadwal hari ini.
                </div>
              )}

              {selectedDetail?.todayTasks.map((t) => (
                <TimelineRow key={t.id} task={t} />
              ))}
            </div>

            <button
              className={`mt-4 w-full ${navyButtonClass ?? "bg-[#64849B] text-white py-2.5 rounded-xl text-xs font-semibold"}`}
              onClick={() => navigate(`/keluarga/${selectedId}`)}
            >
              Lihat Semua
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

// ======================= TIMELINE ROW =======================

function TimelineRow({ task }: { task: TaskItem }) {
  const meta = taskStatusMeta[task.status];
  const isMissed = task.status === "MISSED";

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-2 py-2 ${isMissed ? "my-0.5 " : ""
        }`}
    >
      {/* TIMELINE DOT */}
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dotMuted ? "bg-slate-300" : "bg-[#526b8a]"
          }`}
      />

      {/* TASK INFORMATION */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800">
          {task.task_name}
        </p>

        <p className="mt-0.5 text-[11px] text-slate-500">
          {hhmm(task.scheduled_time)} WIB
        </p>
      </div>

      {/* TASK STATUS */}
      <span
        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusClass(
          meta.tone
        )}`}
      >
        {meta.label}
      </span>
    </div>
  );
}