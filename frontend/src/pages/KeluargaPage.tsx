import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { PhoneLayout } from "../components/PhoneLayout";
import { Avatar } from "../components/Avatar";
import { calcAge } from "../utils";
import type { PatientListItem } from "../types";

export function KeluargaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientListItem[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api.patientsForNurse(user.id).then((list) => {
      if (list.length <= 1) {
        // Akun 1 perawat : 1 pasien -> langsung ke Detail Keluarga, skip daftar.
        navigate(`/keluarga/${list[0]?.id}`, { replace: true });
      } else {
        setPatients(list);
      }
    });
  }, [user, navigate]);

  if (!patients) return <PhoneLayout><p className="mut" style={{ padding: 20 }}>Memuat…</p></PhoneLayout>;

  return (
    <PhoneLayout>
      <div className="block">
        <h1 style={{ fontSize: 20, marginBottom: 2 }}>Daftar Pasien</h1>
        <p className="mut">Lihat detail anggota keluarga Anda</p>
      </div>

      {patients.map((p) => {
        const age = calcAge(p.date_of_birth);
        return (
          <div key={p.id} className="card block" style={{ cursor: "pointer" }} onClick={() => navigate(`/keluarga/${p.id}`)}>
            <div className="patient-mini">
              <Avatar name={p.name} />
              <div style={{ flex: 1 }}>
                <div className="name">{p.name}</div>
                <div className="age">{age ? `${age} Tahun` : ""}</div>
                <div className="pill-row">
                  <span className={`pill ${p.is_online ? "online" : "offline"}`}>{p.is_online ? "• Online" : "• Offline"}</span>
                  <span className="pill battery">{p.battery_percentage ?? "-"}%</span>
                </div>
              </div>
              <span className="mut">›</span>
            </div>
          </div>
        );
      })}

      <button className="btn navy block" disabled title="Belum tersedia di versi demo ini">
        + Tambah Anggota
      </button>
    </PhoneLayout>
  );
}
