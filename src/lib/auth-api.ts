import { apiRequest } from "@/lib/api-client";
import { saveAuthSession, type AuthSession } from "@/lib/auth-session";

type AuthResponse = {
  userId: number;
  username: string;
  token: string;
  expiresIn: number;
};

export type CurrentUser = {
  userId: number;
  username: string;
};

function toSession(response: AuthResponse): AuthSession {
  return {
    userId: response.userId,
    username: response.username,
    token: response.token,
    expiresAt: Date.now() + response.expiresIn * 1000,
  };
}

export async function registerAccount(input: {
  username: string;
  password: string;
  phone?: string;
}) {
  const response = await apiRequest<AuthResponse>("/api/auth/register", {
    authenticated: false,
    method: "POST",
    body: JSON.stringify(input),
  });
  const session = toSession(response);
  await saveAuthSession(session);
  return session;
}

export async function loginAccount(input: { username: string; password: string }) {
  const response = await apiRequest<AuthResponse>("/api/auth/login", {
    authenticated: false,
    method: "POST",
    body: JSON.stringify(input),
  });
  const session = toSession(response);
  await saveAuthSession(session);
  return session;
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>("/api/auth/me");
}
