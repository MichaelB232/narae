import { BASE } from "../api/client";

export function SimPane() {
  return (
    <iframe
      className="sim-frame"
      title="Simulator gelang NARAE"
      src={`/sim/index.html?embed=1&v=2&api=${encodeURIComponent(BASE)}`}
      allow="microphone; autoplay"
      width={920}
      height={720}
    />
  );
}