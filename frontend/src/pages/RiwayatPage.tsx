import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { PhoneLayout } from "../components/PhoneLayout";
import { Avatar } from "../components/Avatar";
import { calcAge } from "../utils";
import type { PatientListItem } from "../types";

export function RiwayatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientListItem[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api.patientsForNurse(user.id).then((list) => {
      if (list.length <= 1) {
        navigate(`/riwayat/${list[0]?.id}`, { replace: true });
      } else {
        setPatients(list);
      }
    });
  }, [user, navigate]);

  if (!patients) {
    return (
      <PhoneLayout>
        <p className="p-5 text-[13px] text-mute">Memuat…</p>
      </PhoneLayout>
    );
  }

  return (
    <PhoneLayout>
      <div className="min-h-full p-4 pt-[64px] bg-linear-to-br from-[#EAF1F5] to-[#FAF7F0]">
        <div className="mb-3.5">
          <h1 className="mb-0.5 text-xl font-bold text-ink">Riwayat</h1>
          <p className="m-0 text-[13px] text-mute">Pilih pasien untuk melihat riwayatnya</p>
        </div>

        {patients.map((p) => {
          const age = calcAge(p.date_of_birth);
          return (
            <div
              key={p.id}
              className="mb-3.5 cursor-pointer rounded-2xl border border-line bg-surface p-4 transition hover:border-navy/40 active:scale-[0.99]"
              onClick={() => navigate(`/riwayat/${p.id}`)}
            >
              <div className="flex items-center gap-3">
                <Avatar name={p.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-ink">{p.name}</div>
                  <div className="text-xs text-mute">{age ? `${age} Tahun` : ""}</div>
                  <div className="mt-0.5 flex gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.is_online ? "bg-sage-soft text-sage" : "bg-neutral-badge text-neutral-badge-text"
                        }`}
                    >
                      {p.is_online ? "• Online" : "• Offline"}
                    </span>
                    <span className="rounded-full bg-sage-soft px-2 py-0.5 text-[10px] font-bold text-sage">
                      {p.battery_percentage ?? "-"}%
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold text-mute">›</span>
              </div>
            </div>
          );
        })}
      </div>
    </PhoneLayout>
  );
}