import { Outlet } from "react-router-dom";
import { SimPane } from "./SimPane";
import { JuryReminder } from "./JuryReminder";

export function SplitLayout() {
  return (
    <div className="split">
      <section className="sim-col" aria-label="Simulator gelang 3D">
        <SimPane />
        <JuryReminder />
      </section>
      <section className="phone-col" aria-label="Dashboard perawat">
        <Outlet />
      </section>
    </div>
  );
}
