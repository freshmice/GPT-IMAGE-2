export const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_DEFAULT_BASE_URL ?? "https://www.packyapi.com/v1";
export const DEFAULT_MODEL =
  process.env.NEXT_PUBLIC_DEFAULT_MODEL ?? "gpt-image-2";

export const MODELS = ["gpt-image-2", "gpt-image-1"] as const;

export const SIZES_GENERATE = [
  "auto",
  "1024x1024",
  "1536x1024",
  "1024x1536",
  "2048x2048",
  "2048x1152",
  "3840x2160",
  "2160x3840",
] as const;

export const SIZES_EDIT = [
  "auto",
  "1024x1024",
  "1536x1024",
  "1024x1536",
] as const;

export const QUALITIES = ["auto", "low", "medium", "high"] as const;
export const OUTPUT_FORMATS = ["png", "jpeg", "webp"] as const;
export const BACKGROUNDS = ["auto", "transparent", "opaque"] as const;

export const MAX_UPLOAD_BYTES = 3_000_000;
export const MAX_UPLOAD_EDGE = 1536;
export const MAX_REFS = 5;

export const HISTORY_LIMIT = 30;
