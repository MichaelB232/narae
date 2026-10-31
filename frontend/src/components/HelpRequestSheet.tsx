import { BottomSheet } from "./BottomSheet";
import { Avatar } from "./Avatar";
import { calcAge } from "../utils";
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
  if (!item) return null;
  return (
    <BottomSheet open onClose={onLater}>
      <h2 style={{ color: "var(--rose)" }}>Panggilan Menunggu Respons</h2>
      <p className="sheet-sub">Respons dan tindak lanjuti panggilan pasien.</p>

      <div className="card" style={{ position: "relative" }}>
        <span className="pill urgent" style={{ position: "absolute", top: 14, right: 14 }}>URGENT</span>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--rose)", marginBottom: 10, paddingRight: 70 }}>
          {callMessage(item.patient_name)}
        </div>
        <div className="patient-mini">
          <Avatar name={item.patient_name} />
          <div>
            <div className="name">{item.patient_name}</div>
            <div className="age">
              {patientAge ? `${patientAge} Tahun` : ""}{item.room_number ? ` • ${item.room_number}` : ""}
            </div>
          </div>
        </div>

        {item.patient_speech_transcript ? (
          <div className="quote-box">
            <div className="label">PESAN PASIEN</div>
            "{item.patient_speech_transcript}"
          </div>
        ) : (
          <div className="quote-box">
            <div className="label">PANGGILAN</div>
            Dipicu lewat tombol bantuan di gelang (tanpa pesan suara).
          </div>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <button className="btn rose" onClick={onAcknowledge}>Tangani</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <button className="btn ghost" onClick={onLater}>Nanti Dulu</button>
      </div>
    </BottomSheet>
  );
}
