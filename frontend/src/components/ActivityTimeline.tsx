import type { ReactNode } from "react";
import { taskStatusMeta } from "../statusLabels";
import type { TaskStatus } from "../types";

const DOT_SIZE = 10;

export interface TimelineItem {
  id: string | number;
  active: boolean;
  alert?: boolean;
  children: ReactNode;
}

function railClass(current: TimelineItem, next: TimelineItem) {
  if (current.active && next.active) return "bg-navy";
  if (current.active) return "bg-linear-to-b from-navy to-[#d5d9de]";
  return "bg-[#d5d9de]";
}

export function Timeline({ items, dotCenter }: { items: TimelineItem[]; dotCenter: number }) {
  return (
    <ol className="m-0 list-none p-0">
      {items.map((item, i) => {
        const next = items[i + 1];
        const dotColor = item.alert ? "bg-alert" : item.active ? "bg-navy" : "bg-[#c9cdd3]";
        return (
          <li key={item.id} className="relative pl-6">
            <span
              className={`absolute left-0 z-10 rounded-full ${dotColor}`}
              style={{ top: dotCenter - DOT_SIZE / 2, width: DOT_SIZE, height: DOT_SIZE }}
            />
            {next && (
              <span
                aria-hidden
                className={`absolute left-[4px] h-full w-0.5 ${railClass(item, next)}`}
                style={{ top: dotCenter }}
              />
            )}
            {item.children}
          </li>
        );
      })}
    </ol>
  );
}

const pillTone = {
  sage: "bg-[#378568]",
  rose: "bg-alert",
  navy: "bg-navy",
  neutral: "bg-[#6b7280]",
};

export function TaskStatusPill({ status, compact = false }: { status: TaskStatus; compact?: boolean }) {
  const meta = taskStatusMeta[status];
  const tone = status === "REMINDER_PLAYED" ? "bg-[#4f7fa8]" : pillTone[meta.tone];
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full font-bold text-white ${tone} ${
        compact ? "px-2 py-1 text-[10px]" : "px-3 py-1 text-[11px]"
      }`}
    >
      {meta.label}
    </span>
  );
}