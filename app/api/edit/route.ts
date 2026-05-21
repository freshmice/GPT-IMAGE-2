import { NextResponse } from "next/server";
import { callEdits } from "@/lib/packy-server";
import { requireAllowedImageBaseUrl } from "@/lib/server-security";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const raw = await req.formData().catch(() => null);
  if (!raw)
    return NextResponse.json({ error: "请求不是 multipart" }, { status: 400 });

  const apiKey = String(raw.get("apiKey") ?? "").trim();
  const baseUrl = String(raw.get("baseUrl") ?? "").trim();
  const model = String(raw.get("model") ?? "").trim();
  const prompt = String(raw.get("prompt") ?? "").trim();
  const size = String(raw.get("size") ?? "");
  const quality = String(raw.get("quality") ?? "");
  const n = Number(raw.get("n") ?? 1);

  if (!apiKey) return NextResponse.json({ error: "缺少 apiKey" }, { status: 400 });
  if (!baseUrl) return NextResponse.json({ error: "缺少 baseUrl" }, { status: 400 });
  if (!model) return NextResponse.json({ error: "缺少 model" }, { status: 400 });
  if (!prompt) return NextResponse.json({ error: "缺少 prompt" }, { status: 400 });
  if (!Number.isInteger(n) || n < 1 || n > 10)
    return NextResponse.json({ error: "n 必须是 1-10 的整数" }, { status: 400 });

  let allowedBaseUrl: string;
  try {
    allowedBaseUrl = requireAllowedImageBaseUrl(baseUrl);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Base URL 不可用" },
      { status: 400 },
    );
  }

  const images = raw.getAll("image") as File[];
  const mask = raw.get("mask") as File | null;
  if (images.length === 0)
    return NextResponse.json({ error: "至少需要 1 张参考图" }, { status: 400 });

  const upstream = new FormData();
  upstream.set("model", model);
  upstream.set("prompt", prompt);
  upstream.set("n", String(n));
  upstream.set("response_format", "b64_json");
  if (size && size !== "auto") upstream.set("size", size);
  if (quality && quality !== "auto") upstream.set("quality", quality);

  const field = images.length === 1 ? "image" : "image[]";
  for (const [i, img] of images.entries()) {
    upstream.append(field, img, img.name || `ref${i}.png`);
  }
  if (mask && mask.size > 0) upstream.set("mask", mask, mask.name || "mask.png");

  try {
    const { images: out, elapsedMs } = await callEdits({
      apiKey,
      baseUrl: allowedBaseUrl,
      form: upstream,
    });
    return NextResponse.json({ images: out, elapsedMs });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
