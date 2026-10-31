import { BottomSheet } from "./BottomSheet";

interface Props {
  open: boolean;
  title: string;
  subtitle: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmSheet({ open, title, subtitle, confirmLabel = "Hapus", cancelLabel = "Batal", onConfirm, onClose }: Props) {
  if (!open) return null;
  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2>{title}</h2>
      <p className="sheet-sub">{subtitle}</p>
      <button className="btn rose" onClick={onConfirm}>{confirmLabel}</button>
      <div style={{ marginTop: 8 }}>
        <button className="btn ghost" onClick={onClose}>{cancelLabel}</button>
      </div>
    </BottomSheet>
  );
}
