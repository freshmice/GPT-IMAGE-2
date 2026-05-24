"use client";

import * as React from "react";
import { CheckCircle2, Download, ImageIcon, Loader2, ZoomIn, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface GalleryImage {
  url: string;
  downloadUrl?: string;
  name?: string;
  mimeType?: string;
}

interface Props {
  images: GalleryImage[];
  loading?: boolean;
  expectedCount?: number;
  title?: string;
  status?: string;
  className?: string;
}

export function ResultGallery({
  images,
  loading,
  expectedCount = 1,
  title = "生成结果",
  status,
  className,
}: Props) {
  const [lightbox, setLightbox] = React.useState<number | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (loading) {
      window.setTimeout(() => {
        panelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 80);
    }
  }, [loading]);

  if (images.length === 0 && !loading) return null;

  function downloadHref(img: GalleryImage) {
    return img.downloadUrl || img.url;
  }

  function filename(img: GalleryImage, idx: number) {
    const ext = (img.mimeType ?? "image/png").split("/")[1] ?? "png";
    return img.name || `result-${idx + 1}.${ext}`;
  }

  const placeholderCount = Math.max(1, Math.min(expectedCount, 4));

  return (
    <>
      <Card ref={panelRef} className={className}>
        <CardContent className="space-y-3 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )}
              <div>
                <h2 className="text-sm font-medium leading-none">{title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {status ??
                    (loading
                      ? "正在生成，完成后会自动显示在这里"
                      : `已生成 ${images.length} 张图片`)}
                </p>
              </div>
            </div>
            {loading && images.length === 0 && (
              <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                请保持页面打开
              </span>
            )}
          </div>

          {loading && images.length === 0 ? (
            <div
              className={cn(
                "grid gap-3",
                placeholderCount === 1
                  ? "grid-cols-1"
                  : placeholderCount === 2
                    ? "grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-3",
              )}
            >
              {Array.from({ length: placeholderCount }).map((_, idx) => (
                <div
                  key={idx}
                  className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-checker"
                >
                  <Skeleton className="absolute inset-0 h-full w-full rounded-none opacity-70" />
                  <div className="relative flex flex-col items-center gap-2 text-xs text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-40" />
                    <span>等待图片返回</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
              )}
            >
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-checker"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`result ${idx + 1}`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
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
          )}
        </CardContent>
      </Card>

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
