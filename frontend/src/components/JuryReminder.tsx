import { useState } from "react";
import { COMFORT_QUERY, useMediaQuery } from "../hooks/useMediaQuery";

const KEY = "narae_reminder_dismissed";

export function JuryReminder() {
  const [open, setOpen] = useState(() => sessionStorage.getItem(KEY) !== "1");
  const comfortable = useMediaQuery(COMFORT_QUERY);
  if (!open) return null;

  const w = window as any;
  const bad: string[] = [];
  if (!comfortable) bad.push("Lebar layar kurang dari 1024 px; tampilan 3D menyempit. Gunakan laptop/desktop.");
  if (!w.SpeechRecognition && !w.webkitSpeechRecognition) bad.push("Browser ini tidak mendukung input suara. Gunakan Chrome atau Edge.");
  if (!window.isSecureContext) bad.push("Halaman tidak dibuka lewat HTTPS, jadi mikrofon akan diblokir browser.");

  function close() {
    sessionStorage.setItem(KEY, "1");
    setOpen(false);
  }

  return (
    <div
      role="note"
      className="absolute inset-x-4 bottom-4 z-20 mx-auto max-w-[520px] rounded-2xl border border-line bg-surface px-4 py-3.5 text-[13px] leading-snug text-ink shadow-[0_8px_28px_rgba(0,0,0,.25)]"
    >
      <b>Sebelum mencoba</b>
      <ul className="mt-1.5 mb-2.5 list-disc space-y-0.5 pl-[18px]">
        <li>Pakai Chrome atau Edge di laptop/desktop (layar minimal 1024 px).</li>
        <li>Klik "Izinkan" saat browser meminta mikrofon, dan nyalakan suara perangkat.</li>
        <li>Tekan tombol merah (Bantuan) pada model 3D, lalu bicara. Panggilan akan muncul di dashboard sebelah kanan.</li>
        <li>Tekan tombol biru (Jadwal) untuk mendengar jadwal hari ini.</li>
      </ul>
      {bad.map((m) => (
        <p key={m} className="mb-2 font-semibold text-alert">{m}</p>
      ))}
      <button
        type="button"
        onClick={close}
        className="w-full rounded-full bg-navy px-4 py-3 text-sm font-bold text-white"
      >
        Mengerti
      </button>
    </div>
  );
}
