"use client";

import * as React from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/studio/page-header";
import { ParamSelect } from "@/components/studio/param-controls";
import { GenerateBar } from "@/components/studio/generate-bar";
import { ResultGallery } from "@/components/studio/result-gallery";
import { MultiImageUpload } from "@/components/studio/multi-image-upload";
import { useCredentialsStore } from "@/lib/store/credentials";
import { useHistoryStore } from "@/lib/store/history";
import { apiEdit, saveImagesForHistory } from "@/lib/fetcher";
import { SIZES_EDIT, QUALITIES } from "@/lib/constants";
import { sceneViewPrompt } from "@/lib/prompts";
import type { GeneratedImage } from "@/lib/types";

export default function SceneViewsPage() {
  const { apiKey, baseUrl, model } = useCredentialsStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const [refs, setRefs] = React.useState<File[]>([]);
  const [description, setDescription] = React.useState("");
  const [size, setSize] = React.useState<string>("1536x1024");
  const [quality, setQuality] = React.useState<string>("auto");
  const [loading, setLoading] = React.useState(false);
  const [elapsedMs, setElapsedMs] = React.useState<number>();
  const [results, setResults] = React.useState<GeneratedImage[]>([]);

  async function handleGenerate() {
    if (!apiKey || !baseUrl || !model) {
      toast.error("请先在右上角配置 API 凭证");
      return;
    }
    if (refs.length === 0) {
      toast.error("请上传至少一张场景参考图");
      return;
    }
    const prompt = sceneViewPrompt(description.trim());
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
      const savedRefs = await saveImagesForHistory(res.images, "scene-views");
      pushHistory({
        type: "scene-views",
        prompt,
        images: savedRefs,
        elapsedMs: res.elapsedMs,
        createdAt: Date.now(),
      });
      toast.success("场景四视图生成完成");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="场景四视图"
        description="基于参考场景图，生成前后左右四个方向的一致性视图"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label>场景参考图（最多 3 张）</Label>
                <MultiImageUpload
                  value={refs}
                  onChange={setRefs}
                  maxFiles={3}
                  label="拖拽或点击上传场景参考图"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">场景补充描述（可选）</Label>
                <Textarea
                  id="desc"
                  placeholder="补充场景细节，如：日式街道、夜晚、霓虹灯…"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                />
              </div>
              <GenerateBar
                loading={loading}
                onGenerate={handleGenerate}
                label="生成四视图"
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
                <p className="font-medium text-foreground">生成说明</p>
                <p>输出为单张宽幅图，包含前、后、左、右四个方向视图，适合场景设计参考。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
