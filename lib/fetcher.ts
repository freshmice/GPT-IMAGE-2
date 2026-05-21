import type {
  GenerateRequest,
  EditRequest,
  GenerateResponse,
  GeneratedImage,
  HistoryImageRef,
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

// Saves images to disk and returns path refs for history storage.
// Falls back to empty array on failure so history still records the prompt.
export async function saveImagesForHistory(
  images: GeneratedImage[],
  prefix?: string,
): Promise<HistoryImageRef[]> {
  const results = await Promise.allSettled(
    images.map((img) =>
      fetch("/api/save-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ b64: img.b64_json, mimeType: img.mimeType, prefix }),
      }).then((r) => r.json() as Promise<{ path: string; name: string }>),
    ),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<{ path: string; name: string }> =>
        r.status === "fulfilled" && !!r.value?.path,
    )
    .map((r) => ({ path: r.value.path, name: r.value.name }));
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
