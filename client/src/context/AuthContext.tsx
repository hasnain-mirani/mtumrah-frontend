// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http } from "../lib/http";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- helpers ---
const normalizeId = (val: any): string | null => {
  if (!val) return null;
  let s = typeof val === "string" ? val : String(val);
  s = s.trim();
  const m = s.match(/^ObjectId\(["']?([0-9a-fA-F]{24})["']?\)$/);
  if (m) s = m[1];
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return /^[0-9a-fA-F]{24}$/.test(s) ? s : null;
};

const extractCompanyId = (payload: any): string | null => {
  const c =
    payload?.agent?.company ??
    payload?.user?.company ??
    payload?.company ??
    payload?.companyId ??
    null;
  if (!c) return null;
  if (typeof c === "object" && c?._id) return normalizeId(c._id);
  return normalizeId(c);
};

const saveCompanyIdIfAny = (payload: any) => {
  const cid = extractCompanyId(payload);
  if (cid) localStorage.setItem("companyId", cid);
  return !!cid;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on boot using token -> /api/auth/me or /api/agent/me
  useEffect(() => {
    const boot = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));

        const token = localStorage.getItem("token");
        if (!token) return;

        // Try admin /auth/me first, then /agent/me
        let res;
        try {
          res = await http.get("/api/auth/me");
        } catch {
          try {
            res = await http.get("/api/agent/me");
          } catch {
            throw new Error("Session restoration failed");
          }
        }

        if (res?.data) {
          // ensure companyId is saved for subsequent requests
          if (!localStorage.getItem("companyId")) {
            saveCompanyIdIfAny(res.data);
          }
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("companyId");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    boot();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Try admin login first, then agent login
      let res;
      try {
        res = await http.post("/api/auth/login", { email, password });
      } catch (adminError) {
        try {
          res = await http.post("/api/agent/login", { email, password });
        } catch (agentError) {
          console.error("Both admin and agent login failed:", { adminError, agentError });
          return false;
        }
      }

      const { token } = res.data || {};
      if (!token) return false;

      // Normalize user (works for both shapes)
      const u =
        res.data.user ??
        {
          id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          agentId: res.data._id, // for agents
        };

      // Persist auth
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);

      // Save companyId from login payload if present
      const hadCompany = saveCompanyIdIfAny(res.data);

      // Fallback: fetch /me to get companyId if missing
      if (!hadCompany) {
        try {
          let me;
          try {
            me = await http.get("/api/auth/me");
          } catch {
            me = await http.get("/api/agent/me");
          }
          saveCompanyIdIfAny(me.data);
        } catch {
          // ignore; some routes may still work if DEFAULT_COMPANY_ID is set on backend
        }
      }

      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  };

  const logout = async () => {
    try {
      await http.post("/api/auth/logout").catch(() => {});
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("companyId");
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, logout }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
