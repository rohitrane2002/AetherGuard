export const AUTH_TOKEN_KEY = "aetherguard_access_token";
export const REFRESH_TOKEN_KEY = "aetherguard_refresh_token";
export const AUTH_USER_EMAIL_KEY = "aetherguard_user_email";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://aetherguard-api.onrender.com";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAuthEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_USER_EMAIL_KEY);
}

export function hasAuthSession(): boolean {
  return Boolean(getAuthToken());
}

export function storeAuthSession(accessToken: string, refreshToken: string, email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  window.localStorage.setItem(AUTH_USER_EMAIL_KEY, email);
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_EMAIL_KEY);
}

export function redirectToAuth(clearSession = false) {
  if (typeof window === "undefined") return;
  if (clearSession) clearAuthSession();
  window.location.href = "/auth";
}

export function isUnauthorizedStatus(status?: number): boolean {
  return status === 401;
}

export function isUnauthorizedError(error: unknown): boolean {
  const maybeError = error as { response?: { status?: number } };
  return isUnauthorizedStatus(maybeError?.response?.status);
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    clearAuthSession();
    return null;
  }

  const data = await response.json();
  storeAuthSession(data.access_token, data.refresh_token, data.user.email);
  return data.access_token;
}

export async function authFetch(input: string, init: RequestInit = {}, retry = true) {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });
  if (response.status === 401 && retry) {
    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) {
      return response;
    }
    const retryHeaders = new Headers(init.headers || {});
    retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
    return fetch(input, { ...init, headers: retryHeaders });
  }
  return response;
}
