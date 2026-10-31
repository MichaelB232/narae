// Agent tidak pernah bicara langsung ke database — backend yang menyuntikkan
// implementasi DataProvider ini (lihat backend/src/services/ai.service.ts).
// Ini yang bikin folder agent/ bisa di-test atau dipakai ulang tanpa bawa Postgres.

export interface TaskSummary {
  task_name: string;
  scheduled_time: string;
  status: string;
}

export interface BelongingSummary {
  item_name: string;
  last_location: string;
  default_location: string | null;
}

export interface BelongingsPatient {
  item_name: string;
}


export interface PatientIdentity {
  id: number;
  name: string;
  clinical_notes: string | null;
}

export interface AgentDataProvider {
  getTodayTasks(patientId: number): Promise<TaskSummary[]>;
  getBelongingsSummary(patientId: number): Promise<BelongingSummary[]>;
  getBelongings(patientId: number): Promise<BelongingsPatient[]>;
  reportTaskComplete?(patientId: number, taskName: string): Promise<{ success: boolean; taskName: string; message: string }>;
}

export interface ConverseInput {
  patient: PatientIdentity;
  transcript: string;
}

export interface ConverseResult {
  responseText: string;
  escalate: boolean;
  latencyMs: number;
  toolCallsUsed: string[];
}
