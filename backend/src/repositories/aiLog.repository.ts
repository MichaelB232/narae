import { pool } from "../db/pool.js";
import type { AiInteractionLog } from "../types/domain.js";

export const aiLogRepository = {
  async create(params: {
    patientId: number;
    deviceId: number;
    transcript: string;
    responseText: string;
    actionTriggered: string;
    latencyMs: number;
  }): Promise<AiInteractionLog> {
    const { rows } = await pool.query<AiInteractionLog>(
      `INSERT INTO ai_interaction_logs
         (patient_id, device_id, patient_speech_transcript, ai_response_text, action_triggered, latency_ms)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [params.patientId, params.deviceId, params.transcript, params.responseText, params.actionTriggered, params.latencyMs]
    );
    return rows[0];
  },

  async findByPatient(patientId: number, limit = 50): Promise<AiInteractionLog[]> {
    const { rows } = await pool.query<AiInteractionLog>(
      `SELECT * FROM ai_interaction_logs WHERE patient_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [patientId, limit]
    );
    return rows;
  },
};
