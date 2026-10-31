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
      <h2>Update Status Aktivitas</h2>
      <p className="sheet-sub">Ubah status aktivitas tanpa mengubah jadwal suara</p>

      {/* Task Summary Header */}
      <div
        style={{
          background: "var(--surface-sunken)",
          padding: "12px 14px",
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
          {task.task_name}
        </div>
        <div className="mut" style={{ fontSize: 12.5, marginTop: 2 }}>
          Jadwal: {hhmm(task.scheduled_time)} WIB ({task.duration_minutes} Menit)
        </div>
      </div>

      {/* Dropdown Status Selesai / Belum Selesai */}
      <div className="field">
        <label>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SimpleStatus)}
        >
          <option value="BELUM_SELESAI">Belum Selesai</option>
          <option value="SELESAI">Selesai</option>
        </select>
      </div>

      {/* Alasan Pengubahan (Opsional) */}
      <div className="field">
        <label>Alasan Pengubahan (Opsional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Contoh: Sudah dilakukan tepat waktu, tapi perawat baru sempat update status"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div style={{ marginTop: 20 }}>
        <button
          className="btn navy"
          disabled={saving}
          onClick={handleSaveStatus}
          style={{ width: "100%", padding: 13, fontSize: 14, fontWeight: 700 }}
        >
          {saving ? "Menyimpan…" : "Simpan Status"}
        </button>
      </div>
      <div style={{ marginTop: 8 }}>
        <button
          className="btn ghost"
          onClick={onClose}
          style={{ width: "100%", padding: 12, fontSize: 14 }}
        >
          Batal
        </button>
      </div>
    </BottomSheet>
  );
}
