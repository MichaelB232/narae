
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
  "rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden";

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
    <div className="flex flex-col gap-4 pb-6">

      {/* GREETING */}
      <section className="px-1 pt-2">
        <h1 className="text-xl font-bold tracking-tight text-[#263b56]">
          Selamat Pagi, {nurseName.split(" ")[1] ?? nurseName}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Ringkasan pendampingan pasien untuk hari ini.
        </p>
      </section>

      {/* PATIENT INFORMATION */}
      <section className={cardClass}>
        <div className="flex items-center gap-3 p-4">
          <Avatar name={detail.patient.name} />

          <div className="min-w-0">
            <p className="text-[11px] text-slate-500">
              Kamu Mendampingi
            </p>
            <h2 className="truncate text-sm font-bold text-slate-800">
              {detail.patient.name}
            </h2>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${detail.patient.is_online
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
                }`}
            >
              {detail.patient.is_online ? "• Online" : "• Offline"}
            </span>

            <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
              {detail.patient.battery_percentage ?? "-"}%
            </span>
          </div>
        </div>
      </section>

      {/* DAILY TIMELINE */}
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

      {/* PENDING TASK CONFIRMATION */}
      {pendingConfirm && (
        <section className={navyCardClass}>
          <h2 className={headingClass}>
            Menunggu Persetujuan Caregiver
          </h2>

          <p className="mb-3 mt-1 text-xs leading-relaxed text-slate-500">
            Pasien melapor tugas telah selesai via Asisten AI di gelang.
          </p>

          <div className="mb-3 flex items-center gap-3">
            <Avatar name={detail.patient.name} size={40} />

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800">
                {detail.patient.name}
              </h3>

              <p className="text-[11px] text-slate-500">
                {age ? `${age} Tahun` : ""}
                {detail.patient.room_number
                  ? ` • ${detail.patient.room_number}`
                  : ""}
              </p>
            </div>
          </div>

          {/* TASK INFORMATION */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                {pendingConfirm.task_name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {hhmm(pendingConfirm.scheduled_time)}
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-[#e3eaf3] px-2.5 py-1 text-[10px] font-semibold text-[#344966]">
              Laporan AI
            </span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-3 flex gap-2">
            <button
              className={`flex-1 ${approveButtonClass}`}
              onClick={() => confirm(pendingConfirm.id, true)}
            >
              ✓ Setujui Selesai
            </button>

            <button
              className={`flex-1 ${rejectButtonClass}`}
              onClick={() => confirm(pendingConfirm.id, false)}
            >
              ✕ Tolak
            </button>
          </div>

          <button
            className={`mt-2 w-full ${navyButtonClass}`}
            onClick={() => navigate(`/keluarga/${detail.patient.id}`)}
          >
            Cek Pasien
          </button>
        </section>
      )}
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
    <div className="flex flex-col gap-4 pb-6">

      {/* GREETING */}
      <section className="px-1 pt-2">
        <h1 className="text-xl font-bold tracking-tight text-[#263b56]">
          Selamat Pagi, {nurseName.split(" ")[1] ?? nurseName}
        </h1>

        <p className="mt-1 text-xs text-slate-500">
          Ringkasan pendampingan pasien untuk hari ini.
        </p>
      </section>

      {/* SUMMARY */}
      <section className={cardClass}>
        <div className="flex divide-x divide-slate-200">
          <div className="min-w-0 flex-1 pr-3">
            <p className="text-xs text-slate-500">
              Pasien Terdaftar
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-800">
              {patients.length}
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              {onlineCount} perangkat online
            </p>
          </div>

          <div className="min-w-0 flex-1 pl-3">
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

      {/* ACTIVE HELP REQUESTS */}
      {activeCalls.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-800">
            Panggilan Menunggu Respons
          </h2>

          <div className="flex flex-col gap-3">
            {activeCalls.map((h) => (
              <div
                key={h.id}
                className="relative rounded-2xl border border-rose-200 bg-rose-50 p-4"
              >
                <span className="absolute right-4 top-4 rounded-full bg-rose-100 px-2.5 py-1 text-[9px] font-bold tracking-wide text-rose-700">
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
                    <p className="mb-1 text-[10px] font-bold tracking-wide text-rose-600">
                      PESAN PASIEN
                    </p>

                    <p className="text-xs leading-relaxed text-slate-700">
                      "{h.patient_speech_transcript}"
                    </p>
                  </div>
                )}

                <button
                  className={`${buttonBaseClass} w-full bg-rose-600 text-white hover:bg-rose-700`}
                  onClick={() => onOpenCall(h)}
                >
                  Tangani
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PENDING TASK CONFIRMATIONS */}
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

      {/* PATIENT SCHEDULE */}
      <section className={navyCardClass}>
        <h2 className={headingClass}>
          Jadwal Hari Ini
        </h2>

        <p className="mb-3 mt-1 text-xs text-slate-500">
          Lihat jadwal anggota keluarga
        </p>

        <PatientSwitcher
          patients={patients}
          selectedId={selectedId}
          onChange={setSelectedId}
        />

        <div className="mt-3 flex flex-col gap-1">
          {!selectedDetail && (
            <p className="py-3 text-center text-xs text-slate-400">
              Memuat jadwal…
            </p>
          )}

          {selectedDetail && selectedDetail.todayTasks.length === 0 && (
            <div className="rounded-xl bg-white/70 px-3 py-5 text-center text-xs text-slate-500">
              Tidak ada jadwal hari ini.
            </div>
          )}

          {selectedDetail?.todayTasks.slice(0, 4).map((t) => (
            <TimelineRow key={t.id} task={t} />
          ))}
        </div>

        <button
          className={`mt-3 w-full ${navyButtonClass}`}
          onClick={() => navigate(`/keluarga/${selectedId}`)}
        >
          Lihat Semua
        </button>
      </section>
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
