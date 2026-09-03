import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { setAuthToken, setLogoutCallback, updateActivity } from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  username: string;
  displayName: string;
  role: string;
}

interface LoginResponse {
  token: string;
  expiresAt: string;
  username: string;
  displayName: string;
  role: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  /** Throws on invalid credentials (message is user-facing). */
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// ── Storage keys & constants ──────────────────────────────────────────────────

const SK_TOKEN    = 'copilot_auth_token';
const SK_USER     = 'copilot_auth_user';
const SK_ACTIVITY = 'copilot_last_activity';
const INACTIVITY_MS = 20 * 60 * 1000; // 20 minutos
const CHECK_INTERVAL_MS = 60 * 1000;   // verificar cada 60 s

// ── JWT helpers ───────────────────────────────────────────────────────────────

/**
 * Decode the JWT payload (no signature verification — solo para leer exp).
 * Returns null si el token está malformado.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiry(token);
  return exp === null || Date.now() >= exp;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function saveSession(token: string, user: AuthUser): void {
  sessionStorage.setItem(SK_TOKEN,    token);
  sessionStorage.setItem(SK_USER,     JSON.stringify(user));
  sessionStorage.setItem(SK_ACTIVITY, String(Date.now()));
}

function clearSession(): void {
  sessionStorage.removeItem(SK_TOKEN);
  sessionStorage.removeItem(SK_USER);
  sessionStorage.removeItem(SK_ACTIVITY);
}

function touchActivity(): void {
  sessionStorage.setItem(SK_ACTIVITY, String(Date.now()));
}

function loadSession(): { token: string; user: AuthUser } | null {
  const token        = sessionStorage.getItem(SK_TOKEN);
  const userRaw      = sessionStorage.getItem(SK_USER);
  const lastActivity = sessionStorage.getItem(SK_ACTIVITY);

  if (!token || !userRaw || !lastActivity) return null;

  // Rechazar por inactividad
  if (Date.now() - parseInt(lastActivity, 10) > INACTIVITY_MS) {
    clearSession();
    return null;
  }

  // Rechazar si el JWT ya expiró (sin necesidad de red)
  if (isTokenExpired(token)) {
    clearSession();
    return null;
  }

  try {
    return { token, user: JSON.parse(userRaw) as AuthUser };
  } catch {
    clearSession();
    return null;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE_URL = (import.meta as { env: Record<string, string> }).env.VITE_API_URL || '/api';

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user,  setUser]  = useState<AuthUser | null>(null);

  // Ref para que el setInterval siempre llame a la versión actual de logout
  const logoutRef = useRef<() => void>(() => {});

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    clearSession();
  }, []);

  logoutRef.current = logout;

  // ── Registrar callback de logout forzado ante 401 ──────────────────────────

  useEffect(() => {
    setLogoutCallback(logout);
    return () => setLogoutCallback(null);
  }, [logout]);

  // ── Restaurar sesión al montar ─────────────────────────────────────────────
  // loadSession() ya verifica inactividad (20 min) y expiración del JWT
  // mediante isTokenExpired(). Si el token pasa ambas validaciones, lo
  // restauramos directamente — sin ping de red — para evitar un request
  // que podría fallar por CORS u otras restricciones en el dominio de
  // producción. Si el backend rechaza el token en la primera petición
  // protegida, el mecanismo _logoutCallback → 401 lo limpia correctamente.

  useEffect(() => {
    const saved = loadSession();
    if (!saved) return;

    setToken(saved.token);
    setUser(saved.user);
    setAuthToken(saved.token);
    updateActivity();
  }, []); // solo en mount

  // ── Listeners de actividad del usuario ────────────────────────────────────
  // Actualizamos el timestamp en sessionStorage sin resetear ningún timer
  // costoso. El setInterval se encarga de verificar cada minuto.

  useEffect(() => {
    if (!token) return;

    const EVENTS = ['click', 'keydown', 'touchstart', 'scroll'] as const;
    const onActivity = () => {
      touchActivity();
      updateActivity(); // notifica también al módulo api.ts
    };

    EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    return () => EVENTS.forEach(e => window.removeEventListener(e, onActivity));
  }, [token]);

  // ── Chequeo periódico de inactividad ──────────────────────────────────────

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      const last = sessionStorage.getItem(SK_ACTIVITY);
      if (!last || Date.now() - parseInt(last, 10) > INACTIVITY_MS) {
        logoutRef.current();
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [token]);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error de autenticación' }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const data: LoginResponse = await response.json();
    const newUser: AuthUser = {
      username:    data.username,
      displayName: data.displayName,
      role:        data.role,
    };

    setToken(data.token);
    setUser(newUser);
    setAuthToken(data.token);
    saveSession(data.token, newUser); // persiste en sessionStorage
    updateActivity();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
