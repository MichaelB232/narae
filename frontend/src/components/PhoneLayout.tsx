import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function PhoneLayout({ children }: { children: ReactNode }) {
  return (
    <div className="phone-shell">
      <div className="status-fake">
        <span>9:41</span>
        <span>📶 🔋</span>
      </div>
      <div className="narae-wordmark">narae</div>
      <div className="page-scroll">{children}</div>
      <BottomNav />
    </div>
  );
}
