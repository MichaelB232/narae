import { BASE } from "../api/client";
import { useAuth } from "../auth";

export function SimPane() {
  const { user } = useAuth();
  const nurseParam = user ? `&nurseId=${user.id}` : "";

  return (
    <iframe
      key={user?.id ?? "guest"}
      className="absolute inset-0 block size-full border-0"
      title="Simulator gelang NARAE"
      src={`/sim/index.html?embed=1&v=3&api=${encodeURIComponent(BASE)}${nurseParam}`}
      allow="microphone; autoplay"
    />
  );
}
