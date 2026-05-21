import { normalizeUpstreamError } from "@/lib/errors";
import type { GeneratedImage } from "@/lib/types";

export interface UpstreamImage {
  b64_json?: string;
  url?: string;
}

/** 调用 /v1/images/generations */
export async function callGenerations(opts: {
  apiKey: string;
  baseUrl: string;
  body: Record<string, unknown>;
}): Promise<{ images: GeneratedImage[]; elapsedMs: number }> {
  const { apiKey, baseUrl, body } = opts;
  const t0 = Date.now();
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await normalizeUpstreamError(res, baseUrl));
  const json = (await res.json()) as { data?: UpstreamImage[] };
  const images = await toGeneratedImages(json.data || []);
  return { images, elapsedMs: Date.now() - t0 };
}

/** 调用 /v1/images/edits —— 传 FormData 透传到上游 */
export async function callEdits(opts: {
  apiKey: string;
  baseUrl: string;
  form: FormData;
}): Promise<{ images: GeneratedImage[]; elapsedMs: number }> {
  const { apiKey, baseUrl, form } = opts;
  const t0 = Date.now();
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/images/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await normalizeUpstreamError(res, baseUrl));
  const json = (await res.json()) as { data?: UpstreamImage[] };
  const images = await toGeneratedImages(json.data || []);
  return { images, elapsedMs: Date.now() - t0 };
}

async function toGeneratedImages(
  items: UpstreamImage[],
): Promise<GeneratedImage[]> {
  const out: GeneratedImage[] = [];
  for (const it of items) {
    if (it.b64_json) {
      out.push({ b64_json: it.b64_json, mimeType: "image/png" });
    } else if (it.url) {
      const r = await fetch(it.url, { cache: "no-store" });
      if (!r.ok) continue;
      const buf = await r.arrayBuffer();
      const mimeType = r.headers.get("content-type") || "image/png";
      out.push({ b64_json: Buffer.from(buf).toString("base64"), mimeType });
    }
  }
  if (out.length === 0) throw new Error("上游未返回可用图像");
  return out;
}
