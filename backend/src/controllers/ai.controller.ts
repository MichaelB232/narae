import type { Request, Response, NextFunction } from "express";
import { aiService } from "../services/ai.service.js";
import { aiLogRepository } from "../repositories/aiLog.repository.js";

// POST /api/ai/converse — body: { patientId, deviceId, transcript }
// Satu-satunya pintu masuk ke modul agent/. Lihat agent/src/agent.ts untuk alur tool-calling-nya.
export async function converse(req: Request, res: Response, next: NextFunction) {
  try {
    const { patientId, deviceId, transcript } = req.body;
    if (!patientId || !deviceId || !transcript) {
      return res.status(400).json({ error: "patientId, deviceId, transcript wajib diisi" });
    }
    res.json(await aiService.converse({ patientId, deviceId, transcript }));
  } catch (err) {
    next(err);
  }
}

// GET /api/ai/history/:patientId — dipakai tab "Riwayat" (log chat/interaksi dengan AI)
export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await aiLogRepository.findByPatient(Number(req.params.patientId)));
  } catch (err) {
    next(err);
  }
}
