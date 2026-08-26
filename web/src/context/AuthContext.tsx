import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, AuthState } from "../types";
import { api, tokenStore } from "../lib/api";

interface AuthContextValue extends AuthState {
  login:    (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout:   () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to refresh session from httpOnly cookie
  useEffect(() => {
    api.post<{ accessToken: string }>("/auth/refresh", {})
      .then(({ accessToken: t }) => {
        tokenStore.set(t);
        setAccessToken(t);
        return api.get<User>("/auth/me");
      })
      .then(setUser)
      .catch(() => { /* no session */ })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const res = await api.post<{ accessToken: string; user: User }>("/auth/login", { email, password, rememberMe });
    tokenStore.set(res.accessToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await api.post<{ accessToken: string; user: User }>("/auth/register", { email, password, displayName });
    tokenStore.set(res.accessToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout", {}).catch(() => {});
    tokenStore.set(null);
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
