import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("narae123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingMode, setGeneratingMode] = useState<"single" | "multiple" | null>(null);
  const [demoResult, setDemoResult] = useState<{
    user: any;
    token: string;
    password?: string;
    mode?: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(username, password);
      login(res.user, res.token);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Gagal login");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateDemo(mode: "single" | "multiple") {
    setError(null);
    setGeneratingMode(mode);
    try {
      const res = await api.generateDemo(mode);
      setDemoResult(res);
      setUsername(res.user.username);
      setPassword(res.password ?? "narae123");
    } catch (err: any) {
      setError(
        err.message ||
        "Sesi demo belum berhasil dibuat karena bentrok ID sementara. Silakan klik tombol 'Buat Akun Demo' sekali lagi ya!"
      );
    } finally {
      setGeneratingMode(null);
    }
  }

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-[420px]">
        {/* Modal Sesi Demo Baru */}
        {demoResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-[390px] rounded-3xl border border-line bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sage-soft px-3 py-1 text-xs font-bold text-sage">
                Akun Demo Berhasil Dibuat
              </div>
              <h2 className="text-xl font-bold text-ink">
                {demoResult.mode === "multiple" ? "Mode 3 Pasien" : "Mode 1 Pasien"}
              </h2>
              <p className="mt-1 text-xs text-mute leading-relaxed">
                Akun simulasi perawat dengan data pasien mandiri telah siap digunakan.
              </p>

              {/* Kredensial Box */}
              <div className="my-4 rounded-2xl border border-line bg-paper p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-mute">Username:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink bg-surface px-2 py-0.5 rounded border border-line">
                      {demoResult.user.username}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(demoResult.user.username, "user")}
                      className="cursor-pointer text-[11px] font-semibold text-navy hover:underline"
                    >
                      {copiedField === "user" ? "✓ Tersalin" : "Salin"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-mute">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink bg-surface px-2 py-0.5 rounded border border-line">
                      {demoResult.password ?? "narae123"}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(demoResult.password ?? "narae123", "pass")}
                      className="cursor-pointer text-[11px] font-semibold text-navy hover:underline"
                    >
                      {copiedField === "pass" ? "✓ Tersalin" : "Salin"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Note 2-Device Testing */}
              <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-[11.5px] leading-relaxed text-blue-900">
                <div className="font-bold mb-1">
                  Ingin uji coba 2 perangkat bersamaan?
                </div>
                Buka NARAE di browser HP Anda dan login dengan username &amp; password di atas. Laptop akan menampilkan Gelang, dan HP menampilkan Dashboard Perawat secara <i>real-time</i>!
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    login(demoResult.user, demoResult.token);
                    navigate("/");
                  }}
                  className="w-full cursor-pointer rounded-full bg-navy py-3 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99] shadow-sm"
                >
                  Mulai Demo Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => setDemoResult(null)}
                  className="w-full cursor-pointer py-2 text-center text-xs font-semibold text-mute hover:text-ink"
                >
                  Tutup &amp; Masuk Manual
                </button>
              </div>
            </div>
          </div>
        )}

        <form
          className="rounded-3xl border border-line bg-surface p-7 shadow-sm"
          onSubmit={submit}
        >
          <div className="text-lg font-bold tracking-[0.02em] text-ink after:text-navy after:content-['.']">
            narae
          </div>
          <h1 className="mt-1.5 mb-1 text-2xl font-bold text-ink">Masuk</h1>
          <p className="mb-5 text-[13px] text-mute">
            Masuk sebagai perawat untuk mendampingi keluarga Anda.
          </p>

          {/* Kotak Buat Akun Demo */}
          <div className="mb-5 rounded-2xl border border-line bg-surface-sunken/60 p-4">
            <div className="text-[13px] font-bold text-ink mb-1">
              Buat Akun Demo
            </div>
            <p className="text-[11.5px] text-mute mb-3 leading-snug">
              Buat sesi simulasi baru mandiri tanpa bentrok data dengan pengguna lain:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGenerateDemo("single")}
                disabled={generatingMode !== null}
                className="cursor-pointer rounded-xl border border-navy/30 bg-surface p-2.5 text-center transition hover:border-navy hover:bg-navy-soft/30 active:scale-[0.99] disabled:opacity-50"
              >
                <div className="text-xs font-bold text-navy">
                  {generatingMode === "single" ? "Memproses…" : "Demo 1 Pasien"}
                </div>
                <div className="text-[10px] text-mute mt-0.5">
                  1 Perawat : 1 Pasien
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleGenerateDemo("multiple")}
                disabled={generatingMode !== null}
                className="cursor-pointer rounded-xl border border-navy/30 bg-surface p-2.5 text-center transition hover:border-navy hover:bg-navy-soft/30 active:scale-[0.99] disabled:opacity-50"
              >
                <div className="text-xs font-bold text-navy">
                  {generatingMode === "multiple" ? "Memproses…" : "Demo 3 Pasien"}
                </div>
                <div className="text-[10px] text-mute mt-0.5">
                  1 Perawat : 3 Pasien
                </div>
              </button>
            </div>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line"></div>
            </div>
            <span className="relative bg-surface px-3 text-[11px] font-bold uppercase tracking-wider text-mute">
              atau login manual
            </span>
          </div>

          {error && (
            <div className="mb-3.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 leading-relaxed">
              {error}
            </div>
          )}

          <div className="mb-3.5">
            <label className="mb-1.5 block text-[12.5px] font-bold text-ink">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="suster.satu / demo.satu.XXXX"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-navy focus:outline-none"
            />
          </div>
          <div className="mb-3.5">
            <label className="mb-1.5 block text-[12.5px] font-bold text-ink">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-navy focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full cursor-pointer rounded-full bg-navy py-3 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Masuk…" : "Masuk"}
          </button>

          <div className="mt-4 border-t border-dashed border-line pt-3.5 text-[11.5px] leading-relaxed text-mute">
            Akun bawaan sistem (password: <b>narae123</b>):<br />
            <code className="rounded bg-surface-sunken px-1 font-mono text-ink">suster.satu</code> — 1 perawat : 1 pasien<br />
            <code className="rounded bg-surface-sunken px-1 font-mono text-ink">suster.banyak</code> — 1 perawat : 3 pasien
          </div>
        </form>
      </div>
    </div>
  );
}
