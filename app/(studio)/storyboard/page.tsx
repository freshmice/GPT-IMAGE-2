"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/studio/page-header";
import { ParamSelect } from "@/components/studio/param-controls";
import { GenerateBar } from "@/components/studio/generate-bar";
import { ResultGallery } from "@/components/studio/result-gallery";
import { MultiImageUpload } from "@/components/studio/multi-image-upload";
import { useCredentialsStore } from "@/lib/store/credentials";
import { useHistoryStore } from "@/lib/store/history";
import { apiEdit, saveImagesForHistory } from "@/lib/fetcher";
import { SIZES_EDIT, QUALITIES } from "@/lib/constants";
import { STORYBOARD_FRAME_TEMPLATE } from "@/lib/prompts";
import type { GeneratedImage } from "@/lib/types";

interface Frame {
  id: string;
  scene: string;
  dialogue: string;
}

function newFrame(): Frame {
  return { id: crypto.randomUUID(), scene: "", dialogue: "" };
}

export default function StoryboardPage() {
  const { apiKey, baseUrl, model } = useCredentialsStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const [refs, setRefs] = React.useState<File[]>([]);
  const [style, setStyle] = React.useState("");
  const [frames, setFrames] = React.useState<Frame[]>([newFrame()]);
  const [size, setSize] = React.useState<string>("1536x1024");
  const [quality, setQuality] = React.useState<string>("auto");
  const [loading, setLoading] = React.useState(false);
  const [elapsedMs, setElapsedMs] = React.useState<number>();
  const [results, setResults] = React.useState<GeneratedImage[]>([]);

  function addFrame() {
    setFrames((f) => [...f, newFrame()]);
  }

  function removeFrame(id: string) {
    setFrames((f) => f.filter((x) => x.id !== id));
  }

  function updateFrame(id: string, key: keyof Frame, val: string) {
    setFrames((f) => f.map((x) => (x.id === id ? { ...x, [key]: val } : x)));
  }

  async function handleGenerate() {
    if (!apiKey || !baseUrl || !model) {
      toast.error("请先在右上角配置 API 凭证");
      return;
    }
    if (refs.length === 0) {
      toast.error("请上传至少一张角色参考图");
      return;
    }
    const validFrames = frames.filter((f) => f.scene.trim());
    if (validFrames.length === 0) {
      toast.error("请至少填写一个分镜场景");
      return;
    }

    const frameDescriptions = validFrames
      .map(
        (f, i) =>
          STORYBOARD_FRAME_TEMPLATE(i + 1, f.scene.trim(), f.dialogue.trim()),
      )
      .join("\n");

    const prompt = [
      style.trim() && `画风：${style.trim()}`,
      `以下是分镜脚本，请按顺序生成连续的漫画分镜画面，保持角色外观一致：`,
      frameDescriptions,
    ]
      .filter(Boolean)
      .join("\n\n");

    setLoading(true);
    setResults([]);
    try {
      const res = await apiEdit({
        apiKey,
        baseUrl,
        model,
        prompt,
        images: refs,
        size,
        quality,
        n: 1,
      });
      setResults(res.images);
      setElapsedMs(res.elapsedMs);
      const savedRefs = await saveImagesForHistory(res.images, "storyboard");
      pushHistory({
        type: "storyboard",
        prompt,
        images: savedRefs,
        elapsedMs: res.elapsedMs,
        createdAt: Date.now(),
      });
      toast.success("分镜生成完成");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="漫画分镜"
        description="上传角色参考图，填写分镜脚本，生成连续漫画分镜"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label>角色参考图（最多 5 张）</Label>
                <MultiImageUpload
                  value={refs}
                  onChange={setRefs}
                  maxFiles={5}
                  label="拖拽或点击上传角色参考图"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="style">画风描述（可选）</Label>
                <Input
                  id="style"
                  placeholder="如：日式漫画、赛博朋克、水彩风…"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>分镜脚本</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addFrame}
                    disabled={frames.length >= 6}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    添加分镜
                  </Button>
                </div>

                <div className="space-y-3">
                  {frames.map((frame, idx) => (
                    <div
                      key={frame.id}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          第 {idx + 1} 格
                        </span>
                        {frames.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFrame(frame.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        placeholder="场景描述，如：角色站在雨中的街道上…"
                        rows={2}
                        value={frame.scene}
                        onChange={(e) =>
                          updateFrame(frame.id, "scene", e.target.value)
                        }
                        className="resize-none text-sm"
                      />
                      <Input
                        placeholder="对话/旁白（可选）"
                        value={frame.dialogue}
                        onChange={(e) =>
                          updateFrame(frame.id, "dialogue", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <GenerateBar
                loading={loading}
                onGenerate={handleGenerate}
                label="生成分镜"
                elapsedMs={elapsedMs}
              />
            </CardContent>
          </Card>

          {results.length > 0 && (
            <ResultGallery
              images={results.map((img) => ({
                b64: img.b64_json,
                mimeType: img.mimeType,
              }))}
            />
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-5">
              <ParamSelect
                label="尺寸"
                value={size}
                onChange={setSize}
                options={SIZES_EDIT}
              />
              <ParamSelect
                label="质量"
                value={quality}
                onChange={setQuality}
                options={QUALITIES}
              />
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">使用提示</p>
                <p>最多支持 6 个分镜格，输出为单张宽幅分镜图。建议使用横版尺寸。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
