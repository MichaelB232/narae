import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("narae123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <form
        className="w-full max-w-[360px] rounded-3xl border border-line bg-surface p-7 shadow-sm"
        onSubmit={submit}
      >
        <div className="text-lg font-bold tracking-[0.02em] text-ink after:text-navy after:content-['.']">
          narae
        </div>
        <h1 className="mt-1.5 mb-1 text-2xl font-bold text-ink">Masuk</h1>
        <p className="mb-5 text-[13px] text-mute">
          Masuk sebagai perawat untuk mendampingi keluarga Anda.
        </p>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[12.5px] font-bold text-ink">
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="suster.satu"
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
        {error && <p className="mb-3 text-[13px] text-alert">{error}</p>}
        <button
          type="submit"
          className="w-full cursor-pointer rounded-full bg-navy py-3 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Masuk…" : "Masuk"}
        </button>

        <div className="mt-4 border-t border-dashed border-line pt-3.5 text-[11.5px] leading-relaxed text-mute">
          Akun demo (password sama: <b>narae123</b>):<br />
          <code className="rounded bg-surface-sunken px-1 font-mono text-ink">suster.satu</code> — 1 perawat : 1 pasien<br />
          <code className="rounded bg-surface-sunken px-1 font-mono text-ink">suster.banyak</code> — 1 perawat : 3 pasien
        </div>
      </form>
    </div>
  );
}
