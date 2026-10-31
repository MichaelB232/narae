import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { PhoneLayout } from "../components/PhoneLayout";
import { Avatar } from "../components/Avatar";

// Halaman Pengaturan dengan Tailwind utility classes
export function PengaturanPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <PhoneLayout>
      <div className="p-4 pt-[64px] bg-linear-to-br from-[#EAF1F5] to-[#FAF7F0]">
        <div className="mb-3.5 pt-1.5">
          <h1 className="mb-0.5 text-xl font-bold text-ink">Pengaturan</h1>
          <p className="m-0 text-[13px] text-mute">Akun dan preferensi</p>
        </div>

        <div className="mb-3.5 rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.full_name} />
            <div>
              <div className="text-[15px] font-bold text-ink">{user.full_name}</div>
              <div className="text-[13px] text-mute">
                @{user.username} · {user.role === "nurse" ? "Perawat" : "Keluarga"}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="w-full cursor-pointer rounded-full border border-alert bg-[#C65353] py-3 px-4 text-center text-sm font-bold text-white transition hover:bg-[#ab4949] active:scale-[0.99]"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Keluar
        </button>
      </div>
    </PhoneLayout>
  );
}
