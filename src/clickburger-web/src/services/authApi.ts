import axios from "axios";
import type { User } from "../store/authStore";

/** Base URL sem interceptor de logout para não interferir em fluxos de auth */
const rawAuthClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5004",
  headers: { "Content-Type": "application/json" },
});

export type LoginRequestBody = {
  username: string;
  password: string;
};

export type RegisterRequestBody = {
  username: string;
  email: string;
  password: string;
};

export type ApiUserDto = {
  id: string;
  username: string;
  email: string;
  role: string;
};

export type LoginResponseBody = {
  success: boolean;
  token: string;
  refreshToken: string;
  accessTokenExpiresAt?: string | null;
  refreshTokenExpiresAt?: string | null;
  message: string;
  user?: ApiUserDto | null;
};

function toStoreUser(dto: ApiUserDto): User {
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    role: dto.role,
  };
}

export async function loginApi(
  body: LoginRequestBody
): Promise<{ user: User; token: string; refreshToken: string }> {
  try {
    const { data } = await rawAuthClient.post<LoginResponseBody>(
      "/api/auth/login",
      body
    );
    if (!data.success || !data.token || !data.user)
      throw new Error(data.message || "Usuário ou senha inválidos.");
    return {
      user: toStoreUser(data.user),
      token: data.token,
      refreshToken: data.refreshToken ?? "",
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 401)
      throw new Error("Usuário ou senha inválidos.", e);
    throw e;
  }
}

export async function registerApi(body: RegisterRequestBody): Promise<void> {
  await rawAuthClient.post("/api/auth/register", body);
}

export async function refreshApi(
  refreshToken: string
): Promise<{ token: string; refreshToken: string }> {
  const { data } = await rawAuthClient.post<LoginResponseBody>(
    "/api/auth/refresh",
    { refreshToken }
  );
  if (!data.success || !data.token)
    throw new Error(data.message || "Sessão expirada.");
  return {
    token: data.token,
    refreshToken: data.refreshToken ?? refreshToken,
  };
}
