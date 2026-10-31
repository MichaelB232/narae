import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository.js";

export const authService = {
  // Demo-grade: bukan JWT asli, cuma base64(userId) supaya frontend punya sesuatu untuk disimpan.
  // Cukup untuk membedakan 2 akun demo di satu browser yang sama — JANGAN dipakai di production.
  async login(username: string, password: string) {
    const user = await userRepository.findByUsername(username);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.hash_password);
    if (!valid) return null;
    const { hash_password, ...safeUser } = user;
    const token = Buffer.from(String(user.id)).toString("base64");
    return { user: safeUser, token };
  },

  decodeToken(token: string): number | null {
    try {
      const id = Number(Buffer.from(token, "base64").toString("utf8"));
      return Number.isFinite(id) ? id : null;
    } catch {
      return null;
    }
  },
};
