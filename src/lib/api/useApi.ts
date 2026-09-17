"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";

export function useApi() {
  const { getIdToken } = useAuth();

  async function apiFetch<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const token = await getIdToken();
      const headers = new Headers(options.headers || {});
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
        headers.set("Content-Type", "application/json");
      }

      const res = await fetch(url, {
        ...options,
        headers,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const errMsg = json?.error || `Request failed with status ${res.status}`;
        return { data: null, error: errMsg };
      }

      return { data: json, error: null };
    } catch (err: any) {
      const msg = err.message || "Network error occurred";
      return { data: null, error: msg };
    }
  }

  return { apiFetch };
}
