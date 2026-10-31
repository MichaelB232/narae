import type { Request, Response, NextFunction } from "express";
import { patientService } from "../services/patient.service.js";

// GET /api/patients — daftar pasien milik perawat yang login (?nurseId=)
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const nurseId = req.query.nurseId ? Number(req.query.nurseId) : null;
    const patients = nurseId ? await patientService.listForNurse(nurseId) : await patientService.listAll();
    res.json(patients);
  } catch (err) {
    next(err); 
  }
}

// GET /api/patients/:id — profil + jadwal hari ini + barang (konteks closed-world yang sama dengan AI)
export async function getDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const detail = await patientService.getDetail(Number(req.params.id));
    if (!detail) return res.status(404).json({ error: "Pasien tidak ditemukan" });
    res.json(detail);
  } catch (err) {
    next(err);
  }
}
