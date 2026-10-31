import type { Request, Response, NextFunction } from "express";
import { taskService } from "../services/task.service.js";

// GET /api/tasks?patientId= — SEMUA task (bukan cuma hari ini), untuk "Edit Jadwal Keluarga"
export async function listByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await taskService.listByPatient(Number(req.query.patientId)));
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks — perawat bikin task baru
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { patientId, createdBy, taskName, spokenInstruction, voiceProfileId, type, daysOfWeek, scheduledTime, durationMinutes, scheduledDate } = req.body;
    const task = await taskService.create({
      patientId, createdBy, taskName, spokenInstruction, voiceProfileId, type, daysOfWeek, scheduledTime, durationMinutes, scheduledDate,
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tasks/:id — edit task "as a whole" (nama/jam/durasi/isActive/daysOfWeek)
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { taskName, scheduledTime, durationMinutes, isActive, daysOfWeek, type, scheduledDate } = req.body;
    const task = await taskService.update({
      taskId: Number(req.params.id),
      taskName,
      scheduledTime,
      durationMinutes,
      isActive,
      daysOfWeek,
      type,
      scheduledDate,
    });
    if (!task) return res.status(404).json({ error: "Task tidak ditemukan" });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await taskService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/played — device menandai reminder sudah diputar
export async function markPlayed(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await taskService.markPlayed(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/report — PASIEN lapor sudah selesai (klaim, belum final)
export async function reportComplete(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await taskService.reportCompleteByPatient(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tasks/:id/confirm — PERAWAT konfirmasi/tolak (final). body: { nurseId, approve, note? }
export async function confirm(req: Request, res: Response, next: NextFunction) {
  try {
    const { nurseId, approve, note } = req.body;
    if (!nurseId) return res.status(400).json({ error: "nurseId wajib diisi" });
    res.json(await taskService.confirmByNurse(Number(req.params.id), nurseId, Boolean(approve), note));
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id/history
export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await taskService.history(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
}
