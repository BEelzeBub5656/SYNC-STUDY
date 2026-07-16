import { clearAuthSession, getAuthSession } from "@/lib/auth-session";

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://10.0.2.2:8080";

export async function apiRequest<T>(
  path: string,
  { authenticated = true, ...options }: ApiRequestOptions = {},
): Promise<T> {
  const session = authenticated ? await getAuthSession() : null;
  if (authenticated && !session) {
    throw new Error("请先登录后再使用此功能");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "无法连接后端，请确认 Spring Boot 已启动，并检查 EXPO_PUBLIC_API_BASE_URL。",
    );
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // 交给下面的统一错误处理。
  }

  if (response.status === 401) {
    await clearAuthSession();
  }
  if (!response.ok || !body || body.code !== 0) {
    throw new Error(body?.message || `请求失败（${response.status}）`);
  }
  return body.data;
}
