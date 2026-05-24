import { NextResponse } from "next/server";
import { z } from "zod";
import { callGenerations } from "@/lib/packy-server";
import { requireAllowedImageBaseUrl } from "@/lib/server-security";

export const runtime = "nodejs";
export const maxDuration = 300;

const Schema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
  model: z.string().min(1),
  prompt: z.string().min(1),
  n: z.number().int().min(1).max(10).optional(),
  size: z.string().optional(),
  quality: z.enum(["auto", "low", "medium", "high"]).optional(),
  outputFormat: z.enum(["png", "jpeg", "webp"]).optional(),
  background: z.enum(["auto", "transparent", "opaque"]).optional(),
  prefix: z.string().optional(),
  clientId: z.string().optional(),
});

export async function POST(req: Request) {
  let data: z.infer<typeof Schema>;
  try {
    data = Schema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "请求参数错误" },
      { status: 400 },
    );
  }

  let baseUrl: string;
  try {
    baseUrl = requireAllowedImageBaseUrl(data.baseUrl);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Base URL 不可用" },
      { status: 400 },
    );
  }

  const body: Record<string, unknown> = {
    model: data.model,
    prompt: data.prompt,
    n: data.n ?? 1,
    response_format: "b64_json",
  };
  if (data.size && data.size !== "auto") body.size = data.size;
  if (data.quality && data.quality !== "auto") body.quality = data.quality;
  if (data.outputFormat) body.output_format = data.outputFormat;
  if (data.background && data.background !== "auto")
    body.background = data.background;

  try {
    const { images, elapsedMs } = await callGenerations({
      apiKey: data.apiKey,
      baseUrl,
      body,
      prefix: data.prefix,
      ownerId: data.clientId,
    });
    return NextResponse.json({ images, elapsedMs });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
