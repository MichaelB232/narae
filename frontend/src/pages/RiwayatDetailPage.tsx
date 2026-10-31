import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { PhoneLayout } from "../components/PhoneLayout";
import { Avatar } from "../components/Avatar";
import { BackButton } from "../components/BackButton";
import { requestStatusMeta } from "../statusLabels";
import { calcAge } from "../utils";
import type { AiLogItem, HelpRequestItem, PatientDetail } from "../types";

const toneClass = {
    sage: "bg-sage-soft text-sage",
    rose: "bg-alert-soft text-alert",
    navy: "bg-navy-soft text-navy",
    neutral: "bg-neutral-badge text-neutral-badge-text",
};

const TABS = [
    { key: "interaksi", label: "Interaksi AI" },
    { key: "pemanggilan", label: "Pemanggilan" },
] as const;

function formatCallTime(iso: string) {
    const d = new Date(iso);
    const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
    const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });
    return `${date} • ${time.replace(".", ":")} WIB`;
}

export function RiwayatDetailPage() {
    const { id } = useParams<{ id: string }>();
    const patientId = Number(id);
    const { user } = useAuth();
    const navigate = useNavigate();

    const [detail, setDetail] = useState<PatientDetail | null>(null);
    const [aiLogs, setAiLogs] = useState<AiLogItem[] | null>(null);
    const [calls, setCalls] = useState<HelpRequestItem[] | null>(null);
    const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("interaksi");

    useEffect(() => {
        if (!user || !patientId) return;
        api.patientDetail(patientId).then(setDetail);

        const load = () => {
            api.aiHistory(patientId).then(setAiLogs).catch(() => { });
            api
                .helpRequests(user.id)
                .then((rows: HelpRequestItem[]) => setCalls(rows.filter((h) => h.patient_id === patientId)))
                .catch(() => { });
        };
        load();
        const t = setInterval(load, 5000);
        return () => clearInterval(t);
    }, [user, patientId]);

    if (!detail) {
        return (
            <PhoneLayout>
                <p className="p-5 text-[13px] text-mute">Memuat…</p>
            </PhoneLayout>
        );
    }

    const age = calcAge(detail.patient.date_of_birth);

    return (
        <PhoneLayout>
            <div className="min-h-full p-4 pt-[64px] bg-linear-to-br from-[#EAF1F5] to-[#FAF7F0]">
                <div className="mb-3.5 flex items-center gap-2.5">
                    <BackButton onClick={() => navigate(-1)} />
                    <div>
                        <h1 className="m-0 text-lg font-bold text-ink">Riwayat</h1>
                        <p className="m-0 text-[13px] text-mute">Interaksi AI dan pemanggilan pasien</p>
                    </div>
                </div>

                <div className="mb-3.5 rounded-2xl border border-line bg-surface p-4">
                    <div className="flex items-center gap-3">
                        <Avatar name={detail.patient.name} />
                        <div className="min-w-0 flex-1">
                            <div className="text-[15px] font-bold text-ink">{detail.patient.name}</div>
                            <div className="text-xs text-mute">{age ? `${age} Tahun` : ""}</div>
                        </div>
                    </div>
                </div>

                <div className="my-3.5 flex gap-0.5 rounded-xl bg-white p-2 border border-line">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            className={`flex-1 cursor-pointer rounded-full py-2 px-1 text-center text-[12.5px] transition ${tab === t.key ? "bg-navy font-bold text-white shadow-xs" : "font-semibold text-mute hover:text-ink"
                                }`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === "interaksi" && (
                    <div className="mb-3.5">
                        <div className="text-[15px] font-bold text-ink">Riwayat Interaksi AI</div>
                        <div className="mb-2.5 text-xs text-mute">Percakapan pasien dengan NARAE</div>

                        {aiLogs?.length === 0 && (
                            <div className="py-6.5 px-3.5 text-center text-[13px] text-mute">
                                Belum ada riwayat percakapan.
                            </div>
                        )}
                        {aiLogs?.map((log) => (
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

                {tab === "pemanggilan" && (
                    <div className="mb-3.5">
                        <div className="text-[15px] font-bold text-ink">Riwayat Pemanggilan</div>
                        <div className="mb-2.5 text-xs text-mute">Panggilan bantuan dari pasien</div>

                        {calls?.length === 0 && (
                            <div className="py-6.5 px-3.5 text-center text-[13px] text-mute">
                                Belum ada riwayat pemanggilan.
                            </div>
                        )}
                        {calls?.map((h) => {
                            const meta = requestStatusMeta[h.status];
                            return (
                                <div key={h.id} className="mb-2.5 rounded-2xl border border-line bg-surface p-4">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="text-[11px] text-mute">{formatCallTime(h.created_at)}</span>
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${toneClass[meta.tone]}`}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <div className="rounded-lg bg-surface-sunken p-3 text-[13px] text-ink">
                                        <div className="mb-1 text-[10.5px] font-bold tracking-[0.04em] text-mute">
                                            {h.patient_speech_transcript ? "PESAN PASIEN" : "PANGGILAN"}
                                        </div>
                                        {h.patient_speech_transcript
                                            ? `"${h.patient_speech_transcript}"`
                                            : "Dipicu lewat tombol bantuan di gelang (tanpa pesan suara)."}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PhoneLayout>
    );
}