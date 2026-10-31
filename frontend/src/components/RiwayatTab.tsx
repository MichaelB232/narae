import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { requestStatusMeta } from "../statusLabels";
import type { AiLogItem, HelpRequestItem } from "../types";

const toneClass = {
    sage: "bg-sage-soft text-sage",
    rose: "bg-alert-soft text-alert",
    navy: "bg-navy-soft text-navy",
    neutral: "bg-neutral-badge text-neutral-badge-text",
};

const SWITCH = [
    { key: "interaksi", label: "Interaksi" },
    { key: "panggilan", label: "Panggilan" },
] as const;

const VIEW_META = {
    interaksi: {
        title: "Riwayat Interaksi AI",
        description: "Percakapan pasien dengan NARAE",
    },
    panggilan: {
        title: "Riwayat Pemanggilan",
        description: "Panggilan bantuan dari pasien",
    },
} as const;

function formatCallTime(iso: string) {
    const d = new Date(iso);
    const date = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    });
    const time = d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
    });

    return `${date} • ${time.replace(".", ":")} WIB`;
}

export function RiwayatTab({ patientId }: { patientId: number }) {
    const { user } = useAuth();
    const [view, setView] = useState<(typeof SWITCH)[number]["key"]>("interaksi");
    const [aiLogs, setAiLogs] = useState<AiLogItem[] | null>(null);
    const [calls, setCalls] = useState<HelpRequestItem[] | null>(null);

    const activeHeader = VIEW_META[view];

    useEffect(() => {
        if (!user) return;

        const load = () => {
            api.aiHistory(patientId).then(setAiLogs).catch(() => { });
            api
                .helpRequests(user.id)
                .then((rows: HelpRequestItem[]) =>
                    setCalls(rows.filter((h) => h.patient_id === patientId)),
                )
                .catch(() => { });
        };

        load();
        const t = setInterval(load, 5000);
        return () => clearInterval(t);
    }, [user, patientId]);
    const cardClass =
        "rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-3.5";
    return (
        <div className={`p-4 flex flex-col gap-4 ${cardClass}`}>
            <div className="mb-2.5 flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                    <div className="text-[15px] font-bold text-ink">
                        {activeHeader.title}
                    </div>
                    <div className="text-xs text-mute">
                        {activeHeader.description}
                    </div>
                </div>

                <div className="inline-flex shrink-0 rounded-full bg-surface-sunken">
                    {SWITCH.map((s) => (
                        <button
                            key={s.key}
                            type="button"
                            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition ${view === s.key
                                    ? "bg-navy font-bold text-white shadow-xs"
                                    : "text-mute hover:text-ink"
                                }`}
                            onClick={() => setView(s.key)}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {view === "interaksi" && (
                <>
                    {aiLogs?.length === 0 && (
                        <div className="px-3.5 py-6.5 text-center text-[13px] text-mute">
                            Belum ada riwayat percakapan.
                        </div>
                    )}

                    {aiLogs?.map((log) => (
                        <div
                            key={log.id}
                            className="mb-2.5 rounded-2xl border border-line bg-surface p-4"
                        >
                            <div className="mb-2 text-[11px] text-mute">
                                {new Date(log.created_at).toLocaleString("id-ID", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })}
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
                </>
            )}

            {view === "panggilan" && (
                <>
                    {calls?.length === 0 && (
                        <div className="px-3.5 py-6.5 text-center text-[13px] text-mute">
                            Belum ada riwayat pemanggilan.
                        </div>
                    )}

                    {calls?.map((h) => {
                        const meta = requestStatusMeta[h.status];

                        return (
                            <div
                                key={h.id}
                                className="mb-2.5 rounded-2xl border border-line bg-surface p-4"
                            >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-mute">
                                        {formatCallTime(h.created_at)}
                                    </span>
                                    <span
                                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${toneClass[meta.tone]}`}
                                    >
                                        {meta.label}
                                    </span>
                                </div>
                                <div className="rounded-lg bg-surface-sunken p-3 text-[13px] text-ink">
                                    <div className="mb-1 text-[10.5px] font-bold tracking-[0.04em] text-mute">
                                        {h.patient_speech_transcript
                                            ? "PESAN PASIEN"
                                            : "PANGGILAN"}
                                    </div>
                                    {h.patient_speech_transcript
                                        ? `"${h.patient_speech_transcript}"`
                                        : "Dipicu lewat tombol bantuan di gelang (tanpa pesan suara)."}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}
