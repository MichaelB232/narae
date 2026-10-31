import type { ReactNode } from "react";

// Dipakai untuk SEMUA popup mobile: panggilan bantuan, konfirmasi task, create/edit/hapus
// aktivitas & barang. Sesuai arahan: "pop-up yang muncul dari bawah", bukan dialog tengah.
export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  );
}
