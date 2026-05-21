import { NextResponse } from "next/server";
import { deleteStoredImage, listStoredImages } from "@/lib/image-storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await listStoredImages();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function DELETE(req: Request) {
  const { name, pathname, url } = (await req.json()) as {
    name?: string;
    pathname?: string;
    url?: string;
  };
  const target = pathname || url || name;
  if (!target)
    return NextResponse.json({ error: "Invalid image target" }, { status: 400 });

  try {
    await deleteStoredImage(target);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete image" },
      { status: 500 },
    );
  }
}
