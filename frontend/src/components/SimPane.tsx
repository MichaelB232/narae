import { BASE } from "../api/client";

export function SimPane() {
  return (
    <iframe
      className="absolute inset-0 block size-full border-0"
      title="Simulator gelang NARAE"
      src={`/sim/index.html?embed=1&v=2&api=${encodeURIComponent(BASE)}`}
      allow="microphone; autoplay"
    />
  );
}
