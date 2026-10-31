import { NavLink } from "react-router-dom";

// Navbar bawah: HANYA Beranda, Keluarga, Pengaturan (Laporan sengaja tidak dipakai).
export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        Beranda
      </NavLink>
      <NavLink to="/keluarga" className={({ isActive }) => (isActive ? "active" : "")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></svg>
        Keluarga
      </NavLink>
      <NavLink to="/pengaturan" className={({ isActive }) => (isActive ? "active" : "")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.7 7.7 0 0 0-1.8-1l-.3-2.5H9l-.3 2.5a7.7 7.7 0 0 0-1.8 1l-2.3-.9-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7.7 7.7 0 0 0 1.8 1l.3 2.5h4.8l.3-2.5a7.7 7.7 0 0 0 1.8-1l2.3.9 2-3.4-2-1.5Z"/></svg>
        Pengaturan
      </NavLink>
    </nav>
  );
}
