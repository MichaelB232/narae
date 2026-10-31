import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function PhoneLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-(--phone-max) flex-col bg-paper shadow-[0_0_40px_rgba(0,0,0,.45)] split:shadow-none">
      <div className="flex justify-between px-5 pt-2.5 text-[13px] font-semibold text-ink">
        <span>9:41</span>
        <span>📶 🔋</span>
      </div>
      <div className="px-5 pt-3.5 text-sm font-bold tracking-[.02em] text-ink after:text-navy after:content-['.']">
        narae
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pt-2.5 pb-[90px]">{children}</div>
      <BottomNav />
    </div>
  );
}
