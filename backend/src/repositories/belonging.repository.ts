import { pool } from "../db/pool.js";
import type { PatientBelonging } from "../types/domain.js";

export const belongingRepository = {
  async findByPatient(patientId: number): Promise<PatientBelonging[]> {
    const { rows } = await pool.query<PatientBelonging>(
      `SELECT * FROM patient_belongings WHERE patient_id = $1 ORDER BY item_name`,
      [patientId]
    );
    return rows;
  },

  async create(params: { patientId: number; itemName: string; defaultLocation: string; lastLocation: string }): Promise<PatientBelonging> {
    const { rows } = await pool.query<PatientBelonging>(
      `INSERT INTO patient_belongings (patient_id, item_name, default_location, last_location)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [params.patientId, params.itemName, params.defaultLocation, params.lastLocation]
    );
    return rows[0];
  },

  async update(id: number, params: { itemName?: string; defaultLocation?: string; lastLocation?: string }): Promise<PatientBelonging | null> {
    const { rows } = await pool.query<PatientBelonging>(
      `UPDATE patient_belongings SET
         item_name = COALESCE($1, item_name),
         default_location = COALESCE($2, default_location),
         last_location = COALESCE($3, last_location),
         updated_at = now()
       WHERE id = $4 RETURNING *`,
      [params.itemName ?? null, params.defaultLocation ?? null, params.lastLocation ?? null, id]
    );
    return rows[0] ?? null;
  },

  async remove(id: number): Promise<void> {
    await pool.query(`DELETE FROM patient_belongings WHERE id = $1`, [id]);
  },
};
