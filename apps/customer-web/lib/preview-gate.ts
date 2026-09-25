/** Cookie set after a correct preview password. Not the password itself. */
export const PREVIEW_COOKIE = "trc_preview";

const TOKEN_MESSAGE = "trc-customer-web-preview-v1";

export function previewPassword(): string | undefined {
  const value = process.env.PREVIEW_PASSWORD?.trim();
  return value ? value : undefined;
}

/** Production without a password stays shut. Local dev stays open when unset. */
export function previewGateMode(): "open" | "closed" | "check" {
  if (previewPassword()) return "check";
  if (process.env.NODE_ENV === "production") return "closed";
  return "open";
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  let url: URL;
  try {
    url = new URL(value, "http://preview.local");
  } catch {
    return "/";
  }
  if (url.origin !== "http://preview.local") return "/";
  if (url.pathname.startsWith("//")) return "/";
  if (url.pathname === "/preview-access" || url.pathname.startsWith("/api/preview-access")) return "/";
  return `${url.pathname}${url.search}`;
}

export function timingSafeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  const length = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(digest);
}

export async function passwordsMatch(input: string, expected: string): Promise<boolean> {
  const [left, right] = await Promise.all([sha256(input), sha256(expected)]);
  return timingSafeEqual(left, right);
}

export async function previewToken(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(TOKEN_MESSAGE));
  return toHex(signature);
}

export function cookieSecure(request: { nextUrl: { protocol: string }; headers: Headers }): boolean {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded === "https";
  return request.nextUrl.protocol === "https:";
}
