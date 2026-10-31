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
    <div className="patient-switcher">
      <button className="arrow" onClick={() => step(-1)} aria-label="Pasien sebelumnya">‹</button>
      <select value={selectedId} onChange={(e) => onChange(Number(e.target.value))}>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <button className="arrow" onClick={() => step(1)} aria-label="Pasien berikutnya">›</button>
    </div>
  );
}
