import { pool } from "../db/pool.js";
import type {
  HelpRequest,
  HelpRequestWithPatient,
  RequestStatus,
} from "../types/domain.js";

const RESPONSE_WINDOW_SECONDS = 10;

const SECONDS_LEFT = (alias: string) =>
  `GREATEST(0, EXTRACT(EPOCH FROM (${alias}.expires_at - now())))::float8 AS seconds_left`;

export const helpRequestRepository = {
  async findByNurse(
    nurseId: number,
    status?: RequestStatus,
  ): Promise<HelpRequestWithPatient[]> {
    const params: any[] = [nurseId];
    let statusClause = "";
    if (status) {
      params.push(status);
      statusClause = `AND hr.status = $2`;
    }
    const { rows } = await pool.query<HelpRequestWithPatient>(
      `SELECT hr.*, ${SECONDS_LEFT("hr")}, p.name AS patient_name, p.room_number, ail.patient_speech_transcript
       FROM help_requests hr
       JOIN patients p ON p.id = hr.patient_id
       LEFT JOIN ai_interaction_logs ail ON ail.id = hr.triggered_by_interaction_id
       WHERE p.assigned_nurse_id = $1 ${statusClause}
       ORDER BY hr.created_at DESC`,
      params,
    );
    return rows;
  },

  async findById(id: number): Promise<HelpRequestWithPatient | null> {
    const { rows } = await pool.query<HelpRequestWithPatient>(
      `SELECT hr.*, ${SECONDS_LEFT("hr")}, p.name AS patient_name, p.room_number, ail.patient_speech_transcript
       FROM help_requests hr
       JOIN patients p ON p.id = hr.patient_id
       LEFT JOIN ai_interaction_logs ail ON ail.id = hr.triggered_by_interaction_id
       WHERE hr.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  async create(params: {
    patientId: number;
    deviceId: number;
    triggeredByInteractionId?: number | null;
  }): Promise<HelpRequest> {
    const { rows } = await pool.query<HelpRequest>(
      `INSERT INTO help_requests (patient_id, device_id, triggered_by_interaction_id, status, expires_at)
       VALUES ($1,$2,$3,'PENDING', now() + ($4 || ' seconds')::interval)
       RETURNING *, ${SECONDS_LEFT("help_requests")}`,
      [
        params.patientId,
        params.deviceId,
        params.triggeredByInteractionId ?? null,
        RESPONSE_WINDOW_SECONDS,
      ],
    );
    return rows[0];
  },

  async updateStatus(
    id: number,
    status: "ACKNOWLEDGED" | "RESOLVED" | "EXPIRED",
  ): Promise<HelpRequest | null> {
    const isResolved = status === "RESOLVED";
    const allowedFrom =
      status === "EXPIRED"
        ? ["PENDING"]
        : status === "ACKNOWLEDGED"
          ? ["PENDING", "EXPIRED"]
          : ["PENDING", "ACKNOWLEDGED", "EXPIRED"];
    const { rows } = await pool.query<HelpRequest>(
      `UPDATE help_requests
       SET status = $1::request_status,
           resolved_at = CASE WHEN $2::boolean THEN now() ELSE resolved_at END
       WHERE id = $3 AND status::text = ANY($4::text[])
       RETURNING *, ${SECONDS_LEFT("help_requests")}`,
      [status, isResolved, id, allowedFrom],
    );
    if (!rows[0]) {
      const check = await pool.query<HelpRequest>(
        `SELECT *, ${SECONDS_LEFT("help_requests")} FROM help_requests WHERE id = $1`,
        [id],
      );
      return check.rows[0] ?? null;
    }
    return rows[0];
  },

  async expireOverdue(): Promise<number> {
    const res = await pool.query(
      `UPDATE help_requests SET status = 'EXPIRED' WHERE status = 'PENDING' AND expires_at < now()`,
    );
    return res.rowCount ?? 0;
  },
};
