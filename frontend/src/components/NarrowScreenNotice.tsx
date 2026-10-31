import { useState } from "react";

export function NarrowScreenNotice() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      role="status"
      className="flex shrink-0 items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-snug text-amber-900"
    >
      <p className="flex-1">
        <b className="font-bold">Layar terlalu sempit untuk simulator 3D.</b> Buka di laptop atau
        desktop dengan lebar minimal 1024 px agar gelang 3D dan dashboard tampil berdampingan.
      </p>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="shrink-0 rounded-full bg-amber-200 px-3 py-1 font-bold text-amber-900"
      >
        Tutup
      </button>
    </div>
  );
}
