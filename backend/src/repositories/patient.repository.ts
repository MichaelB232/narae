import { pool } from "../db/pool.js";
import type { Patient, PatientWithDevice, PatientTask, PatientBelonging } from "../types/domain.js";

export const TODAY_TASKS_SQL = `
  SELECT id, patient_id, created_by, task_name, spoken_instruction, voice_profile_id,
         generated_audio_url, type, days_of_week, scheduled_time, duration_minutes, scheduled_date,
         is_active,
         CASE
           -- Jika statusnya MISSED tapi jam hari ini belum melewati jadwal, tampilkan SCHEDULED (Nanti)
           WHEN status = 'MISSED' AND (now() AT TIME ZONE 'Asia/Jakarta')::time < scheduled_time THEN 'SCHEDULED'::task_status
           ELSE status
         END AS status,
         created_at
  FROM patient_tasks
  WHERE patient_id = $1
    AND is_active = true
    AND (
      (type = 'RECURRING' AND (days_of_week IS NULL OR EXTRACT(ISODOW FROM (now() AT TIME ZONE 'Asia/Jakarta'))::int = ANY(days_of_week)))
      OR (type = 'ONE_TIME' AND scheduled_date = (now() AT TIME ZONE 'Asia/Jakarta')::date)
    )
  ORDER BY scheduled_time;
`;


export const patientRepository = {
  async findByNurseId(nurseId: number): Promise<PatientWithDevice[]> {
    const { rows } = await pool.query<PatientWithDevice>(
      `SELECT p.*, d.id AS device_id, d.device_uid, d.battery_percentage, d.is_online
       FROM patients p
       LEFT JOIN devices d ON d.patient_id = p.id
       WHERE p.assigned_nurse_id = $1
       ORDER BY p.id`,
      [nurseId]
    );
    return rows;
  },

  async findAll(): Promise<PatientWithDevice[]> {
    const { rows } = await pool.query<PatientWithDevice>(
      `SELECT p.*, d.id AS device_id, d.device_uid, d.battery_percentage, d.is_online
       FROM patients p
       LEFT JOIN devices d ON d.patient_id = p.id
       ORDER BY p.id`
    );
    return rows;
  },

  async findById(id: number): Promise<PatientWithDevice | null> {
    const { rows } = await pool.query<PatientWithDevice>(
      `SELECT p.*, d.id AS device_id, d.device_uid, d.battery_percentage, d.is_online
       FROM patients p
       LEFT JOIN devices d ON d.patient_id = p.id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async findTodayTasks(patientId: number): Promise<PatientTask[]> {
    // 1. Jika tugas berstatus MISSED tapi jam sekarang BELUM melewati jadwal hari ini, kembalikan ke 'SCHEDULED' (Nanti)
    await pool.query(
      `UPDATE patient_tasks
       SET status = 'SCHEDULED'
       WHERE patient_id = $1
         AND is_active = true
         AND status = 'MISSED'
         AND (
           (type = 'RECURRING' AND (days_of_week IS NULL OR EXTRACT(ISODOW FROM (now() AT TIME ZONE 'Asia/Jakarta'))::int = ANY(days_of_week)))
           OR (type = 'ONE_TIME' AND scheduled_date = (now() AT TIME ZONE 'Asia/Jakarta')::date)
         )
         AND (now() AT TIME ZONE 'Asia/Jakarta')::time < scheduled_time`,
      [patientId]
    );

    // 2. Otomatis tandai tugas yang sudah melewati batas durasi sebagai MISSED (Terlewat)
    await pool.query(
      `UPDATE patient_tasks
       SET status = 'MISSED'
       WHERE patient_id = $1
         AND is_active = true
         AND status NOT IN ('CONFIRMED_BY_NURSE', 'MISSED', 'REJECTED_BY_NURSE')
         AND (
           (type = 'RECURRING' AND (days_of_week IS NULL OR EXTRACT(ISODOW FROM (now() AT TIME ZONE 'Asia/Jakarta'))::int = ANY(days_of_week)))
           OR (type = 'ONE_TIME' AND scheduled_date = (now() AT TIME ZONE 'Asia/Jakarta')::date)
         )
         AND (now() AT TIME ZONE 'Asia/Jakarta')::time > (scheduled_time + (duration_minutes || ' minutes')::interval)`,
      [patientId]
    );
    const { rows } = await pool.query<PatientTask>(TODAY_TASKS_SQL, [patientId]);
    return rows;
  },

  async findActiveTasks(patientId: number): Promise<PatientTask[]> {
    // Sinkronkan status sebelum AI membaca task aktif
    await pool.query(
      `UPDATE patient_tasks
       SET status = 'SCHEDULED'
       WHERE patient_id = $1
         AND is_active = true
         AND status = 'MISSED'
         AND (
           (type = 'RECURRING' AND (days_of_week IS NULL OR EXTRACT(ISODOW FROM (now() AT TIME ZONE 'Asia/Jakarta'))::int = ANY(days_of_week)))
           OR (type = 'ONE_TIME' AND scheduled_date = (now() AT TIME ZONE 'Asia/Jakarta')::date)
         )
         AND (now() AT TIME ZONE 'Asia/Jakarta')::time < scheduled_time`,
      [patientId]
    );

    const { rows } = await pool.query<PatientTask>(
      `SELECT id, patient_id, created_by, task_name, spoken_instruction, voice_profile_id,
              generated_audio_url, type, days_of_week, scheduled_time, duration_minutes, scheduled_date,
              is_active,
              CASE
                WHEN status = 'MISSED' AND (now() AT TIME ZONE 'Asia/Jakarta')::time < scheduled_time THEN 'SCHEDULED'::task_status
                ELSE status
              END AS status,
              created_at
       FROM patient_tasks
       WHERE patient_id = $1
         AND is_active = true
         AND (
           type = 'RECURRING'
           OR (type = 'ONE_TIME' AND scheduled_date >= (now() AT TIME ZONE 'Asia/Jakarta')::date)
         )
       ORDER BY scheduled_date ASC NULLS FIRST, scheduled_time ASC`,
      [patientId]
    );
    return rows;
  },

  async findBelongings(patientId: number): Promise<PatientBelonging[]> {
    const { rows } = await pool.query<PatientBelonging>(
      `SELECT item_name FROM patient_belongings WHERE patient_id = $1 ORDER BY item_name`,
      [patientId]
    );
    return rows;
  },

  async findBelongingsSummary(patientId: number): Promise<PatientBelonging[]> {
    const { rows } = await pool.query<PatientBelonging>(
      `SELECT item_name, last_location, default_location FROM patient_belongings WHERE patient_id = $1 ORDER BY item_name`,
      [patientId]
    );
    return rows;
  },

  async findRaw(id: number): Promise<Patient | null> {
    const { rows } = await pool.query<Patient>(`SELECT * FROM patients WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },
};
