"use client";

import imageCompression from "browser-image-compression";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_EDGE } from "@/lib/constants";

const UPLOAD_FORMATS = [
  { mimeType: "image/png", extension: "png", initialQuality: 1 },
  { mimeType: "image/webp", extension: "webp", initialQuality: 0.86 },
  { mimeType: "image/jpeg", extension: "jpg", initialQuality: 0.86 },
] as const;

/**
 * Compresses uploads so multipart edit requests stay under Vercel's body limit.
 * PNG is preferred, with WebP/JPEG fallbacks for detailed images that need more compression.
 */
export async function compressForUpload(
  file: File,
  maxBytes = MAX_UPLOAD_BYTES,
): Promise<File> {
  const targetBytes = Math.min(maxBytes, MAX_UPLOAD_BYTES);
  let smallest: File | undefined;

  for (const format of UPLOAD_FORMATS) {
    const compressed = await compressWithFormat(file, targetBytes, format);
    if (compressed.size <= targetBytes) return compressed;
    if (!smallest || compressed.size < smallest.size) smallest = compressed;
  }

  throw new Error(
    `图片过大，无法压缩到 ${formatBytes(targetBytes)}，请先裁剪或减少参考图数量。`,
  );
}

export const compressToPng = compressForUpload;

async function compressWithFormat(
  file: File,
  maxBytes: number,
  format: (typeof UPLOAD_FORMATS)[number],
) {
  let current: File | undefined;

  for (let i = 0; i < 9; i++) {
    const edge = Math.max(
      320,
      Math.floor(MAX_UPLOAD_EDGE * Math.pow(0.82, i)),
    );
    const blob = await imageCompression(file, {
      maxSizeMB: maxBytes / 1_048_576,
      maxWidthOrHeight: edge,
      useWebWorker: true,
      fileType: format.mimeType,
      initialQuality: format.initialQuality,
    });
    current = toImageFile(blob, file.name, format.extension, format.mimeType);
    if (current.size <= maxBytes) return current;
  }

  return current ?? file;
}

function toImageFile(
  blob: Blob,
  originalName: string,
  extension: string,
  mimeType: string,
): File {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.${extension}`, { type: mimeType });
}

function formatBytes(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
