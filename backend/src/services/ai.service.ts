import { converse as agentConverse, type AgentDataProvider } from "@narae/agent";
import { patientRepository } from "../repositories/patient.repository.js";
import { aiLogRepository } from "../repositories/aiLog.repository.js";
import { helpRequestRepository } from "../repositories/helpRequest.repository.js";
import { taskService } from "./task.service.js";
import { env } from "../config/env.js";

// Ini DataProvider yang disuntikkan ke agent/ — agent package sendiri tidak tahu apa-apa
// soal Postgres, cuma tahu interface ini. Query-nya SAMA PERSIS dengan yang dipakai
// dashboard untuk "jadwal hari ini" (patientRepository.findTodayTasks), jadi jawaban AI
// dan tampilan dashboard tidak akan pernah berbeda.
const dataProvider: AgentDataProvider = {
  async getTodayTasks(patientId: number) {
    const tasks = await patientRepository.findTodayTasks(patientId);
    return tasks.map((t) => ({
      task_name: t.task_name,
      scheduled_time: t.scheduled_time,
      status: t.status,
    }));
  },
  async getBelongingsSummary(patientId: number) {
    const belongings = await patientRepository.findBelongings(patientId);
    return belongings.map((b) => ({
      item_name: b.item_name
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

    const result = await agentConverse(
      {
        patient: { id: patient.id, name: patient.name, clinical_notes: patient.clinical_notes },
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