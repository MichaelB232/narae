import { NavLink } from "react-router-dom";

const item = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-1 text-[11px] no-underline ${
    isActive ? "font-bold text-navy" : "text-[#9aa1ab]"
  }`;
const icon = "size-5";

// Navbar bawah: Beranda, Keluarga, Riwayat, Pengaturan (Laporan sengaja tidak dipakai).
export function BottomNav() {
  return (
    <nav className="sticky bottom-0 flex border-t border-line bg-surface py-6 shadow-2xl">
      <NavLink to="/" end className={item}>
        <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        Beranda
      </NavLink>
      <NavLink to="/keluarga" className={item}>
        <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></svg>
        Keluarga
      </NavLink>
      <NavLink to="/riwayat" className={item}>
        <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        Riwayat
      </NavLink>
      <NavLink to="/pengaturan" className={item}>
        <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.7 7.7 0 0 0-1.8-1l-.3-2.5H9l-.3 2.5a7.7 7.7 0 0 0-1.8 1l-2.3-.9-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7.7 7.7 0 0 0 1.8 1l.3 2.5h4.8l.3-2.5a7.7 7.7 0 0 0 1.8-1l2.3.9 2-3.4-2-1.5Z"/></svg>
        Pengaturan
      </NavLink>
    </nav>
  );
}