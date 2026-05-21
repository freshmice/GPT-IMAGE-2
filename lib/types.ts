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
}

export interface EditRequest extends Credentials {
  prompt: string;
  images: File[];
  mask?: File;
  n?: number;
  size?: Size;
  quality?: string;
}

export interface GeneratedImage {
  b64_json: string;
  mimeType?: string;
}

export interface GenerateResponse {
  images: GeneratedImage[];
  elapsedMs: number;
}

export interface ApiErrorResponse {
  error: string;
}

export interface HistoryImageRef {
  path: string;   // /outputs/xxx.png — served from public/
  name: string;
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
