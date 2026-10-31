import { useState } from "react";

const KEY = "narae_reminder_dismissed";

function problems(): string[] {
  const w = window as any;
  const out: string[] = [];
  if (window.innerWidth < 1150) out.push("Lebar layar kurang dari 1150 px; tampilan bisa terpotong. Gunakan laptop/desktop.");
  if (!w.SpeechRecognition && !w.webkitSpeechRecognition) out.push("Browser ini tidak mendukung input suara. Gunakan Chrome atau Edge.");
  if (!window.isSecureContext) out.push("Halaman tidak dibuka lewat HTTPS, jadi mikrofon akan diblokir browser.");
  return out;
}

export function JuryReminder() {
  const [open, setOpen] = useState(() => sessionStorage.getItem(KEY) !== "1");
  if (!open) return null;
  const bad = problems();
  function close() {
    sessionStorage.setItem(KEY, "1");
    setOpen(false);
  }
  return (
    <div className="jury-reminder" role="note">
      <b>Sebelum mencoba</b>
      <ul>
        <li>Pakai Chrome atau Edge di laptop/desktop (layar minimal 1150 px).</li>
        <li>Klik "Izinkan" saat browser meminta mikrofon, dan nyalakan suara perangkat.</li>
        <li>Tekan tombol merah (Bantuan) pada model 3D, lalu bicara. Panggilan akan muncul di dashboard sebelah kanan.</li>
        <li>Tekan tombol biru (Jadwal) untuk mendengar jadwal hari ini.</li>
      </ul>
      {bad.map((m) => <p key={m} className="jury-warn">{m}</p>)}
      <button className="btn navy" onClick={close}>Mengerti</button>
    </div>
  );
}