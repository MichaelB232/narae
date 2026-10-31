import { Outlet } from "react-router-dom";
import { SimPane } from "./SimPane";
import { JuryReminder } from "./JuryReminder";

export function SplitLayout() {
  return (
    <div className="flex">
      <section className="phone-col flex-1" aria-label="Dashboard perawat">
        <Outlet />
      </section>
      <section className="sim-col" aria-label="Simulator gelang 3D">
        <SimPane />
        <JuryReminder />
      </section>
    </div>
  );
}
