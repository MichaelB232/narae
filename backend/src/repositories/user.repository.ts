import { pool } from "../db/pool.js";
import type { User } from "../types/domain.js";

export const userRepository = {
  async findByUsername(username: string): Promise<(User & { hash_password: string }) | null> {
    const { rows } = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
    return rows[0] ?? null;
  },

  async findById(id: number): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `SELECT id, username, email, full_name, role, phone_number, created_at FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async findAll(): Promise<User[]> {
    const { rows } = await pool.query<User>(
      `SELECT id, username, email, full_name, role, phone_number, created_at FROM users ORDER BY id`
    );
    return rows;
  },
};
