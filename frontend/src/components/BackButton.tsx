export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[0.5px] bg-none p-0 text-black transition active:scale-95"
      aria-label="Kembali"
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </button>
  );
}