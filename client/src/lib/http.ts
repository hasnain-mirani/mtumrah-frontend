// src/lib/http.ts
import axios, { AxiosRequestConfig } from "axios";

/** ---------- Config ---------- **/
const API_BASE =
  import.meta.env.VITE_API_URL ||
  // fallback if you run FE on 5173 and BE on 7000 locally
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:7000` : "http://localhost:7000");

const isDev = import.meta.env.DEV === true;

/** Normalize values like: ObjectId("..."), quoted strings, stray spaces */
const normalizeCompanyId = (val?: unknown): string | null => {
  if (!val) return null;
  let s = typeof val === "string" ? val : String(val);
  s = s.trim();

  // strip ObjectId("...") wrapper
  const m = s.match(/^ObjectId\(["']?([0-9a-fA-F]{24})["']?\)$/);
  if (m) s = m[1];

  // strip surrounding quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }

  return s.trim() || null;
};

/** Try to read company id from several places */
const getCompanyId = (): string | null => {
  // 1) localStorage (authoritative after login)
  const fromLS = normalizeCompanyId(localStorage.getItem("companyId"));
  if (fromLS) return fromLS;

  // 2) URL ?companyId= (handy for first boot)
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    const fromQuery = normalizeCompanyId(url.searchParams.get("companyId"));
    if (fromQuery) return fromQuery;
  }

  // 3) Vite env fallback (optional)
  const fromEnv = normalizeCompanyId(import.meta.env.VITE_COMPANY_ID as string | undefined);
  if (fromEnv) return fromEnv;

  return null;
};

const getToken = (): string | null => {
  const t = localStorage.getItem("token");
  return t && t.trim() ? t : null;
};

/** ---------- Axios Instance ---------- **/
export const http = axios.create({
  baseURL: API_BASE,
  timeout: 20000, // 20s
  // withCredentials: true, // enable if your API needs cookies
});

/** ---------- Request Interceptor ---------- **/
http.interceptors.request.use((config: AxiosRequestConfig) => {
  // Always send Authorization when present
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // Always send x-company-id when we have it
  const companyId = getCompanyId();
  if (companyId) {
    config.headers = config.headers || {};
    (config.headers as any)["x-company-id"] = companyId;
  }

  if (isDev) {
    // Lightweight dev log so you can confirm headers/URL easily
    // eslint-disable-next-line no-console
    console.debug(
      "[http] →",
      (config.method || "get").toUpperCase(),
      config.baseURL ? config.baseURL + (config.url || "") : config.url,
      {
        hasToken: !!token,
        companyId: (config.headers as any)?.["x-company-id"] || null,
      }
    );
  }

  return config;
});

/** ---------- Response Interceptor (optional) ---------- **/
http.interceptors.response.use(
  (res) => res,
  (err) => {
    // Optional: auto-logout on 401
    if (err?.response?.status === 401) {
      // Clear stale creds so the next request won’t keep failing
      localStorage.removeItem("token");
      // You can redirect to login here if you want:
      // window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/** ---------- Small helpers for auth setup ---------- **/
export const auth = {
  setToken(token: string) {
    localStorage.setItem("token", token);
  },
  clearToken() {
    localStorage.removeItem("token");
  },
  setCompanyId(companyId: string) {
    const normalized = normalizeCompanyId(companyId);
    if (normalized) localStorage.setItem("companyId", normalized);
  },
  clearCompanyId() {
    localStorage.removeItem("companyId");
  },
};

export default http;
