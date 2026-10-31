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
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="narae-wordmark" style={{ padding: 0, fontSize: 18 }}>narae</div>
        <h1>Masuk</h1>
        <p className="mut">Masuk sebagai perawat untuk mendampingi keluarga Anda.</p>

        <div className="field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="suster.satu" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="mut" style={{ color: "var(--rose)" }}>{error}</p>}
        <button className="btn navy" disabled={loading}>{loading ? "Masuk…" : "Masuk"}</button>

        <div className="hint-accounts">
          Akun demo (password sama: <b>narae123</b>):<br />
          <code>suster.satu</code> — 1 perawat : 1 pasien<br />
          <code>suster.banyak</code> — 1 perawat : 3 pasien
        </div>
      </form>
    </div>
  );
}
