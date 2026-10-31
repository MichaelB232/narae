import type { Request, Response, NextFunction } from "express";
import { helpRequestService } from "../services/helpRequest.service.js";
import type { RequestStatus } from "../types/domain.js";

// GET /api/help-requests?nurseId=&status= — dashboard perawat polling ini
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const nurseId = Number(req.query.nurseId);
    if (!nurseId) return res.status(400).json({ error: "nurseId wajib diisi" });
    const status = req.query.status as RequestStatus | undefined;
    res.json(await helpRequestService.listForNurse(nurseId, status));
  } catch (err) {
    next(err);
  }
}

// GET /api/help-requests/:id — cek status panggilan spesifik (dipakai simulator/gelang)
export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ error: "ID panggilan tidak valid" });
    const item = await helpRequestService.getById(id);
    if (!item) return res.status(404).json({ error: "Panggilan bantuan tidak ditemukan" });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

// POST /api/help-requests — dipicu TOMBOL FISIK (bukan AI). body: { patientId, deviceId }
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { patientId, deviceId } = req.body;
    if (!patientId || !deviceId) return res.status(400).json({ error: "patientId & deviceId wajib" });
    res.status(201).json(await helpRequestService.create(patientId, deviceId, null));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/help-requests/:id — body: { status: 'ACKNOWLEDGED' | 'RESOLVED' | 'EXPIRED' }
export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "ID panggilan tidak valid" });
    }
    const { status } = req.body || {};
    if (status !== "ACKNOWLEDGED" && status !== "RESOLVED" && status !== "EXPIRED") {
      return res.status(400).json({ error: "status harus ACKNOWLEDGED, RESOLVED, atau EXPIRED" });
    }

    const result =
      status === "ACKNOWLEDGED"
        ? await helpRequestService.acknowledge(id)
        : status === "RESOLVED"
        ? await helpRequestService.resolve(id)
        : await helpRequestService.expire(id);

    if (!result) {
      return res.status(404).json({ error: "Panggilan bantuan tidak ditemukan" });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}
