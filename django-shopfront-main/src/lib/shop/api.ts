import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "vinxi/http";
import type {
  Article,
  Category,
  Comment,
  CreateCommentData,
  LoginCredentials,
  Order,
  Product,
  RegisterCredentials,
  SiteSettings,
  User,
} from "./types";

const API_BASE_URL = () => process.env.DJANGO_API_BASE_URL || "http://localhost:8000/api/v1";
const USE_MOCK = () => !process.env.DJANGO_API_BASE_URL;

const ACCESS_COOKIE = "django_access_token";
const REFRESH_COOKIE = "django_refresh_token";
const ACCESS_MAX_AGE = 60 * 15;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

interface TokenResponse {
  access: string;
  refresh?: string;
}

interface AuthResponse extends Partial<TokenResponse> {
  token?: string;
  user?: User;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  };
}

function setAuthCookies(access: string, refresh?: string) {
  setCookie(ACCESS_COOKIE, access, cookieOptions(ACCESS_MAX_AGE));
  if (refresh) setCookie(REFRESH_COOKIE, refresh, cookieOptions(REFRESH_MAX_AGE));
}

function clearAuthCookies() {
  deleteCookie(ACCESS_COOKIE);
  deleteCookie(REFRESH_COOKIE);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getCookie(REFRESH_COOKIE);
  if (!refresh) return null;

  const response = await fetch(`${API_BASE_URL()}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) return null;

  const result = (await response.json()) as { access: string };
  setCookie(ACCESS_COOKIE, result.access, cookieOptions(ACCESS_MAX_AGE));
  return result.access;
}

async function djangoFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const access = getCookie(ACCESS_COOKIE);
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const response = await fetch(`${API_BASE_URL()}${path}`, { ...options, headers });

  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return djangoFetch<T>(path, options, false);
    clearAuthCookies();
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  if (USE_MOCK()) return [] as Product[];
  return djangoFetch<Product[]>("/products/");
});

export const getProduct = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    if (USE_MOCK()) return null;
    return djangoFetch<Product>(`/products/${data.slug}/`);
  });

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  if (USE_MOCK()) return [] as Category[];
  return djangoFetch<Category[]>("/categories/");
});

export const getArticles = createServerFn({ method: "GET" }).handler(async () => {
  if (USE_MOCK()) return [] as Article[];
  return djangoFetch<Article[]>("/articles/");
});

export const getArticle = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    if (USE_MOCK()) return null;
    return djangoFetch<Article>(`/articles/${data.slug}/`);
  });

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  if (USE_MOCK()) return {} as SiteSettings;
  return djangoFetch<SiteSettings>("/settings/");
});

export const login = createServerFn({ method: "POST" })
  .validator((data: LoginCredentials) => data)
  .handler(async ({ data }) => {
    if (USE_MOCK()) {
      const user: User = { id: 1, username: data.username, email: `${data.username}@example.com`, first_name: "Demo", last_name: "User" };
      setAuthCookies("mock_access_token", "mock_refresh_token");
      return { user, access: "mock_access_token", refresh: "mock_refresh_token" };
    }

    const response = await fetch(`${API_BASE_URL()}/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("نام کاربری یا رمز عبور نادرست است.");

    const tokens = (await response.json()) as TokenResponse;
    setAuthCookies(tokens.access, tokens.refresh);
    const user = await djangoFetch<User>("/auth/me/");
    return { ...tokens, user };
  });

export const register = createServerFn({ method: "POST" })
  .validator((data: RegisterCredentials) => data)
  .handler(async ({ data }) => {
    if (USE_MOCK()) {
      const user: User = { id: 1, username: data.username, email: data.email, first_name: data.first_name, last_name: data.last_name };
      setAuthCookies("mock_access_token", "mock_refresh_token");
      return { user, access: "mock_access_token", refresh: "mock_refresh_token" };
    }

    const result = await djangoFetch<AuthResponse>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    }, false);
    const access = result.access ?? result.token;
    if (!access) throw new Error("ثبت‌نام توکن احراز هویت برنگرداند.");
    setAuthCookies(access, result.refresh);
    const user = result.user ?? (await djangoFetch<User>("/auth/me/"));
    return { ...result, access, user };
  });

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  if (USE_MOCK()) {
    return getCookie(ACCESS_COOKIE) ? ({ id: 1, username: "demo", email: "demo@example.com", first_name: "Demo", last_name: "User" } as User) : null;
  }
  if (!getCookie(ACCESS_COOKIE) && !getCookie(REFRESH_COOKIE)) return null;
  try {
    return await djangoFetch<User>("/auth/me/");
  } catch {
    clearAuthCookies();
    return null;
  }
});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  clearAuthCookies();
  return { success: true };
});

export const getOrders = createServerFn({ method: "GET" }).handler(async () => {
  if (USE_MOCK()) return [] as Order[];
  return djangoFetch<Order[]>("/orders/");
});

export const createOrder = createServerFn({ method: "POST" })
  .validator((data: Omit<Order, "id" | "created_at">) => data)
  .handler(async ({ data }) => {
    if (USE_MOCK()) return { ...data, id: Date.now(), created_at: new Date().toISOString() } as Order;
    return djangoFetch<Order>("/orders/", { method: "POST", body: JSON.stringify(data) });
  });

export const getComments = createServerFn({ method: "GET" })
  .validator((data: { productId: number }) => data)
  .handler(async ({ data }) => {
    if (USE_MOCK()) return [] as Comment[];
    return djangoFetch<Comment[]>(`/products/${data.productId}/comments/`);
  });

export const createComment = createServerFn({ method: "POST" })
  .validator((data: CreateCommentData) => data)
  .handler(async ({ data }) => {
    if (USE_MOCK()) return { ...data, id: Date.now(), user: "شما", created_at: new Date().toISOString() } as Comment;
    return djangoFetch<Comment>(`/products/${data.productId}/comments/`, { method: "POST", body: JSON.stringify(data) });
  });
