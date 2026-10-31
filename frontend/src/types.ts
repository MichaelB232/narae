export type TaskStatus =
  | "SCHEDULED" | "REMINDER_PLAYED" | "REPORTED_COMPLETE_BY_PATIENT"
  | "CONFIRMED_BY_NURSE" | "REJECTED_BY_NURSE" | "MISSED";

export type RequestStatus = "PENDING" | "ACKNOWLEDGED" | "RESOLVED" | "EXPIRED";

export interface AuthUser {
  id: number;
  username: string;
  full_name: string;
  role: "nurse" | "family";
}

export interface PatientListItem {
  id: number;
  name: string;
  room_number: string | null;
  date_of_birth?: string | null;
  device_id: number | null;
  battery_percentage: number | null;
  is_online: boolean | null;
}

export interface TaskItem {
  id: number;
  patient_id: number;
  task_name: string;
  spoken_instruction: string;
  type: "RECURRING" | "ONE_TIME";
  days_of_week: number[] | null;
  scheduled_time: string;
  duration_minutes: number;
  scheduled_date: string | null;
  status: TaskStatus;
  is_active: boolean;
}

export interface Belonging {
  id: number;
  patient_id: number;
  item_name: string;
  last_location: string;
  default_location: string | null;
}

export interface PatientDetail {
  patient: PatientListItem & { clinical_notes: string | null; date_of_birth: string | null };
  todayTasks: TaskItem[];
  belongings: Belonging[];
}

export interface HelpRequestItem {
  id: number;
  patient_id: number;
  patient_name: string;
  room_number: string | null;
  status: RequestStatus;
  patient_speech_transcript: string | null;
  created_at: string;
  expires_at: string;
  seconds_left: number;
  deadline: number;
  resolved_at: string | null;
}

export interface TaskHistoryEntry {
  id: number;
  task_id: number;
  old_status: TaskStatus | null;
  new_status: TaskStatus;
  changed_by: number | null;
  changed_by_patient: boolean;
  note: string | null;
  created_at: string;
}

export interface AiLogItem {
  id: number;
  patient_id: number;
  patient_speech_transcript: string;
  ai_response_text: string;
  action_triggered: string | null;
  created_at: string;
}
