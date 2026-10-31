import { converse as agentConverse, type AgentDataProvider } from "@narae/agent";
import { patientRepository } from "../repositories/patient.repository.js";
import { aiLogRepository } from "../repositories/aiLog.repository.js";
import { helpRequestRepository } from "../repositories/helpRequest.repository.js";
import { taskService } from "./task.service.js";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";


const dataProvider: AgentDataProvider = {
  async getPatientTasks(patientId: number) {
    const tasks = await patientRepository.findActiveTasks(patientId);
    return tasks.map((t) => ({
      task_name: t.task_name,
      scheduled_time: t.scheduled_time.slice(0, 5),
      duration_minutes: t.duration_minutes,
      status: t.status,
      type: t.type,
      scheduled_date: t.scheduled_date ? t.scheduled_date.slice(0, 10) : null,
    }));
  },
  async getBelongingsSummary(patientId: number) {
    const belongings = await patientRepository.findBelongingsSummary(patientId);
    return belongings.map((b) => ({
      item_name: b.item_name,
      last_location: b.last_location,
      default_location: b.default_location ?? null,
    }))
  },
  async getBelongings(patientId: number) {
    const belongings = await patientRepository.findBelongings(patientId);
    return belongings.map((b) => ({ item_name: b.item_name }));
  },
  async reportTaskComplete(patientId: number, taskName: string) {
    const todayTasks = await patientRepository.findTodayTasks(patientId);
    const clean = (taskName || "").toLowerCase().trim();
    let matched = todayTasks.find(
      (t) => t.task_name.toLowerCase().includes(clean) || (clean.length > 3 && clean.includes(t.task_name.toLowerCase()))
    );

    if (!matched) {
      const active = todayTasks.filter((t) => t.status === "SCHEDULED" || t.status === "REMINDER_PLAYED");
      if (active.length > 0) matched = active[0];
    }

    if (!matched) {
      return { success: false, taskName, message: `Tidak ada tugas '${taskName}' yang belum selesai hari ini.` };
    }

    await taskService.reportCompleteByPatient(matched.id);
    return {
      success: true,
      taskName: matched.task_name,
      message: `Tugas '${matched.task_name}' berhasil ditandai selesai oleh pasien dan menunggu konfirmasi perawat.`,
    };
  },
};

export const aiService = {
  async converse(params: { patientId: number; deviceId: number; transcript: string }) {
    const patient = await patientRepository.findRaw(params.patientId);
    if (!patient) {
      const err: any = new Error("Pasien tidak ditemukan");
      err.status = 404;
      throw err;
    }
    if (!patient.assigned_nurse_id) {
      const err: any = new Error("Pasien ini tidak memiliki caregiver");
      err.status = 404;
      throw err;
    }
    const caregiver = await userRepository.findById(patient.assigned_nurse_id);
    if (!caregiver) {
      const err: any = new Error("Caregiver tidak ditemukan");
      err.status = 404;
      throw err;
    }
    const result = await agentConverse(
      {
        patient: { id: patient.id, name: patient.name, clinical_notes: patient.clinical_notes, caregiver_name: caregiver.full_name },
        transcript: params.transcript,
      },
      dataProvider,
      { apiKey: env.geminiApiKey, model: env.geminiModel }
    );

    const log = await aiLogRepository.create({
      patientId: params.patientId,
      deviceId: params.deviceId,
      transcript: params.transcript,
      responseText: result.responseText,
      actionTriggered: result.escalate ? "escalate_to_nurse" : "none",
      latencyMs: result.latencyMs,
    });

    let helpRequest = null;
    if (result.escalate) {
      helpRequest = await helpRequestRepository.create({
        patientId: params.patientId,
        deviceId: params.deviceId,
        triggeredByInteractionId: log.id,
      });
    }

    return { ...result, interactionId: log.id, helpRequest };
  },
};