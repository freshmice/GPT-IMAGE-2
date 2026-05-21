import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

const OUTPUT_DIR = join(process.cwd(), "public", "outputs");

export async function GET() {
  try {
    const files = await readdir(OUTPUT_DIR);
    const items = await Promise.all(
      files
        .filter((f) => !f.startsWith("."))
        .map(async (name) => {
          const s = await stat(join(OUTPUT_DIR, name));
          return { name, path: `/outputs/${name}`, size: s.size, mtime: s.mtimeMs };
        }),
    );
    items.sort((a, b) => b.mtime - a.mtime);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function DELETE(req: Request) {
  const { name } = (await req.json()) as { name: string };
  if (!name || name.includes("..") || name.includes("/"))
    return NextResponse.json({ error: "非法文件名" }, { status: 400 });

  const { unlink } = await import("fs/promises");
  try {
    await unlink(join(OUTPUT_DIR, name));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "删除失败" },
      { status: 500 },
    );
  }
}
