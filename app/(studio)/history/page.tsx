"use client";

import * as React from "react";
import Image from "next/image";
import { Trash2, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/studio/page-header";
import { useHistoryStore } from "@/lib/store/history";
import { formatElapsed } from "@/lib/utils";
import type { HistoryItem } from "@/lib/types";

const TYPE_LABELS: Record<HistoryItem["type"], string> = {
  generate: "文本生图",
  edit: "图像编辑",
  character: "角色一致性",
  "scene-views": "场景四视图",
  storyboard: "漫画分镜",
  turnaround: "三视图",
  grid12: "12 宫格",
};

export default function HistoryPage() {
  const { items, remove, clear } = useHistoryStore();

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="历史记录" description="最近 30 条生成记录" />
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Clock className="mb-4 h-12 w-12 opacity-30" />
          <p>暂无历史记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="历史记录"
          description={`共 ${items.length} 条记录，最多保留 30 条`}
          className="mb-0"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={clear}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          清空
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <HistoryCard key={item.id} item={item} onRemove={() => remove(item.id)} />
        ))}
      </div>
    </div>
  );
}

function HistoryCard({
  item,
  onRemove,
}: {
  item: HistoryItem;
  onRemove: () => void;
}) {
  const date = new Date(item.createdAt);
  const dateStr = date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Badge variant="outline" className="shrink-0">
              {TYPE_LABELS[item.type] ?? item.type}
            </Badge>
            <span className="text-xs text-muted-foreground shrink-0">
              {dateStr}
            </span>
            {item.elapsedMs > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">
                · {formatElapsed(item.elapsedMs)}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 break-all">
          {item.prompt}
        </p>

        {item.images.length > 0 && (
          <div
            className={`grid gap-2 ${
              item.images.length === 1
                ? "grid-cols-1 max-w-xs"
                : item.images.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3 sm:grid-cols-4"
            }`}
          >
            {item.images.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-checker"
                >
                  <Image
                    src={img.path}
                    alt={`history ${idx + 1}`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                  <a
                    href={img.path}
                    download={img.name}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-5 w-5 text-white" />
                  </a>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
