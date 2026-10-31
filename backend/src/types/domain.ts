export type UserRole = "nurse" | "family";

export type TaskType = "RECURRING" | "ONE_TIME";

export type TaskStatus =
  | "SCHEDULED"
  | "REMINDER_PLAYED"
  | "REPORTED_COMPLETE_BY_PATIENT"
  | "CONFIRMED_BY_NURSE"
  | "REJECTED_BY_NURSE"
  | "MISSED";

export type RequestStatus = "PENDING" | "ACKNOWLEDGED" | "RESOLVED" | "EXPIRED";

export interface User {
  id: number;
  username: string;
  email: string | null;
  full_name: string;
  role: UserRole;
  phone_number: string | null;
  created_at: string;
}

export interface Patient {
  id: number;
  name: string;
  date_of_birth: string | null;
  room_number: string | null;
  assigned_nurse_id: number | null;
  preferred_voice_id: number | null;
  clinical_notes: string | null;
  created_at: string;
}

export interface PatientWithDevice extends Patient {
  device_id: number | null;
  device_uid: string | null;
  battery_percentage: number | null;
  is_online: boolean | null;
}

export interface Device {
  id: number;
  device_uid: string;
  patient_id: number | null;
  battery_percentage: number;
  is_online: boolean;
  last_synced_at: string | null;
}

export interface PatientBelonging {
  id: number;
  patient_id: number;
  item_name: string;
  last_location: string;
  default_location: string | null;
  updated_at: string;
}

export interface PatientTask {
  id: number;
  patient_id: number;
  created_by: number;
  task_name: string;
  spoken_instruction: string;
  voice_profile_id: number | null;
  generated_audio_url: string | null;
  type: TaskType;
  days_of_week: number[] | null;
  scheduled_time: string;
  duration_minutes: number;
  scheduled_date: string | null;
  is_active: boolean;
  status: TaskStatus;
  created_at: string;
}

export interface TaskStatusHistoryEntry {
  id: number;
  task_id: number;
  old_status: TaskStatus | null;
  new_status: TaskStatus;
  changed_by: number | null;
  changed_by_patient: boolean;
  note: string | null;
  created_at: string;
}

export interface AiInteractionLog {
  id: number;
  patient_id: number;
  device_id: number;
  patient_speech_transcript: string;
  ai_response_text: string;
  action_triggered: string | null;
  latency_ms: number | null;
  created_at: string;
}

export interface HelpRequest {
  id: number;
  patient_id: number;
  device_id: number;
  triggered_by_interaction_id: number | null;
  status: RequestStatus;
  expires_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface HelpRequestWithPatient extends HelpRequest {
  patient_name: string;
  room_number: string | null;
  patient_speech_transcript: string | null;
}
