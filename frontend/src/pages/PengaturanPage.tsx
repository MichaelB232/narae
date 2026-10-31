import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { PhoneLayout } from "../components/PhoneLayout";
import { Avatar } from "../components/Avatar";

// Belum ada desain Figma untuk halaman ini — dibuat minimal, mengikuti tema yang sama.
export function PengaturanPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <PhoneLayout>
      <div className="block" style={{ paddingTop: 6 }}>
        <h1 style={{ fontSize: 20, marginBottom: 2 }}>Pengaturan</h1>
        <p className="mut">Akun dan preferensi</p>
      </div>

      <div className="card block">
        <div className="patient-mini">
          <Avatar name={user.full_name} />
          <div>
            <div className="name">{user.full_name}</div>
            <div className="mut">@{user.username} · {user.role === "nurse" ? "Perawat" : "Keluarga"}</div>
          </div>
        </div>
      </div>

      <button
        className="btn outline-rose block"
        onClick={() => { logout(); navigate("/login"); }}
      >
        Keluar
      </button>
    </PhoneLayout>
  );
}
