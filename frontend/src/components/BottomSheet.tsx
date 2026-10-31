import type { ReactNode } from "react";

// Dipakai untuk SEMUA popup mobile: panggilan bantuan, konfirmasi task, create/edit/hapus
// aktivitas & barang. Sesuai arahan: "pop-up yang muncul dari bawah", bukan dialog tengah.
// Kelas "sheet" hanya penanda untuk gaya konten native (.sheet h2, .sheet p.sheet-sub).
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#14140f]/45"
      onClick={onClose}
    >
      <div
        className="sheet max-h-[88vh] w-full max-w-(--phone-max) animate-sheet-up overflow-y-auto rounded-t-3xl bg-surface px-5 pt-2.5 pb-[26px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-1.5 mb-3.5 h-1 w-10 rounded-sm bg-line" />
        {children}
      </div>
    </div>
  );
}
