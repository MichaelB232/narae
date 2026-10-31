import { pool } from "../db/pool.js";
import type { Device } from "../types/domain.js";

export const deviceRepository = {
  async findByUid(uid: string): Promise<Device | null> {
    const { rows } = await pool.query<Device>(`SELECT * FROM devices WHERE device_uid = $1`, [uid]);
    return rows[0] ?? null;
  },

  async findAll(): Promise<Device[]> {
    const { rows } = await pool.query<Device>(`SELECT * FROM devices ORDER BY id`);
    return rows;
  },

  async heartbeat(uid: string, batteryPercentage?: number | null): Promise<Device | null> {
    const { rows } = await pool.query<Device>(
      `UPDATE devices SET is_online = true, last_synced_at = now(),
              battery_percentage = COALESCE($1, battery_percentage)
       WHERE device_uid = $2 RETURNING *`,
      [batteryPercentage ?? null, uid]
    );
    return rows[0] ?? null;
  },
};
