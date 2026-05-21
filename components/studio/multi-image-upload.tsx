"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { X, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressToPng } from "@/lib/image-client";

interface Props {
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  label?: string;
  className?: string;
}

export function MultiImageUpload({
  value,
  onChange,
  maxFiles = 10,
  label = "拖拽或点击上传图片",
  className,
}: Props) {
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [compressing, setCompressing] = React.useState(false);

  React.useEffect(() => {
    const urls = value.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [value]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles,
    onDrop: async (accepted) => {
      if (accepted.length === 0) return;
      setCompressing(true);
      try {
        const compressed = await Promise.all(
          accepted.map((f) => compressToPng(f)),
        );
        onChange([...value, ...compressed].slice(0, maxFiles));
      } finally {
        setCompressing(false);
      }
    },
  });

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className={cn("space-y-2", className)}>
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/40",
            compressing && "pointer-events-none opacity-60",
          )}
        >
          <input {...getInputProps()} />
          <ImagePlus className="h-8 w-8 opacity-50" />
          <span>{compressing ? "压缩中…" : label}</span>
          <span className="text-xs opacity-60">
            PNG / JPG / WEBP · 自动压缩至 3 MB · 最多 {maxFiles} 张
          </span>
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {previews.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-checker"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`upload ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
