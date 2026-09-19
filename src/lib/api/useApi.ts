"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";

// Client-side high-speed in-memory cache and deduplication map
const apiCache = new Map<string, { data: any; timestamp: number }>();
const inflightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 15000; // 15 seconds freshness window

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  apiCache.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      apiCache.delete(key);
    }
  });
}

export function useApi() {
  const { getIdToken } = useAuth();

  async function apiFetch<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null }> {
    const method = (options.method || "GET").toUpperCase();
    const isGet = method === "GET";
    const cacheKey = `${method}:${url}`;

    // On mutations (POST, PATCH, DELETE, PUT), invalidate cache
    if (!isGet) {
      if (url.startsWith("/api/tasks")) clearApiCache("/api/tasks");
      else if (url.startsWith("/api/goals")) clearApiCache("/api/goals");
      else if (url.startsWith("/api/projects")) clearApiCache("/api/projects");
      else if (url.startsWith("/api/learning")) clearApiCache("/api/learning");
      else if (url.startsWith("/api/ideas")) clearApiCache("/api/ideas");
      else if (url.startsWith("/api/planner")) clearApiCache("/api/planner");
      else clearApiCache();
    }

    // Serve from in-memory cache if fresh
    if (isGet && options.cache !== "no-store") {
      const cached = apiCache.get(url);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return { data: cached.data as T, error: null };
      }

      // Deduplicate inflight identical GET requests
      if (inflightRequests.has(cacheKey)) {
        return inflightRequests.get(cacheKey)!;
      }
    }

    const fetchPromise = (async () => {
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

        if (isGet && options.cache !== "no-store") {
          apiCache.set(url, { data: json, timestamp: Date.now() });
        }

        return { data: json, error: null };
      } catch (err: any) {
        const msg = err.message || "Network error occurred";
        return { data: null, error: msg };
      } finally {
        inflightRequests.delete(cacheKey);
      }
    })();

    if (isGet && options.cache !== "no-store") {
      inflightRequests.set(cacheKey, fetchPromise);
    }

    return fetchPromise;
  }

  return { apiFetch, clearCache: clearApiCache };
}
