"use client";

import * as React from "react";
import Image from "next/image";
import { Download, ZoomIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, downloadDataUrl } from "@/lib/utils";

interface GalleryImage {
  b64: string;
  mimeType?: string;
}

interface Props {
  images: GalleryImage[];
  className?: string;
}

export function ResultGallery({ images, className }: Props) {
  const [lightbox, setLightbox] = React.useState<number | null>(null);

  if (images.length === 0) return null;

  function src(img: GalleryImage) {
    const mime = img.mimeType ?? "image/png";
    return `data:${mime};base64,${img.b64}`;
  }

  function handleDownload(img: GalleryImage, idx: number) {
    const ext = (img.mimeType ?? "image/png").split("/")[1] ?? "png";
    downloadDataUrl(src(img), `result-${idx + 1}.${ext}`);
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
            <Image
              src={src(img)}
              alt={`result ${idx + 1}`}
              fill
              className="object-contain"
              unoptimized
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => setLightbox(idx)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => handleDownload(img, idx)}
              >
                <Download className="h-4 w-4" />
              </Button>
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
          >
            <X className="h-5 w-5" />
          </Button>
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src(images[lightbox])}
              alt="preview"
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
            />
            <div className="mt-3 flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload(images[lightbox], lightbox)}
              >
                <Download className="mr-2 h-4 w-4" />
                下载
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
