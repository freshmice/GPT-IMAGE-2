import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

async function parseTxt(buf: Buffer) {
  return buf.toString("utf-8");
}

async function parseDocx(buf: Buffer) {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: buf });
  return value;
}

async function parsePdf(buf: Buffer) {
  const pdfParse = (await import("pdf-parse")).default;
  const { text } = await pdfParse(buf);
  return text;
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file)
    return NextResponse.json({ error: "缺少 file 字段" }, { status: 400 });

  const name = (file.name || "").toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  try {
    let text = "";
    if (name.endsWith(".pdf")) text = await parsePdf(buf);
    else if (name.endsWith(".docx")) text = await parseDocx(buf);
    else if (name.endsWith(".txt") || name.endsWith(".md"))
      text = await parseTxt(buf);
    else {
      return NextResponse.json(
        { error: "仅支持 txt/md/pdf/docx" },
        { status: 400 },
      );
    }
    return NextResponse.json({ text: text.trim() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "解析失败" },
      { status: 500 },
    );
  }
}
