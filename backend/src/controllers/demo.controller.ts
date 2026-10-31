import type { Request, Response } from "express";
import { demoService } from "../services/demo.service.js";

export async function generateSession(req: Request, res: Response) {
  try {
    const rawMode = req.body?.mode || req.query?.mode;
    const mode = rawMode === "multiple" ? "multiple" : "single";
    const data = await demoService.generateSession(mode);
    res.status(201).json(data);
  } catch (err: any) {
    console.error("Gagal generate demo session:", err);
    res.status(500).json({
      error: "Sesi demo belum berhasil dibuat karena bentrok ID sementara. Silakan klik tombol 'Buat Akun Demo' sekali lagi ya!",
      details: err?.message,
    });
  }
}

export async function resetSession(req: Request, res: Response) {
  try {
    const userId = Number(req.body.userId);
    if (!userId) {
      return res.status(400).json({ error: "userId wajib diisi" });
    }
    const result = await demoService.resetSession(userId);
    res.json(result);
  } catch (err: any) {
    console.error("Gagal reset demo session:", err);
    res.status(500).json({
      error: "Gagal mereset sesi demo. Silakan coba klik tombol reset sekali lagi ya!",
      details: err?.message,
    });
  }
}
