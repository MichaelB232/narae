export interface TaskSummary {
  task_name: string;
  scheduled_time: string;
  duration_minutes: number;    
  status: string;
  type?: "RECURRING" | "ONE_TIME"; 
  scheduled_date?: string | null; 
  days_of_week?: number[] | null;
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
  caregiver_name: string;
  clinical_notes: string | null;
}

export interface AgentDataProvider {
  getPatientTasks(patientId: number): Promise<TaskSummary[]>;
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
