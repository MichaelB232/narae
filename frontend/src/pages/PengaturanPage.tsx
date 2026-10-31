import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../api/client";
import { PhoneLayout } from "../components/PhoneLayout";
import { Avatar } from "../components/Avatar";

export function PengaturanPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!user) return null;

  const isDemoAccount =
    user.username.startsWith("demo.") ||
    user.username.startsWith("juri.") ||
    user.username.startsWith("suster.");

  async function handleResetDemo() {
    if (!confirm("Apakah Anda yakin ingin mereset seluruh data simulasi (tugas, barang, riwayat) ke kondisi awal?")) {
      return;
    }
    setResetting(true);
    setFeedback(null);
    try {
      await api.resetDemo(user!.id);
      setFeedback({
        type: "success",
        text: "Data simulasi berhasil direset ke kondisi awal!",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message ?? "Gagal mereset data demo",
      });
    } finally {
      setResetting(false);
    }
  }

  return (
    <PhoneLayout>
      <div className="p-4 pt-[64px] bg-linear-to-br from-[#EAF1F5] to-[#FAF7F0] min-h-screen">
        <div className="mb-3.5 pt-1.5">
          <h1 className="mb-0.5 text-xl font-bold text-ink">Pengaturan</h1>
          <p className="m-0 text-[13px] text-mute">Akun dan preferensi</p>
        </div>

        {/* Profil Pengguna */}
        <div className="mb-3.5 rounded-2xl border border-line bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <Avatar name={user.full_name} />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-ink truncate">{user.full_name}</div>
              <div className="text-[13px] text-mute">
                @{user.username} · {user.role === "nurse" ? "Perawat" : "Keluarga"}
              </div>
            </div>
            {(user.username.startsWith("demo.") || user.username.startsWith("juri.")) && (
              <span className="rounded-full bg-navy px-2.5 py-0.5 text-[10px] font-bold text-white shrink-0">
                Sesi Demo
              </span>
            )}
          </div>
        </div>

        {/* Notifikasi Feedback */}
        {feedback && (
          <div
            className={`mb-3.5 rounded-xl border p-3 text-xs font-semibold ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {feedback.type === "success" ? "✓ " : "⚠ "}
            {feedback.text}
          </div>
        )}

        {/* Kartu Manajemen Demo */}
        {isDemoAccount && (
          <div className="mb-3.5 rounded-2xl border border-navy/20 bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-navy">
                Kontrol Sesi Demo
              </span>
              <span className="text-[10px] text-mute">Simulasi</span>
            </div>
            <p className="text-[12px] text-mute leading-relaxed mb-3">
              Ingin mengulangi alur demonstrasi dari awal atau mengganti akun tanpa bentrok data?
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResetDemo}
                disabled={resetting}
                className="w-full cursor-pointer rounded-xl border border-navy bg-navy-soft/60 py-2.5 px-3 text-center text-xs font-bold text-navy transition hover:bg-navy-soft active:scale-[0.99] disabled:opacity-50"
              >
                {resetting ? "Mereset Data..." : "🔄 Reset Data Simulasi ke Awal"}
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="w-full cursor-pointer rounded-xl border border-line bg-paper py-2 px-3 text-center text-xs font-semibold text-ink transition hover:bg-surface-sunken active:scale-[0.99]"
              >
                ➕ Buat Sesi Baru (Ganti Akun)
              </button>
            </div>
          </div>
        )}

        {/* Tombol Logout */}
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
