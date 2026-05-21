"use client";

import * as React from "react";
import { Trash2, Download, FolderOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/studio/page-header";
import { prettyBytes } from "@/lib/utils";

interface SavedItem {
  name: string;
  path: string;
  size: number;
  mtime: number;
}

const PREFIX_LABELS: Record<string, string> = {
  "txt2img": "文本生图",
  "edit": "图像编辑",
  "txtfile": "文件生图",
  "character": "角色一致性",
  "scene-views": "场景四视图",
  "storyboard": "漫画分镜",
  "turnaround": "三视图",
  "grid12": "12 宫格",
};

function getPrefix(name: string): string {
  const part = name.split("-")[0];
  return PREFIX_LABELS[part] ?? part;
}

export default function SavedPage() {
  const [items, setItems] = React.useState<SavedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lightbox, setLightbox] = React.useState<SavedItem | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/saved-images");
      const { items } = await res.json();
      setItems(items);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function handleDelete(item: SavedItem) {
    const res = await fetch("/api/saved-images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: item.name }),
    });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.name !== item.name));
      if (lightbox?.name === item.name) setLightbox(null);
      toast.success("已删除");
    } else {
      toast.error("删除失败");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="已保存图片"
          description={`共 ${items.length} 张，保存在服务器 public/outputs/ 目录`}
          className="mb-0"
        />
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <FolderOpen className="mb-4 h-12 w-12 opacity-30" />
          <p>暂无已保存图片</p>
          <p className="mt-1 text-xs opacity-60">生成图片后会自动保存到此处</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.name}
              className="group relative overflow-hidden rounded-xl border bg-checker aspect-square cursor-pointer"
              onClick={() => setLightbox(item)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.path}
                alt={item.name}
                className="h-full w-full object-contain"
                loading="lazy"
              />
              <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-transparent to-transparent">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  <Badge variant="outline" className="text-[10px] bg-black/40 text-white border-white/20 px-1.5 py-0">
                    {getPrefix(item.name)}
                  </Badge>
                  <p className="text-[10px] text-white/70">{prettyBytes(item.size)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.path}
              alt={lightbox.name}
              className="max-h-[80vh] max-w-[85vw] rounded-lg object-contain"
            />
            <div className="flex items-center justify-center gap-2">
              <a
                href={lightbox.path}
                download={lightbox.name}
                className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-secondary/80"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-3.5 w-3.5" />
                下载
              </a>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(lightbox)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
