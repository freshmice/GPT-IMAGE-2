import type {
  GenerateRequest,
  EditRequest,
  GenerateResponse,
  GeneratedImage,
  ApiErrorResponse,
} from "@/lib/types";

async function parseErr(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as ApiErrorResponse;
    return j.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function apiGenerate(
  body: GenerateRequest,
  signal?: AbortSignal,
): Promise<GenerateResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(await parseErr(res));
  return res.json();
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
  const fd = new FormData();
  fd.set("apiKey", req.apiKey);
  fd.set("baseUrl", req.baseUrl);
  fd.set("model", req.model);
  fd.set("prompt", req.prompt);
  if (req.n != null) fd.set("n", String(req.n));
  if (req.size) fd.set("size", req.size);
  if (req.quality) fd.set("quality", req.quality);
  if (req.prefix) fd.set("prefix", req.prefix);
  for (const [i, img] of req.images.entries()) {
    fd.append("image", img, img.name || `ref${i}.png`);
  }
  if (req.mask && req.mask.size > 0) {
    fd.set("mask", req.mask, req.mask.name || "mask.png");
  }
  const res = await fetch("/api/edit", {
    method: "POST",
    body: fd,
    signal,
  });
  if (!res.ok) throw new Error(await parseErr(res));
  return res.json();
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
