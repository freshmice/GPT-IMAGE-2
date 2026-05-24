import type {
  GenerateRequest,
  EditRequest,
  GenerateResponse,
  GeneratedImage,
  ApiErrorResponse,
} from "@/lib/types";
import { getClientId } from "@/lib/client-id";

async function parseErr(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as ApiErrorResponse;
    return j.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

interface StoredImageResponseItem {
  name: string;
  url?: string;
  path?: string;
  downloadUrl?: string;
  pathname?: string;
  size?: number;
  mtime?: number;
}

const RECOVERABLE_STATUSES = new Set([408, 502, 503, 504, 524]);
const RECOVERY_POLL_INTERVAL_MS = 2000;
const RECOVERY_POLL_ATTEMPTS = 90;
const DIRECT_REQUEST_GRACE_MS = 1500;

function isRecoverableRequestError(error: unknown) {
  if (error instanceof ApiRequestError) {
    return error.status === undefined || RECOVERABLE_STATUSES.has(error.status);
  }
  return error instanceof TypeError || error instanceof DOMException;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function safePrefix(prefix?: string) {
  return (prefix ?? "image")
    .trim()
    .replace(/[^a-z0-9_-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "image";
}

async function recoverSavedImages(opts: {
  prefix?: string;
  startedAt: number;
  expectedCount?: number;
  clientId?: string;
  signal?: AbortSignal;
}): Promise<GeneratedImage[]> {
  const prefix = `${safePrefix(opts.prefix)}-`;
  const expectedCount = Math.max(1, opts.expectedCount ?? 1);
  const startedAt = opts.startedAt - 5000;

  for (let attempt = 0; attempt < RECOVERY_POLL_ATTEMPTS; attempt++) {
    if (opts.signal?.aborted) throw opts.signal.reason;

    const query = opts.clientId
      ? `?clientId=${encodeURIComponent(opts.clientId)}`
      : "";
    const res = await fetch(`/api/saved-images${query}`, {
      method: "GET",
      cache: "no-store",
      signal: opts.signal,
    });
    if (res.ok) {
      const data = (await res.json()) as { items?: StoredImageResponseItem[] };
      const images = (data.items ?? [])
        .filter((item) => item.name.startsWith(prefix))
        .filter((item) => (item.mtime ?? 0) >= startedAt)
        .slice(0, expectedCount)
        .map((item) => ({
          url: item.url || item.path || "",
          downloadUrl: item.downloadUrl,
          pathname: item.pathname,
          name: item.name,
          size: item.size,
          createdAt: item.mtime,
        }))
        .filter((item) => item.url);

      if (images.length >= expectedCount) return images;
    }

    await sleep(RECOVERY_POLL_INTERVAL_MS);
  }

  return [];
}

async function fetchJsonWithRecovery(opts: {
  url: string;
  init: RequestInit;
  prefix?: string;
  expectedCount?: number;
  clientId?: string;
  signal?: AbortSignal;
}): Promise<GenerateResponse> {
  const startedAt = Date.now();
  const recovery = recoverSavedImages({
    prefix: opts.prefix,
    startedAt,
    expectedCount: opts.expectedCount,
    clientId: opts.clientId,
    signal: opts.signal,
  });

  const direct = (async () => {
    const res = await fetch(opts.url, {
      ...opts.init,
      signal: opts.signal,
    });
    if (!res.ok) throw new ApiRequestError(await parseErr(res), res.status);
    return res.json() as Promise<GenerateResponse>;
  })();

  try {
    return await Promise.race([
      direct,
      recovery.then((images) =>
        images.length > 0
          ? ({
              images,
              elapsedMs: Date.now() - startedAt,
            } satisfies GenerateResponse)
          : never<GenerateResponse>(),
      ),
    ]);
  } catch (error) {
    if (isAbortError(error)) throw error;
    if (!isRecoverableRequestError(error)) {
      await sleep(DIRECT_REQUEST_GRACE_MS);
      const images = await recovery.catch(() => []);
      if (images.length === 0) throw error;

      return {
        images,
        elapsedMs: Date.now() - startedAt,
      };
    }

    const images = await recovery;
    if (images.length === 0) throw error;

    return {
      images,
      elapsedMs: Date.now() - startedAt,
    };
  }
}

function never<T>() {
  return new Promise<T>(() => {});
}

export async function apiGenerate(
  body: GenerateRequest,
  signal?: AbortSignal,
): Promise<GenerateResponse> {
  const requestPrefix = uniqueRequestPrefix(body.prefix);
  const clientId = getClientId();
  return fetchJsonWithRecovery({
    url: "/api/generate",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, prefix: requestPrefix, clientId }),
    },
    prefix: requestPrefix,
    expectedCount: body.n,
    clientId,
    signal,
  });
}

export function resultGalleryImages(images: GeneratedImage[]) {
  return images.map((img) => ({
    url: img.url,
    downloadUrl: img.downloadUrl,
    name: img.name,
    mimeType: img.mimeType,
  }));
}

export async function apiEdit(
  req: EditRequest,
  signal?: AbortSignal,
): Promise<GenerateResponse> {
  const requestPrefix = uniqueRequestPrefix(req.prefix);
  const clientId = getClientId();
  const fd = new FormData();
  fd.set("apiKey", req.apiKey);
  fd.set("baseUrl", req.baseUrl);
  fd.set("model", req.model);
  fd.set("prompt", req.prompt);
  if (req.n != null) fd.set("n", String(req.n));
  if (req.size) fd.set("size", req.size);
  if (req.quality) fd.set("quality", req.quality);
  fd.set("prefix", requestPrefix);
  fd.set("clientId", clientId);
  for (const [i, img] of req.images.entries()) {
    fd.append("image", img, img.name || `ref${i}.png`);
  }
  if (req.mask && req.mask.size > 0) {
    fd.set("mask", req.mask, req.mask.name || "mask.png");
  }
  return fetchJsonWithRecovery({
    url: "/api/edit",
    init: {
      method: "POST",
      body: fd,
    },
    prefix: requestPrefix,
    expectedCount: req.n,
    clientId,
    signal,
  });
}

function uniqueRequestPrefix(prefix?: string) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${safePrefix(prefix)}-${Date.now().toString(36)}-${rand}`;
}

export function imagesToHistoryRefs(images: GeneratedImage[]) {
  return images.map((img) => ({
    path: img.url,
    name: img.name,
    downloadUrl: img.downloadUrl,
    size: img.size,
  }));
}

export async function apiParseFile(
  file: File,
  signal?: AbortSignal,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/parse-file", {
    method: "POST",
    body: fd,
    signal,
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const { text } = await res.json();
  return text as string;
}
