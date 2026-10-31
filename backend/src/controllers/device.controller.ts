import type { Request, Response, NextFunction } from "express";
import { deviceRepository } from "../repositories/device.repository.js";

// GET /api/devices — dipakai simulator untuk menampilkan pilihan "jadi pasien siapa"
export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await deviceRepository.findAll());
  } catch (err) {
    next(err);
  }
}

// POST /api/devices/:uid/heartbeat — FR-003, device sync berkala
export async function heartbeat(req: Request, res: Response, next: NextFunction) {
  try {
    const device = await deviceRepository.heartbeat(req.params.uid, req.body?.batteryPercentage);
    if (!device) return res.status(404).json({ error: "Device tidak ditemukan" });
    res.json(device);
  } catch (err) {
    next(err);
  }
}
