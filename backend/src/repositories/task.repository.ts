import { pool } from "../db/pool.js";
import type { PatientTask, TaskStatus } from "../types/domain.js";

export interface SetStatusParams {
  taskId: number;
  newStatus: TaskStatus;
  changedBy?: number | null;
  changedByPatient?: boolean;
  note?: string | null;
}

export interface CreateTaskParams {
  patientId: number;
  createdBy: number;
  taskName: string;
  spokenInstruction: string;
  voiceProfileId?: number | null;
  type: "RECURRING" | "ONE_TIME";
  daysOfWeek?: number[] | null;
  scheduledTime: string;
  durationMinutes?: number;
  scheduledDate?: string | null;
}

export interface UpdateTaskParams {
  taskId: number;
  taskName?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  isActive?: boolean;
  daysOfWeek?: number[] | null;
  type?: "RECURRING" | "ONE_TIME";
  scheduledDate?: string | null;
}

export const taskRepository = {
  // Semua task milik pasien (bukan cuma hari ini) — dipakai section "Edit Jadwal Keluarga"
  // tempat perawat kelola definisi jadwal, beda dari "Aktivitas Hari Ini" yang cuma instance hari ini.
  async findAllByPatient(patientId: number): Promise<PatientTask[]> {
    const { rows } = await pool.query<PatientTask>(
      `SELECT * FROM patient_tasks WHERE patient_id = $1 AND is_active = true ORDER BY scheduled_time`,
      [patientId]
    );
    return rows;
  },

  async findById(id: number): Promise<PatientTask | null> {
    const { rows } = await pool.query<PatientTask>(`SELECT * FROM patient_tasks WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async create(params: CreateTaskParams): Promise<PatientTask> {
    const { rows } = await pool.query<PatientTask>(
      `INSERT INTO patient_tasks
         (patient_id, created_by, task_name, spoken_instruction, voice_profile_id,
          type, days_of_week, scheduled_time, duration_minutes, scheduled_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        params.patientId,
        params.createdBy,
        params.taskName,
        params.spokenInstruction,
        params.voiceProfileId ?? null,
        params.type,
        params.daysOfWeek ?? null,
        params.scheduledTime,
        params.durationMinutes ?? 15,
        params.scheduledDate ?? null,
      ]
    );
    return rows[0];
  },

  // Edit "as a whole" (nama/jam/durasi) — TERPISAH dari setStatus (lihat diskusi: dua jenis
  // edit yang berbeda, satu mengubah data task, satu mengubah status siklus hariannya).
  async update(params: UpdateTaskParams): Promise<PatientTask | null> {
    const { rows } = await pool.query<PatientTask>(
      `UPDATE patient_tasks SET
         task_name = COALESCE($1, task_name),
         scheduled_time = COALESCE($2, scheduled_time),
         duration_minutes = COALESCE($3, duration_minutes),
         is_active = COALESCE($4, is_active),
         days_of_week = CASE 
           WHEN $5::task_type = 'ONE_TIME' THEN NULL
           WHEN $6::smallint[] IS NOT NULL THEN $6::smallint[] 
           ELSE days_of_week 
         END,
         type = COALESCE($5, type),
         scheduled_date = CASE 
           WHEN $5::task_type = 'RECURRING' THEN NULL
           WHEN $7::text IS NOT NULL THEN $7::date 
           ELSE scheduled_date 
         END
       WHERE id = $8
       RETURNING *`,
      [
        params.taskName ?? null,
        params.scheduledTime ?? null,
        params.durationMinutes ?? null,
        params.isActive !== undefined ? params.isActive : null,
        params.type ?? null,
        params.daysOfWeek ?? null,
        params.scheduledDate ?? null,
        params.taskId,
      ]
    );
    return rows[0] ?? null;
  },

  async remove(taskId: number): Promise<void> {
    await pool.query(`DELETE FROM task_status_history WHERE task_id = $1`, [taskId]);
    await pool.query(`DELETE FROM patient_tasks WHERE id = $1`, [taskId]);
  },

  // Transaksi: baca status lama, update, dan tulis audit trail — semua atau tidak sama sekali.
  async setStatus(params: SetStatusParams): Promise<{ oldStatus: TaskStatus; newStatus: TaskStatus }> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const cur = await client.query<{ status: TaskStatus }>(
        `SELECT status FROM patient_tasks WHERE id = $1 FOR UPDATE`,
        [params.taskId]
      );
      if (cur.rows.length === 0) {
        const err: any = new Error("Task tidak ditemukan");
        err.status = 404;
        throw err;
      }
      const oldStatus = cur.rows[0].status;

      await client.query(`UPDATE patient_tasks SET status = $1 WHERE id = $2`, [params.newStatus, params.taskId]);
      await client.query(
        `INSERT INTO task_status_history (task_id, old_status, new_status, changed_by, changed_by_patient, note)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          params.taskId,
          oldStatus,
          params.newStatus,
          params.changedBy ?? null,
          params.changedByPatient ?? false,
          params.note ?? null,
        ]
      );
      await client.query("COMMIT");
      return { oldStatus, newStatus: params.newStatus };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async findHistory(taskId: number) {
    const { rows } = await pool.query(
      `SELECT * FROM task_status_history WHERE task_id = $1 ORDER BY created_at DESC`,
      [taskId]
    );
    return rows;
  },
};
