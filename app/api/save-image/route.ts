import { NextResponse } from "next/server";
import { storeImage } from "@/lib/image-storage";

export const runtime = "nodejs";

const MAX_SAVED_IMAGE_BYTES = 4_000_000;
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function safePrefix(prefix?: string) {
  return (prefix ?? "")
    .trim()
    .replace(/[^a-z0-9_-]/gi, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export async function POST(req: Request) {
  const { b64, mimeType, prefix, clientId } = (await req.json()) as {
    b64: string;
    mimeType?: string;
    prefix?: string;
    clientId?: string;
  };

  if (!b64) return NextResponse.json({ error: "Missing b64" }, { status: 400 });

  const imageMimeType = mimeType ?? "image/png";
  if (!ALLOWED_MIME_TYPES.has(imageMimeType)) {
    return NextResponse.json(
      { error: "Only png/jpeg/webp images are supported" },
      { status: 400 },
    );
  }

  if (b64.length > Math.ceil((MAX_SAVED_IMAGE_BYTES * 4) / 3) + 128) {
    return NextResponse.json(
      { error: "Image is too large to save" },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(b64, "base64");
  if (bytes.length > MAX_SAVED_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image is too large to save" },
      { status: 413 },
    );
  }

  try {
    const image = await storeImage(
      { bytes, mimeType: imageMimeType },
      safePrefix(prefix) || "saved",
      clientId,
    );
    return NextResponse.json({
      path: image.url,
      url: image.url,
      downloadUrl: image.downloadUrl,
      pathname: image.pathname,
      name: image.name,
      size: image.size,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save image" },
      { status: 500 },
    );
  }
}
