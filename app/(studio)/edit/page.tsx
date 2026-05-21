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
import { MultiImageUpload } from "@/components/studio/multi-image-upload";
import { useCredentialsStore } from "@/lib/store/credentials";
import { useHistoryStore } from "@/lib/store/history";
import { apiEdit, saveImagesForHistory } from "@/lib/fetcher";
import { SIZES_EDIT, QUALITIES } from "@/lib/constants";
import type { GeneratedImage } from "@/lib/types";

export default function EditPage() {
  const { apiKey, baseUrl, model } = useCredentialsStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const [prompt, setPrompt] = React.useState("");
  const [images, setImages] = React.useState<File[]>([]);
  const [size, setSize] = React.useState<string>("1024x1024");
  const [quality, setQuality] = React.useState<string>("auto");
  const [n, setN] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [elapsedMs, setElapsedMs] = React.useState<number>();
  const [results, setResults] = React.useState<GeneratedImage[]>([]);

  async function handleGenerate() {
    if (!apiKey || !baseUrl || !model) {
      toast.error("请先在右上角配置 API 凭证");
      return;
    }
    if (!prompt.trim()) {
      toast.error("请输入编辑指令");
      return;
    }
    if (images.length === 0) {
      toast.error("请上传至少一张参考图");
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const res = await apiEdit({
        apiKey,
        baseUrl,
        model,
        prompt: prompt.trim(),
        images,
        size,
        quality,
        n,
      });
      setResults(res.images);
      setElapsedMs(res.elapsedMs);
      const refs = await saveImagesForHistory(res.images, "edit");
      pushHistory({
        type: "edit",
        prompt: prompt.trim(),
        images: refs,
        elapsedMs: res.elapsedMs,
        createdAt: Date.now(),
      });
      toast.success(`编辑完成，共 ${res.images.length} 张`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "编辑失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="图像编辑"
        description="上传参考图，输入编辑指令，让 AI 按要求修改图像"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label>参考图（最多 10 张）</Label>
                <MultiImageUpload
                  value={images}
                  onChange={setImages}
                  maxFiles={10}
                  label="拖拽或点击上传参考图"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prompt">编辑指令</Label>
                <Textarea
                  id="prompt"
                  placeholder="描述你希望如何修改图像…"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="resize-none"
                />
              </div>
              <GenerateBar
                loading={loading}
                onGenerate={handleGenerate}
                label="编辑"
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
