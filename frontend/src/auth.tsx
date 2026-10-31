import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthUser } from "./types";

interface AuthCtx {
  user: AuthUser | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("narae_user");
    return raw ? JSON.parse(raw) : null;
  });

  function login(u: AuthUser, token: string) {
    localStorage.setItem("narae_user", JSON.stringify(u));
    localStorage.setItem("narae_token", token);
    setUser(u);
  }
  function logout() {
    localStorage.removeItem("narae_user");
    localStorage.removeItem("narae_token");
    setUser(null);
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
