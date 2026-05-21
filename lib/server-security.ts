const DEFAULT_IMAGE_BASE_URL = "https://www.packyapi.com/v1";

function normalizeBaseUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Base URL 仅支持 http/https");
  }
  if (url.username || url.password) {
    throw new Error("Base URL 不能包含用户名或密码");
  }
  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/, "");
}

function allowedImageBaseUrls(): string[] {
  const raw =
    process.env.ALLOWED_IMAGE_BASE_URLS ||
    process.env.NEXT_PUBLIC_DEFAULT_BASE_URL ||
    DEFAULT_IMAGE_BASE_URL;

  return raw
    .split(",")
    .map((item) => {
      try {
        return normalizeBaseUrl(item);
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

function isLocalhost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function requireAllowedImageBaseUrl(value: string): string {
  const normalized = normalizeBaseUrl(value);
  const parsed = new URL(normalized);

  if (process.env.NODE_ENV !== "production" && isLocalhost(parsed.hostname)) {
    return normalized;
  }

  if (!allowedImageBaseUrls().includes(normalized)) {
    throw new Error("Base URL 不在允许列表中，请检查 ALLOWED_IMAGE_BASE_URLS");
  }

  return normalized;
}

