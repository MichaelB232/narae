import type { PatientListItem } from "../types";

export function PatientSwitcher({
  patients,
  selectedId,
  onChange,
}: {
  patients: PatientListItem[];
  selectedId: number;
  onChange: (id: number) => void;
}) {
  const idx = patients.findIndex((p) => p.id === selectedId);

  function step(delta: number) {
    const next = (idx + delta + patients.length) % patients.length;
    onChange(patients[next].id);
  }

  if (patients.length <= 1) return null;

  return (
    <div className="mb-2.5 flex items-center justify-center gap-2.5">
      <button
        type="button"
        className="flex size-[26px] shrink-0 items-center justify-center rounded-full border border-line bg-surface text-[13px] text-navy transition active:scale-95 cursor-pointer"
        onClick={() => step(-1)}
        aria-label="Pasien sebelumnya"
      >
        ‹
      </button>
      <select
        value={selectedId}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cursor-pointer border-none bg-transparent text-center text-[13.5px] font-bold text-ink focus:outline-none"
      >
        {patients.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <button
        type="button"
        className="flex size-[26px] shrink-0 items-center justify-center rounded-full border border-line bg-surface text-[13px] text-navy transition active:scale-95 cursor-pointer"
        onClick={() => step(1)}
        aria-label="Pasien berikutnya"
      >
        ›
      </button>
    </div>
  );
}
