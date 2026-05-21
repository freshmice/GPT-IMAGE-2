"use client";

import * as React from "react";
import { Download, ZoomIn, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GalleryImage {
  url: string;
  downloadUrl?: string;
  name?: string;
  mimeType?: string;
}

interface Props {
  images: GalleryImage[];
  className?: string;
}

export function ResultGallery({ images, className }: Props) {
  const [lightbox, setLightbox] = React.useState<number | null>(null);

  if (images.length === 0) return null;

  function downloadHref(img: GalleryImage) {
    return img.downloadUrl || img.url;
  }

  function filename(img: GalleryImage, idx: number) {
    const ext = (img.mimeType ?? "image/png").split("/")[1] ?? "png";
    return img.name || `result-${idx + 1}.${ext}`;
  }

  return (
    <>
      <div
        className={cn(
          "grid gap-3",
          images.length === 1
            ? "grid-cols-1"
            : images.length === 2
              ? "grid-cols-2"
              : images.length <= 4
                ? "grid-cols-2 sm:grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3",
          className,
        )}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-xl border bg-checker aspect-square"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={`result ${idx + 1}`}
              className="h-full w-full object-contain"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => setLightbox(idx)}
                aria-label="预览"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <a
                href={downloadHref(img)}
                download={filename(img, idx)}
                onClick={(e) => e.stopPropagation()}
                className={buttonVariants({
                  size: "icon",
                  variant: "secondary",
                  className: "h-8 w-8",
                })}
                aria-label="下载"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-4 top-4 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="关闭预览"
          >
            <X className="h-5 w-5" />
          </Button>
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightbox].url}
              alt="preview"
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
            />
            <div className="mt-3 flex justify-center">
              <a
                href={downloadHref(images[lightbox])}
                download={filename(images[lightbox], lightbox)}
                className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80"
              >
                <Download className="mr-2 h-4 w-4" />
                下载
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
