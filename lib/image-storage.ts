import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { del, list, put } from "@vercel/blob";
import type { GeneratedImage } from "@/lib/types";

const OUTPUT_DIR = join(process.cwd(), "public", "outputs");
const BLOB_PREFIX = "outputs/";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export interface ImageToStore {
  bytes: Buffer;
  mimeType: string;
}

export interface StoredImage {
  name: string;
  path: string;
  url: string;
  downloadUrl?: string;
  pathname?: string;
  size: number;
  mtime: number;
  mimeType?: string;
}

function canUseBlob() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );
}

function extensionForMimeType(mimeType: string) {
  return MIME_EXTENSIONS[mimeType] ?? "png";
}

function safePrefix(prefix?: string) {
  return (prefix ?? "image")
    .trim()
    .replace(/[^a-z0-9_-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "image";
}

function fileName(prefix: string | undefined, mimeType: string) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `${safePrefix(prefix)}-${ts}-${rand}.${extensionForMimeType(mimeType)}`;
}

function localPublicPath(name: string) {
  return `/outputs/${name}`;
}

export async function storeImage(
  image: ImageToStore,
  prefix?: string,
): Promise<GeneratedImage> {
  const name = fileName(prefix, image.mimeType);

  if (canUseBlob()) {
    const pathname = `${BLOB_PREFIX}${name}`;
    const blob = await put(pathname, image.bytes, {
      access: "public",
      contentType: image.mimeType,
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
      multipart: image.bytes.length > 4_000_000,
    });
    return {
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      name,
      mimeType: image.mimeType,
      size: image.bytes.length,
      createdAt: Date.now(),
    };
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(join(OUTPUT_DIR, name), image.bytes);
  return {
    url: localPublicPath(name),
    downloadUrl: localPublicPath(name),
    pathname: localPublicPath(name),
    name,
    mimeType: image.mimeType,
    size: image.bytes.length,
    createdAt: Date.now(),
  };
}

export async function listStoredImages(): Promise<StoredImage[]> {
  if (canUseBlob()) {
    const blobs = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: BLOB_PREFIX, limit: 1000, cursor });
      blobs.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    return blobs
      .map((blob) => {
        const name = blob.pathname.split("/").pop() || blob.pathname;
        return {
          name,
          path: blob.url,
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          pathname: blob.pathname,
          size: blob.size,
          mtime: blob.uploadedAt.getTime(),
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
  }

  try {
    const files = await readdir(OUTPUT_DIR);
    const items = await Promise.all(
      files
        .filter((name) => !name.startsWith("."))
        .map(async (name) => {
          const s = await stat(join(OUTPUT_DIR, name));
          const path = localPublicPath(name);
          return {
            name,
            path,
            url: path,
            downloadUrl: path,
            pathname: path,
            size: s.size,
            mtime: s.mtimeMs,
          };
        }),
    );
    return items.sort((a, b) => b.mtime - a.mtime);
  } catch {
    return [];
  }
}

export async function deleteStoredImage(target: string) {
  const trimmed = target.trim();
  if (!trimmed || trimmed.includes("..")) {
    throw new Error("Invalid image target");
  }

  if (canUseBlob()) {
    await del(blobTarget(trimmed));
    return;
  }

  await unlink(join(OUTPUT_DIR, localFileName(trimmed)));
}

function blobTarget(target: string) {
  if (/^https?:\/\//i.test(target)) return target;

  const normalized = target.replace(/^\/+/, "");
  if (normalized.startsWith(BLOB_PREFIX)) return normalized;
  return `${BLOB_PREFIX}${normalized}`;
}

function localFileName(target: string) {
  let pathname = target;
  if (/^https?:\/\//i.test(target)) {
    pathname = new URL(target).pathname;
  }

  const normalized = pathname.replace(/\\/g, "/").replace(/^\/+/, "");
  const name = normalized.startsWith(BLOB_PREFIX)
    ? normalized.slice(BLOB_PREFIX.length)
    : normalized;

  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
    throw new Error("Invalid image target");
  }
  return name;
}
