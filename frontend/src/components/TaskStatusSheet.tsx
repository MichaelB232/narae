import { useState, useEffect } from "react";
import { BottomSheet } from "./BottomSheet";
import { api } from "../api/client";
import { hhmm } from "../utils";
import type { TaskItem } from "../types";

type SimpleStatus = "SELESAI" | "BELUM_SELESAI";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  task: TaskItem | null;
  nurseId: number;
  onShowToast: (title: string, subtitle: string) => void;
}

export function TaskStatusSheet({
  open,
  onClose,
  onSaved,
  task,
  nurseId,
  onShowToast,
}: Props) {
  const [status, setStatus] = useState<SimpleStatus>("BELUM_SELESAI");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setStatus(task.status === "CONFIRMED_BY_NURSE" ? "SELESAI" : "BELUM_SELESAI");
      setReason("");
    }
  }, [task, open]);

  if (!open || !task) return null;

  async function handleSaveStatus() {
    setSaving(true);
    try {
      const isApprove = status === "SELESAI";
      await api.confirmTask(
        task!.id,
        nurseId,
        isApprove,
        reason.trim() || undefined
      );
      onSaved();
      onClose();
      onShowToast(
        "Status Berhasil Diperbarui",
        `${task!.task_name} ditandai ${status === "SELESAI" ? "Selesai" : "Belum Selesai"}`
      );
    } catch (err: any) {
      alert("Gagal memperbarui status: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="m-0 mb-0.5 text-lg font-bold text-ink">Update Status Aktivitas</h2>
      <p className="m-0 mb-4 text-[12.5px] text-mute">Ubah status aktivitas tanpa mengubah jadwal suara</p>

      {/* Task Summary Header */}
      <div className="mb-4 rounded-xl bg-surface-sunken p-3.5">
        <div className="text-[15px] font-bold text-ink">{task.task_name}</div>
        <div className="mt-0.5 text-[12.5px] text-mute">
          Jadwal: {hhmm(task.scheduled_time)} WIB ({task.duration_minutes} Menit)
        </div>
      </div>

      {/* Dropdown Status Selesai / Belum Selesai */}
      <div className="mb-3.5">
        <label className="mb-1.5 block text-[12.5px] font-bold text-ink">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SimpleStatus)}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-navy focus:outline-none"
        >
          <option value="BELUM_SELESAI">Belum Selesai</option>
          <option value="SELESAI">Selesai</option>
        </select>
      </div>

      {/* Alasan Pengubahan (Opsional) */}
      <div className="mb-3.5">
        <label className="mb-1.5 block text-[12.5px] font-bold text-ink">Alasan Pengubahan (Opsional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Contoh: Sudah dilakukan tepat waktu, tapi perawat baru sempat update status"
          rows={3}
          className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px] text-ink focus:border-navy focus:outline-none"
        />
      </div>

      {/* Actions */}
      <div className="mt-5">
        <button
          type="button"
          className="w-full cursor-pointer rounded-full bg-navy py-3.25 px-4 text-center text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
          disabled={saving}
          onClick={handleSaveStatus}
        >
          {saving ? "Menyimpan…" : "Simpan Status"}
        </button>
      </div>
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
