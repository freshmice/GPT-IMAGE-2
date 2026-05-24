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

function safeOwnerId(ownerId?: string) {
  return (ownerId ?? "")
    .trim()
    .replace(/[^a-z0-9_-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function fileName(prefix: string | undefined, mimeType: string) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `${safePrefix(prefix)}-${ts}-${rand}.${extensionForMimeType(mimeType)}`;
}

function storagePrefix(ownerId?: string) {
  const safeOwner = safeOwnerId(ownerId);
  return safeOwner ? `${BLOB_PREFIX}${safeOwner}/` : BLOB_PREFIX;
}

function localOutputDir(ownerId?: string) {
  const safeOwner = safeOwnerId(ownerId);
  return safeOwner ? join(OUTPUT_DIR, safeOwner) : OUTPUT_DIR;
}

function localPublicPath(name: string, ownerId?: string) {
  const safeOwner = safeOwnerId(ownerId);
  return safeOwner ? `/outputs/${safeOwner}/${name}` : `/outputs/${name}`;
}

export async function storeImage(
  image: ImageToStore,
  prefix?: string,
  ownerId?: string,
): Promise<GeneratedImage> {
  const name = fileName(prefix, image.mimeType);

  if (canUseBlob()) {
    const pathname = `${storagePrefix(ownerId)}${name}`;
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

  const outputDir = localOutputDir(ownerId);
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, name), image.bytes);
  return {
    url: localPublicPath(name, ownerId),
    downloadUrl: localPublicPath(name, ownerId),
    pathname: localPublicPath(name, ownerId),
    name,
    mimeType: image.mimeType,
    size: image.bytes.length,
    createdAt: Date.now(),
  };
}

export async function listStoredImages(ownerId?: string): Promise<StoredImage[]> {
  const prefix = storagePrefix(ownerId);
  if (canUseBlob()) {
    const blobs = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, limit: 1000, cursor });
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
    const outputDir = localOutputDir(ownerId);
    const files = await readdir(outputDir);
    const items = await Promise.all(
      files
        .filter((name) => !name.startsWith("."))
        .map(async (name) => {
          const s = await stat(join(outputDir, name));
          const path = localPublicPath(name, ownerId);
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

export async function deleteStoredImage(target: string, ownerId?: string) {
  const trimmed = target.trim();
  if (!trimmed || trimmed.includes("..")) {
    throw new Error("Invalid image target");
  }

  if (canUseBlob()) {
    await del(blobTarget(trimmed, ownerId));
    return;
  }

  await unlink(join(localOutputDir(ownerId), localFileName(trimmed, ownerId)));
}

function blobTarget(target: string, ownerId?: string) {
  let pathname = target;
  if (/^https?:\/\//i.test(target)) {
    pathname = new URL(target).pathname;
  }

  const normalized = pathname.replace(/^\/+/, "");
  const prefix = storagePrefix(ownerId);
  if (normalized.startsWith(prefix)) return normalized;
  return `${prefix}${normalized.replace(/^outputs\/[^/]+\//, "")}`;
}

function localFileName(target: string, ownerId?: string) {
  let pathname = target;
  if (/^https?:\/\//i.test(target)) {
    pathname = new URL(target).pathname;
  }

  const normalized = pathname.replace(/\\/g, "/").replace(/^\/+/, "");
  const prefix = storagePrefix(ownerId);
  const name = normalized.startsWith(prefix)
    ? normalized.slice(prefix.length)
    : normalized.startsWith(BLOB_PREFIX)
      ? normalized.slice(BLOB_PREFIX.length).split("/").pop() || ""
    : normalized;

  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
    throw new Error("Invalid image target");
  }
  return name;
}
