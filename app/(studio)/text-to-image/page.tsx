"use client";

import * as React from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/studio/page-header";
import { ParamSelect, ParamSlider } from "@/components/studio/param-controls";
import { GenerateBar } from "@/components/studio/generate-bar";
import { ResultGallery } from "@/components/studio/result-gallery";
import { useCredentialsStore } from "@/lib/store/credentials";
import { useHistoryStore } from "@/lib/store/history";
import { apiGenerate, saveImagesForHistory } from "@/lib/fetcher";
import { SIZES_GENERATE, QUALITIES } from "@/lib/constants";
import type { GeneratedImage } from "@/lib/types";

export default function TextToImagePage() {
  const { apiKey, baseUrl, model } = useCredentialsStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const [prompt, setPrompt] = React.useState("");
  const [size, setSize] = React.useState<string>("1024x1024");
  const [quality, setQuality] = React.useState<string>("auto");
  const [n, setN] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [elapsedMs, setElapsedMs] = React.useState<number>();
  const [images, setImages] = React.useState<GeneratedImage[]>([]);

  async function handleGenerate() {
    if (!apiKey || !baseUrl || !model) {
      toast.error("请先在右上角配置 API 凭证");
      return;
    }
    if (!prompt.trim()) {
      toast.error("请输入提示词");
      return;
    }
    setLoading(true);
    setImages([]);
    try {
      const res = await apiGenerate({
        apiKey,
        baseUrl,
        model,
        prompt: prompt.trim(),
        n,
        size,
        quality,
      });
      setImages(res.images);
      setElapsedMs(res.elapsedMs);
      const refs = await saveImagesForHistory(res.images, "txt2img");
      pushHistory({
        type: "generate",
        prompt: prompt.trim(),
        images: refs,
        elapsedMs: res.elapsedMs,
        createdAt: Date.now(),
      });
      toast.success(`生成完成，共 ${res.images.length} 张`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="文本生图"
        description="输入提示词，使用 gpt-image-2 生成高质量图像"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="prompt">提示词</Label>
                <Textarea
                  id="prompt"
                  placeholder="描述你想要生成的图像内容…"
                  rows={5}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="resize-none"
                />
              </div>
              <GenerateBar
                loading={loading}
                onGenerate={handleGenerate}
                elapsedMs={elapsedMs}
              />
            </CardContent>
          </Card>

          {images.length > 0 && (
            <ResultGallery
              images={images.map((img) => ({
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
                options={SIZES_GENERATE}
              />
              <ParamSelect
                label="质量"
                value={quality}
                onChange={setQuality}
                options={QUALITIES}
              />
              <ParamSlider
                label="生成数量"
                value={n}
                onChange={setN}
                min={1}
                max={4}
                step={1}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
