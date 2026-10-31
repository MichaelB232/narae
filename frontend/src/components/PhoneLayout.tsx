
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function PhoneLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto h-full w-full max-w-(--phone-max)">

      {/* Side buttons */}
      <div className="absolute -left-[4px] top-28 h-12 w-[4px] rounded-l-full bg-zinc-500" />
      <div className="absolute -left-[4px] top-44 h-16 w-[4px] rounded-l-full bg-zinc-500" />
      <div className="absolute -right-[4px] top-36 h-20 w-[4px] rounded-r-full bg-zinc-500" />

      {/* iPhone Frame */}
      <div className="relative h-full overflow-hidden rounded-[3.5rem] border-[8px] border-zinc-900 bg-black p-[3px] shadow-[0_0_40px_rgba(0,0,0,.45)]">

        {/* Screen */}
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2.9rem] bg-paper">

          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-3 z-50 flex h-[30px] w-[105px] -translate-x-1/2 items-center justify-center rounded-full bg-black">
            <div className="mr-[-65px] h-2 w-2 rounded-full bg-zinc-800" />
          </div>

          {/* App Content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>

          <BottomNav />

        </div>
      </div>
    </div>
  );
}
