import { Outlet } from "react-router-dom";
import { SimPane } from "./SimPane";
import { JuryReminder } from "./JuryReminder";
import { NarrowScreenNotice } from "./NarrowScreenNotice";
import { SPLIT_QUERY, useMediaQuery } from "../hooks/useMediaQuery";

export function SplitLayout() {
  const split = useMediaQuery(SPLIT_QUERY);

  return (
    <div className="flex h-dvh overflow-hidden bg-stage">
      {split && (
        <section
          aria-label="Simulator gelang 3D"
          className="relative min-w-0 flex-1 border-r border-line"
        >
          <SimPane />
          <JuryReminder />
        </section>
      )}
      <section
        aria-label="Dashboard perawat"
        className="relative flex h-full w-full transform-gpu flex-col overflow-hidden split:w-[380px] split:shrink-0 lg:w-(--phone-max)"
      >
        {!split && <NarrowScreenNotice />}
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
