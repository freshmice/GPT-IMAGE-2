export type Size = string;
export type Quality = "auto" | "low" | "medium" | "high";
export type OutputFormat = "png" | "jpeg" | "webp";
export type Background = "auto" | "transparent" | "opaque";

export interface Credentials {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface GenerateRequest extends Credentials {
  prompt: string;
  n?: number;
  size?: Size;
  quality?: string;
  outputFormat?: OutputFormat;
  background?: Background;
  prefix?: string;
}

export interface EditRequest extends Credentials {
  prompt: string;
  images: File[];
  mask?: File;
  n?: number;
  size?: Size;
  quality?: string;
  prefix?: string;
}

export interface TurnaroundPromptOptions {
  style?: string;
  background?: string;
  shot?: string;
  notes?: string;
}

export interface GeneratedImage {
  url: string;
  downloadUrl?: string;
  pathname?: string;
  name: string;
  mimeType?: string;
  size?: number;
  createdAt?: number;
}

export interface GenerateResponse {
  images: GeneratedImage[];
  elapsedMs: number;
}

export interface ApiErrorResponse {
  error: string;
}

export interface HistoryImageRef {
  path: string;
  name: string;
  downloadUrl?: string;
  size?: number;
}

export interface HistoryItem {
  id: string;
  type:
    | "generate"
    | "edit"
    | "character"
    | "scene-views"
    | "storyboard"
    | "turnaround"
    | "grid12";
  prompt: string;
  images: HistoryImageRef[];
  elapsedMs: number;
  createdAt: number;
}
