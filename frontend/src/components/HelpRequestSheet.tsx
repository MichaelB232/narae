import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Avatar } from "./Avatar";
import type { HelpRequestItem } from "../types";

// Pesan panggilan SENGAJA statis — cuma nama pasien yang dinamis, sisanya template tetap
// (sesuai arahan UI/UX: "<nama pasien>, memanggil / membutuhkan bantuan anda").
function callMessage(patientName: string) {
  return `${patientName}, memanggil / membutuhkan bantuan anda`;
}

export function HelpRequestSheet({
  item,
  patientAge,
  onAcknowledge,
  onLater,
}: {
  item: HelpRequestItem | null;
  patientAge?: number | null;
  onAcknowledge: () => void;
  onLater: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const onLaterRef = useRef(onLater);
  onLaterRef.current = onLater;

  useEffect(() => {
    if (!item) return;
    const remaining = () => Math.max(0, Math.ceil((item.deadline - Date.now()) / 1000));
    setTimeLeft(remaining());
    if (item.status !== "PENDING" || remaining() === 0) return;

    const interval = setInterval(() => {
      const left = remaining();
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(interval);
        onLaterRef.current();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [item?.id]);

  if (!item) return null;

  return (
    <BottomSheet open onClose={onLater}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="m-0 mb-0.5 text-lg font-bold text-alert">Panggilan Menunggu Respons</h2>
          <p className="m-0 mb-3 text-[12.5px] text-mute">Respons dan tindak lanjuti panggilan pasien.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
          <span>{timeLeft > 0 ? `${timeLeft} detik` : "Tidak direspons"}</span>
        </div>
      </div>

      <div className="relative rounded-2xl border border-line bg-surface p-4">
        <span className="absolute top-3.5 right-3.5 rounded-full bg-alert px-2 py-0.5 text-[10px] font-bold text-white">
          URGENT
        </span>
        <div className="mb-2.5 pr-[70px] text-[12.5px] font-bold text-alert">
          {callMessage(item.patient_name)}
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={item.patient_name} />
          <div>
            <div className="text-[15px] font-bold text-ink">{item.patient_name}</div>
            <div className="text-xs text-mute">
              {patientAge ? `${patientAge} Tahun` : ""}{item.room_number ? ` • ${item.room_number}` : ""}
            </div>
          </div>
        </div>

        {item.patient_speech_transcript ? (
          <div className="my-3.5 rounded-lg bg-surface-sunken p-3 text-[13px] text-ink">
            <div className="mb-1 text-[10.5px] font-bold tracking-[0.04em] text-mute">PESAN PASIEN</div>
            "{item.patient_speech_transcript}"
          </div>
        ) : (
          <div className="my-3.5 rounded-lg bg-surface-sunken p-3 text-[13px] text-ink">
            <div className="mb-1 text-[10.5px] font-bold tracking-[0.04em] text-mute">PANGGILAN</div>
            Dipicu lewat tombol bantuan di gelang (tanpa pesan suara).
          </div>
        )}
      </div>

      <div className="mt-3.5">
        <button
          type="button"
          className="w-full cursor-pointer rounded-full bg-alert py-3.25 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99]"
          onClick={onAcknowledge}
        >
          Tangani
        </button>
      </div>
      <div className="mt-2">
        <button
          type="button"
          className="w-full cursor-pointer rounded-full bg-surface-sunken py-3 px-4 text-center text-sm font-bold text-ink transition hover:opacity-90 active:scale-[0.99]"
          onClick={onLater}
        >
          Nanti Dulu
        </button>
      </div>
    </BottomSheet>
  );
}
