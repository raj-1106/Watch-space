const BASE = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:4000");

let _accessToken: string | null = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (t: string | null) => { _accessToken = t; },
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (_accessToken) headers["Authorization"] = `Bearer ${_accessToken}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: "include" });

  // Auto-refresh on 401 (but not for auth endpoints)
  const isAuthEndpoint = path === "/auth/refresh" || path === "/auth/login" || path === "/auth/register";
  if (res.status === 401 && !isAuthEndpoint) {
    const refresh = await fetch(`${BASE}/auth/refresh`, { method: "POST", credentials: "include" });
    if (refresh.ok) {
      const data = await refresh.json();
      _accessToken = data.accessToken;
      headers["Authorization"] = `Bearer ${_accessToken}`;
      const retry = await fetch(`${BASE}${path}`, { ...options, headers, credentials: "include" });
      if (!retry.ok) {
        const body = await retry.json().catch(() => ({}));
        throw new Error(body.error || "Request failed");
      }
      return retry.json();
    } else {
      _accessToken = null;
      throw new Error("UNAUTHENTICATED");
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }

  return res.json();
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: "PUT",  body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
