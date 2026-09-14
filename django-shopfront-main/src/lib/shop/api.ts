import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import type { Article, ArticleComment, Category, LoginCredentials, Order, Product, ProductComment, ProductFilterOptions, ProductFilters, RegisterCredentials, SiteSetting, User } from "./types";
import { mockArticles, mockArticleComments, mockCategories, mockProductComments, mockProducts, mockSiteSetting } from "./mock";

const API_BASE_URL = () => process.env.DJANGO_API_BASE_URL || "http://localhost:8000/api/v1";
const USE_MOCK = () => !process.env.DJANGO_API_BASE_URL;
const ACCESS_COOKIE = "django_access_token";
const REFRESH_COOKIE = "django_refresh_token";

const cookieOptions = (maxAge: number) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge, path: "/" });
const clearAuthCookies = () => { deleteCookie(ACCESS_COOKIE); deleteCookie(REFRESH_COOKIE); };
const setAuthCookies = (access: string, refresh?: string) => { setCookie(ACCESS_COOKIE, access, cookieOptions(900)); if (refresh) setCookie(REFRESH_COOKIE, refresh, cookieOptions(604800)); };

async function refreshAccessToken() {
  const refresh = getCookie(REFRESH_COOKIE);
  if (!refresh) return null;
  const response = await fetch(`${API_BASE_URL()}/auth/token/refresh/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh }) });
  if (!response.ok) return null;
  const result = (await response.json()) as { access: string };
  setCookie(ACCESS_COOKIE, result.access, cookieOptions(900));
  return result.access;
}

async function djangoFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const access = getCookie(ACCESS_COOKIE);
  if (access) headers.set("Authorization", `Bearer ${access}`);
  let response = await fetch(`${API_BASE_URL()}${path}`, { ...options, headers });
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return djangoFetch<T>(path, options, false);
    clearAuthCookies();
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.detail || `HTTP ${response.status}`);
  }
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

export const getProducts = createServerFn({ method: "GET" }).validator((data: ProductFilters = {}) => data).handler(async ({ data }) => {
  if (USE_MOCK()) {
    let products = [...mockProducts];
    if (data.category) products = products.filter(p => p.category?.slug === data.category);
    if (data.search) { const q = data.search.toLowerCase(); products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q)); }
    if (data.brand?.length) products = products.filter(p => !!p.brand && data.brand!.includes(p.brand));
    if (data.color?.length) products = products.filter(p => (p.colors ?? []).some(c => data.color!.includes(c)));
    if (typeof data.min_price === "number") products = products.filter(p => p.price >= data.min_price!);
    if (typeof data.max_price === "number") products = products.filter(p => p.price <= data.max_price!);
    if (data.in_stock) products = products.filter(p => p.stock > 0 && p.is_available);
    if (data.ordering === "price") products.sort((a,b) => a.price-b.price);
    if (data.ordering === "-price") products.sort((a,b) => b.price-a.price);
    return products;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) { if (Array.isArray(value)) value.forEach(v => params.append(key, String(v))); else if (value !== undefined) params.set(key, String(value)); }
  return djangoFetch<Product[]>(`/products/?${params.toString()}`);
});

export const getProductFilterOptions = createServerFn({ method: "GET" }).validator((data: { category?: string } = {}) => data).handler(async ({ data }): Promise<ProductFilterOptions> => {
  if (USE_MOCK()) { const products = data.category ? mockProducts.filter(p => p.category?.slug === data.category) : mockProducts; return { brands: [...new Set(products.map(p => p.brand).filter(Boolean) as string[])], colors: [...new Set(products.flatMap(p => p.colors ?? []))], max_price: Math.max(0, ...products.map(p => p.price)) }; }
  return djangoFetch<ProductFilterOptions>(`/products/filters/${data.category ? `?category=${encodeURIComponent(data.category)}` : ""}`);
});

export const getProduct = createServerFn({ method: "GET" }).validator((data: { slug: string }) => data).handler(async ({ data }) => { if (USE_MOCK()) { const p = mockProducts.find(p => p.slug === data.slug); if (!p) throw new Error("Product not found"); return p; } return djangoFetch<Product>(`/products/${data.slug}/`); });
export const getCategories = createServerFn({ method: "GET" }).handler(async () => USE_MOCK() ? mockCategories : djangoFetch<Category[]>("/categories/"));

export const login = createServerFn({ method: "POST" }).validator((data: LoginCredentials) => data).handler(async ({ data }) => {
  if (USE_MOCK()) { const user: User = { id: 1, username: data.username, email: `${data.username}@example.com`, first_name: "Demo", last_name: "User" }; setAuthCookies("mock_access", "mock_refresh"); return { user, token: "mock_access", access: "mock_access", refresh: "mock_refresh" }; }
  const response = await fetch(`${API_BASE_URL()}/auth/token/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!response.ok) throw new Error("نام کاربری یا رمز عبور نادرست است.");
  const tokens = await response.json() as { access: string; refresh: string };
  setAuthCookies(tokens.access, tokens.refresh);
  return { ...tokens, user: await djangoFetch<User>("/auth/me/") };
});

export const register = createServerFn({ method: "POST" }).validator((data: RegisterCredentials) => data).handler(async ({ data }) => {
  if (USE_MOCK()) { const user: User = { id: 1, username: data.username, email: data.email, first_name: data.first_name, last_name: data.last_name }; setAuthCookies("mock_access", "mock_refresh"); return { user, token: "mock_access", access: "mock_access", refresh: "mock_refresh" }; }
  const result = await djangoFetch<{ access?: string; refresh?: string; token?: string; user?: User }>("/auth/register/", { method: "POST", body: JSON.stringify(data) }, false);
  const access = result.access ?? result.token; if (!access) throw new Error("ثبت‌نام توکن برنگرداند."); setAuthCookies(access, result.refresh); return { ...result, access, user: result.user ?? await djangoFetch<User>("/auth/me/") };
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => { if (USE_MOCK()) return getCookie(ACCESS_COOKIE) ? ({ id: 1, username: "demo", email: "demo@example.com", first_name: "Demo", last_name: "User" } as User) : null; if (!getCookie(ACCESS_COOKIE) && !getCookie(REFRESH_COOKIE)) return null; try { return await djangoFetch<User>("/auth/me/"); } catch { clearAuthCookies(); return null; } });
export const logout = createServerFn({ method: "POST" }).handler(async () => { clearAuthCookies(); return { success: true }; });

export const getOrders = createServerFn({ method: "GET" }).handler(async () => { if (USE_MOCK()) return [{ id: 1001, status: "delivered", total: 1290000, created_at: "2024-12-15T10:30:00Z", items: [] }] as Order[]; return djangoFetch<Order[]>("/orders/"); });
export const createOrder = createServerFn({ method: "POST" }).validator((data: { items: { product_id: number; quantity: number }[]; shipping_address: string }) => data).handler(async ({ data }) => USE_MOCK() ? ({ id: Date.now(), status: "pending", total: 0, created_at: new Date().toISOString(), items: [] } as Order) : djangoFetch<Order>("/orders/", { method: "POST", body: JSON.stringify(data) }));

export const getArticles = createServerFn({ method: "GET" }).validator((data: { category?: string; search?: string } = {}) => data).handler(async ({ data }) => { if (USE_MOCK()) { let a = mockArticles.filter(x => x.is_published); if (data.search) a = a.filter(x => x.title.toLowerCase().includes(data.search!.toLowerCase()) || x.short_description.toLowerCase().includes(data.search!.toLowerCase())); return a; } const params = new URLSearchParams(data as Record<string,string>); return djangoFetch<Article[]>(`/articles/?${params}`); });
export const getArticle = createServerFn({ method: "GET" }).validator((data: { slug: string }) => data).handler(async ({ data }) => { if (USE_MOCK()) { const a = mockArticles.find(x => x.slug === data.slug); if (!a) throw new Error("Article not found"); return a; } return djangoFetch<Article>(`/articles/${data.slug}/`); });
export const getArticleComments = createServerFn({ method: "GET" }).validator((data: { articleId: number }) => data).handler(async ({ data }) => USE_MOCK() ? mockArticleComments.filter(c => c.article === data.articleId && c.is_approved) : djangoFetch<ArticleComment[]>(`/articles/${data.articleId}/comments/`));
export const createArticleComment = createServerFn({ method: "POST" }).validator((data: { article: number; text: string; parent?: number | null }) => data).handler(async ({ data }) => USE_MOCK() ? ({ id: Date.now(), ...data, user: "شما", create_date: new Date().toISOString(), is_approved: true } as ArticleComment) : djangoFetch<ArticleComment>(`/articles/${data.article}/comments/`, { method: "POST", body: JSON.stringify(data) }));
export const getProductComments = createServerFn({ method: "GET" }).validator((data: { productId: number }) => data).handler(async ({ data }) => USE_MOCK() ? mockProductComments.filter(c => c.product === data.productId && c.is_approved) : djangoFetch<ProductComment[]>(`/products/${data.productId}/comments/`));
export const createProductComment = createServerFn({ method: "POST" }).validator((data: { product: number; text: string; rate: number; parent?: number | null }) => data).handler(async ({ data }) => USE_MOCK() ? ({ id: Date.now(), ...data, user: "شما", create_date: new Date().toISOString(), is_approved: true } as ProductComment) : djangoFetch<ProductComment>(`/products/${data.product}/comments/`, { method: "POST", body: JSON.stringify(data) }));
export const getSiteSetting = createServerFn({ method: "GET" }).handler(async () => USE_MOCK() ? mockSiteSetting : djangoFetch<SiteSetting>("/site-settings/main/"));
export const getSiteSettings = getSiteSetting;
