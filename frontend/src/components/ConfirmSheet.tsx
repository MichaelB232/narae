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

export function ConfirmSheet({
  open,
  title,
  subtitle,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;
  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="m-0 mb-0.5 text-lg font-bold text-ink">{title}</h2>
      <p className="m-0 mb-4 text-[12.5px] text-mute">{subtitle}</p>
      <button
        type="button"
        className="w-full cursor-pointer rounded-full bg-alert py-3.25 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99]"
        onClick={onConfirm}
      >
        {confirmLabel}
      </button>
      <div className="mt-2">
        <button
          type="button"
          className="w-full cursor-pointer rounded-full bg-surface-sunken py-3 px-4 text-center text-sm font-bold text-ink transition hover:opacity-90 active:scale-[0.99]"
          onClick={onClose}
        >
          {cancelLabel}
        </button>
      </div>
    </BottomSheet>
  );
}
