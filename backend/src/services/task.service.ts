import { taskRepository, type CreateTaskParams, type UpdateTaskParams } from "../repositories/task.repository.js";

export const taskService = {
  listByPatient: (patientId: number) => taskRepository.findAllByPatient(patientId),
  create: (params: CreateTaskParams) => taskRepository.create(params),
  update: (params: UpdateTaskParams) => taskRepository.update(params),
  remove: (taskId: number) => taskRepository.remove(taskId),

  markPlayed: (taskId: number) => taskRepository.setStatus({ taskId, newStatus: "REMINDER_PLAYED" }),

  // Pasien melaporkan lewat suara/tombol — ini KLAIM, belum final.
  reportCompleteByPatient: (taskId: number) =>
    taskRepository.setStatus({ taskId, newStatus: "REPORTED_COMPLETE_BY_PATIENT", changedByPatient: true }),

  // Perawat yang menentukan status final. `note` = "Alasan Pengubahan (Opsional)" di form Figma,
  // disimpan ke task_status_history (bukan ke task itu sendiri — lihat komentar di db/init.sql).
  confirmByNurse: (taskId: number, nurseId: number, approve: boolean, note?: string | null) =>
    taskRepository.setStatus({
      taskId,
      newStatus: approve ? "CONFIRMED_BY_NURSE" : "REJECTED_BY_NURSE",
      changedBy: nurseId,
      note: note ?? null,
    }),

  history: (taskId: number) => taskRepository.findHistory(taskId),
};
