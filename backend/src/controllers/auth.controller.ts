import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username & password wajib" });
    const result = await authService.login(username, password);
    if (!result) return res.status(401).json({ error: "Username atau password salah" });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
