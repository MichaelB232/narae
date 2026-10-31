export function SuccessToast({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3.5 z-60 flex justify-center">
      <div className="flex w-[calc(100%-36px)] max-w-[calc(var(--phone-max)-36px)] animate-toast-in items-center gap-2.5 rounded-2xl border border-sage bg-surface px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
        <div className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-sage text-[13px] text-white">
          ✓
        </div>
        <div>
          <div className="text-[13px] font-bold text-sage">{title}</div>
          <div className="text-[11.5px] text-mute">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
