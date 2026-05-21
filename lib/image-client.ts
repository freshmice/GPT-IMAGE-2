"use client";

import imageCompression from "browser-image-compression";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_EDGE } from "@/lib/constants";

/**
 * 把任意图片压成 ≤3MB 的 PNG。/v1/images/edits 最稳走 PNG。
 * 先统一长边到 1536 再压；PNG 不够就按 0.85 倍逐步缩尺寸。
 */
export async function compressToPng(file: File): Promise<File> {
  const first = await imageCompression(file, {
    maxSizeMB: MAX_UPLOAD_BYTES / 1_048_576,
    maxWidthOrHeight: MAX_UPLOAD_EDGE,
    useWebWorker: true,
    fileType: "image/png",
    initialQuality: 1,
  });

  if (first.size <= MAX_UPLOAD_BYTES) return toPngFile(first, file.name);

  let current: File = first;
  for (let i = 0; i < 6 && current.size > MAX_UPLOAD_BYTES; i++) {
    const edge = Math.max(
      640,
      Math.floor(MAX_UPLOAD_EDGE * Math.pow(0.85, i + 1)),
    );
    current = await imageCompression(current, {
      maxSizeMB: MAX_UPLOAD_BYTES / 1_048_576,
      maxWidthOrHeight: edge,
      useWebWorker: true,
      fileType: "image/png",
    });
  }
  if (current.size > MAX_UPLOAD_BYTES)
    throw new Error("图片过大，无法压到 3MB，请先手动裁剪。");
  return toPngFile(current, file.name);
}

function toPngFile(blob: Blob, originalName: string): File {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.png`, { type: "image/png" });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
