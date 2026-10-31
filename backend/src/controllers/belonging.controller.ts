import type { Request, Response, NextFunction } from "express";
import { belongingService } from "../services/belonging.service.js";

// GET /api/belongings?patientId=
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await belongingService.list(Number(req.query.patientId)));
  } catch (err) {
    next(err);
  }
}

// POST /api/belongings — body: { patientId, itemName, defaultLocation, lastLocation }
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { patientId, itemName, defaultLocation, lastLocation } = req.body;
    if (!patientId || !itemName) return res.status(400).json({ error: "patientId & itemName wajib" });
    res.status(201).json(
      await belongingService.create({ patientId, itemName, defaultLocation: defaultLocation ?? "", lastLocation: lastLocation ?? defaultLocation ?? "" })
    );
  } catch (err) {
    next(err);
  }
}

// PATCH /api/belongings/:id
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { itemName, defaultLocation, lastLocation } = req.body;
    const row = await belongingService.update(Number(req.params.id), { itemName, defaultLocation, lastLocation });
    if (!row) return res.status(404).json({ error: "Barang tidak ditemukan" });
    res.json(row);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/belongings/:id
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await belongingService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
