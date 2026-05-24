import { NextResponse } from "next/server";
import { deleteStoredImage, listStoredImages } from "@/lib/image-storage";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId") ?? undefined;
  try {
    const items = await listStoredImages(clientId);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function DELETE(req: Request) {
  const { name, pathname, url, clientId } = (await req.json()) as {
    name?: string;
    pathname?: string;
    url?: string;
    clientId?: string;
  };
  const target = pathname || url || name;
  if (!target)
    return NextResponse.json({ error: "Invalid image target" }, { status: 400 });

  try {
    await deleteStoredImage(target, clientId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete image" },
      { status: 500 },
    );
  }
}
