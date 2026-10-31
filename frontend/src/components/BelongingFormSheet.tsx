import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { api } from "../api/client";
import type { Belonging } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  patientId: number;
  existing?: Belonging;
  onShowToast: (title: string, subtitle: string) => void;
}

export function BelongingFormSheet({ open, onClose, onSaved, patientId, existing, onShowToast }: Props) {
  const isEdit = Boolean(existing);
  const [itemName, setItemName] = useState(existing?.item_name ?? "");
  const [defaultLocation, setDefaultLocation] = useState(existing?.default_location ?? "");
  const [lastLocation, setLastLocation] = useState(existing?.last_location ?? "");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function submit() {
    setSaving(true);
    try {
      if (isEdit && existing) {
        await api.updateBelonging(existing.id, { itemName, defaultLocation, lastLocation });
        onShowToast("Barang Berhasil Diubah", itemName);
      } else {
        await api.createBelonging({ patientId, itemName, defaultLocation, lastLocation: lastLocation || defaultLocation });
        onShowToast("Barang Berhasil Ditambahkan", itemName);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2>{isEdit ? "Edit Barang" : "Tambah Barang"}</h2>
      <p className="sheet-sub">{isEdit ? "Edit barang milik anggota keluarga" : "Tambahkan barang milik anggota keluarga"}</p>

      <div className="field">
        <label>Nama Barang</label>
        <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Ex. Balon D'Or Trophy" />
      </div>
      <div className="field">
        <label>Lokasi Default</label>
        <input value={defaultLocation} onChange={(e) => setDefaultLocation(e.target.value)} placeholder="*Dimana barang biasanya diletakkan" />
      </div>
      <div className="field">
        <label>Lokasi Terakhir</label>
        <input value={lastLocation} onChange={(e) => setLastLocation(e.target.value)} placeholder="Rumah Harry Kane" />
      </div>

      <button className={`btn ${isEdit ? "navy" : "sage"}`} disabled={saving || !itemName} onClick={submit}>
        {saving ? "Menyimpan…" : isEdit ? "Simpan" : "Tambah"}
      </button>
      <div style={{ marginTop: 8 }}>
        <button className="btn ghost" onClick={onClose}>Batal</button>
      </div>
    </BottomSheet>
  );
}
