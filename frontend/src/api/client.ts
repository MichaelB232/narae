const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("narae_token");
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request gagal: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ user: any; token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  patientsForNurse: (nurseId: number) => request<any[]>(`/patients?nurseId=${nurseId}`),
  patientDetail: (id: number) => request<any>(`/patients/${id}`),

  helpRequests: (nurseId: number, status?: string) =>
    request<any[]>(`/help-requests?nurseId=${nurseId}${status ? `&status=${status}` : ""}`),
  acknowledgeHelp: (id: number) => request(`/help-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status: "ACKNOWLEDGED" }) }),
  resolveHelp: (id: number) => request(`/help-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status: "RESOLVED" }) }),

  tasksForPatient: (patientId: number) => request<any[]>(`/tasks?patientId=${patientId}`),
  confirmTask: (taskId: number, nurseId: number, approve: boolean, note?: string) =>
    request(`/tasks/${taskId}/confirm`, { method: "PATCH", body: JSON.stringify({ nurseId, approve, note }) }),
  createTask: (payload: any) => request("/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (taskId: number, payload: any) => request(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteTask: (taskId: number) => request(`/tasks/${taskId}`, { method: "DELETE" }),
  taskHistory: (taskId: number) => request<any[]>(`/tasks/${taskId}/history`),

  belongings: (patientId: number) => request<any[]>(`/belongings?patientId=${patientId}`),
  createBelonging: (payload: any) => request("/belongings", { method: "POST", body: JSON.stringify(payload) }),
  updateBelonging: (id: number, payload: any) => request(`/belongings/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteBelonging: (id: number) => request(`/belongings/${id}`, { method: "DELETE" }),

  aiHistory: (patientId: number) => request<any[]>(`/ai/history/${patientId}`),

  devices: () => request<any[]>("/devices"),
  converse: (patientId: number, deviceId: number, transcript: string) =>
    request<any>("/ai/converse", { method: "POST", body: JSON.stringify({ patientId, deviceId, transcript }) }),
  createHelpRequestPhysical: (patientId: number, deviceId: number) =>
    request<any>("/help-requests", { method: "POST", body: JSON.stringify({ patientId, deviceId }) }),
};
