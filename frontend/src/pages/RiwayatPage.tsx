import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { PhoneLayout } from "../components/PhoneLayout";
import { Avatar } from "../components/Avatar";
import { requestStatusMeta } from "../statusLabels";
import type { HelpRequestItem } from "../types";

const toneClass = {
    sage: "bg-sage-soft text-sage",
    rose: "bg-alert-soft text-alert",
    navy: "bg-navy-soft text-navy",
    neutral: "bg-neutral-badge text-neutral-badge-text",
};

function formatCallTime(iso: string) {
    const d = new Date(iso);
    const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
    const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });
    return `${date} • ${time.replace(".", ":")} WIB`;
}

export function RiwayatPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<HelpRequestItem[] | null>(null);

    useEffect(() => {
        if (!user) return;
        const load = () => api.helpRequests(user.id).then(setItems).catch(() => { });
        load();
        const t = setInterval(load, 5000);
        return () => clearInterval(t);
    }, [user]);

    return (
        <PhoneLayout>
            <div className="min-h-full p-4 pt-[64px] bg-linear-to-br from-[#EAF1F5] to-[#FAF7F0]">
                <div className="mb-3.5">
                    <h1 className="mb-0.5 text-xl font-bold text-ink">Riwayat Pemanggilan</h1>
                    <p className="m-0 text-[13px] text-mute">Semua panggilan bantuan dari pasien Anda</p>
                </div>

                {!items && <p className="text-[13px] text-mute">Memuat…</p>}

                {items?.length === 0 && (
                    <div className="rounded-2xl border border-line bg-surface p-4 text-center text-[13px] text-mute">
                        Belum ada riwayat pemanggilan.
                    </div>
                )}

                {items?.map((h) => {
                    const meta = requestStatusMeta[h.status];
                    return (
                        <div key={h.id} className="mb-3.5 rounded-2xl border border-line bg-surface p-4">
                            <div className="flex items-center gap-3">
                                <Avatar name={h.patient_name} />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-[15px] font-bold text-ink">{h.patient_name}</div>
                                    <div className="text-xs text-mute">{h.room_number ?? ""}</div>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${toneClass[meta.tone]}`}>
                                    {meta.label}
                                </span>
                            </div>

                            <div className="mt-3 rounded-lg bg-surface-sunken p-3 text-[13px] text-ink">
                                <div className="mb-1 text-[10.5px] font-bold tracking-[0.04em] text-mute">
                                    {h.patient_speech_transcript ? "PESAN PASIEN" : "PANGGILAN"}
                                </div>
                                {h.patient_speech_transcript
                                    ? `"${h.patient_speech_transcript}"`
                                    : "Dipicu lewat tombol bantuan di gelang (tanpa pesan suara)."}
                            </div>

                            <div className="mt-2.5 text-xs text-mute">{formatCallTime(h.created_at)}</div>
                        </div>
                    );
                })}
            </div>
        </PhoneLayout>
    );
}