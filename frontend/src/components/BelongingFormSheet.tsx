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
      <h2 className="m-0 mb-0.5 text-lg font-bold text-ink">{isEdit ? "Edit Barang" : "Tambah Barang"}</h2>
      <p className="m-0 mb-4 text-[12.5px] text-mute">{isEdit ? "Edit barang milik anggota keluarga" : "Tambahkan barang milik anggota keluarga"}</p>

      <div className="mb-3.5">
        <label className="mb-1.5 block text-[12.5px] font-bold text-ink">Nama Barang</label>
        <input
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Ex. Kacamata Baca"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-navy focus:outline-none"
        />
      </div>
      <div className="mb-3.5">
        <label className="mb-1.5 block text-[12.5px] font-bold text-ink">Lokasi Default</label>
        <input
          value={defaultLocation}
          onChange={(e) => setDefaultLocation(e.target.value)}
          placeholder="*Dimana barang biasanya diletakkan"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-navy focus:outline-none"
        />
      </div>
      <div className="mb-3.5">
        <label className="mb-1.5 block text-[12.5px] font-bold text-ink">Lokasi Terakhir</label>
        <input
          value={lastLocation}
          onChange={(e) => setLastLocation(e.target.value)}
          placeholder="Ex. Meja samping tempat tidur"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-navy focus:outline-none"
        />
      </div>

      <button
        type="button"
        className={`w-full cursor-pointer rounded-full py-3.25 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 ${
          isEdit ? "bg-navy" : "bg-sage"
        }`}
        disabled={saving || !itemName.trim()}
        onClick={submit}
      >
        {saving ? "Menyimpan…" : isEdit ? "Simpan" : "Tambah"}
      </button>
      <div className="mt-2">
        <button
          type="button"
          className="w-full cursor-pointer rounded-full bg-surface-sunken py-3 px-4 text-center text-sm font-bold text-ink transition hover:opacity-90 active:scale-[0.99]"
          onClick={onClose}
        >
          Batal
        </button>
      </div>
    </BottomSheet>
  );
}
