import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

const OUTPUT_DIR = join(process.cwd(), "public", "outputs");
const MAX_SAVED_IMAGE_BYTES = 4_000_000;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function safePrefix(prefix?: string) {
  return (prefix ?? "")
    .trim()
    .replace(/[^a-z0-9_-]/gi, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export async function POST(req: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "Vercel 部署不支持写入 public/outputs，请改用 Vercel Blob" },
      { status: 501 },
    );
  }

  const { b64, mimeType, prefix } = (await req.json()) as {
    b64: string;
    mimeType?: string;
    prefix?: string;
  };

  if (!b64) return NextResponse.json({ error: "缺少 b64" }, { status: 400 });

  const ext = MIME_EXTENSIONS[mimeType ?? "image/png"];
  if (!ext)
    return NextResponse.json({ error: "仅支持 png/jpeg/webp" }, { status: 400 });

  if (b64.length > Math.ceil((MAX_SAVED_IMAGE_BYTES * 4) / 3) + 128) {
    return NextResponse.json({ error: "图片过大，无法保存" }, { status: 413 });
  }

  const bytes = Buffer.from(b64, "base64");
  if (bytes.length > MAX_SAVED_IMAGE_BYTES) {
    return NextResponse.json({ error: "图片过大，无法保存" }, { status: 413 });
  }

  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  const cleanPrefix = safePrefix(prefix);
  const name = `${cleanPrefix ? cleanPrefix + "-" : ""}${ts}-${rand}.${ext}`;

  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(join(OUTPUT_DIR, name), bytes);
    return NextResponse.json({ path: `/outputs/${name}`, name });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 500 },
    );
  }
}
