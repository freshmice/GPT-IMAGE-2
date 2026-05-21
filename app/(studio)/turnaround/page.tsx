"use client";

import * as React from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/studio/page-header";
import { ParamSelect } from "@/components/studio/param-controls";
import { GenerateBar } from "@/components/studio/generate-bar";
import { ResultGallery } from "@/components/studio/result-gallery";
import { MultiImageUpload } from "@/components/studio/multi-image-upload";
import { useCredentialsStore } from "@/lib/store/credentials";
import { useHistoryStore } from "@/lib/store/history";
import { apiEdit, apiGenerate, saveImagesForHistory } from "@/lib/fetcher";
import { SIZES_EDIT, SIZES_GENERATE, QUALITIES } from "@/lib/constants";
import { TURNAROUND_REF_PROMPT, TURNAROUND_TXT_PROMPT } from "@/lib/prompts";
import type { GeneratedImage } from "@/lib/types";

export default function TurnaroundPage() {
  const { apiKey, baseUrl, model } = useCredentialsStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const [mode, setMode] = React.useState<"ref" | "text">("ref");
  const [refs, setRefs] = React.useState<File[]>([]);
  const [description, setDescription] = React.useState("");
  const [extraDesc, setExtraDesc] = React.useState("");
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

    if (mode === "ref" && refs.length === 0) {
      toast.error("请上传至少一张角色参考图");
      return;
    }
    if (mode === "text" && !description.trim()) {
      toast.error("请输入角色描述");
      return;
    }

    setLoading(true);
    setResults([]);
    try {
      const prompt =
        mode === "ref"
          ? TURNAROUND_REF_PROMPT(extraDesc.trim())
          : TURNAROUND_TXT_PROMPT(description.trim());

      const res =
        mode === "ref"
          ? await apiEdit({ apiKey, baseUrl, model, prompt, images: refs, size, quality, n: 1 })
          : await apiGenerate({ apiKey, baseUrl, model, prompt, n: 1, size, quality });

      setResults(res.images);
      setElapsedMs(res.elapsedMs);
      const savedRefs = await saveImagesForHistory(res.images, "turnaround");
      pushHistory({
        type: "turnaround",
        prompt,
        images: savedRefs,
        elapsedMs: res.elapsedMs,
        createdAt: Date.now(),
      });
      toast.success("三视图生成完成");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  const sizeOptions = mode === "ref" ? SIZES_EDIT : SIZES_GENERATE;

  return (
    <div className="space-y-6">
      <PageHeader
        title="人物三视图"
        description="生成角色正面半身 + 左中右三个全身视图，适合角色设计参考"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <Tabs
                value={mode}
                onValueChange={(v) => setMode(v as "ref" | "text")}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="ref" className="flex-1">
                    参考图生成
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex-1">
                    文字描述生成
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ref" className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label>角色参考图（最多 3 张）</Label>
                    <MultiImageUpload
                      value={refs}
                      onChange={setRefs}
                      maxFiles={3}
                      label="拖拽或点击上传角色参考图"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="extra">补充描述（可选）</Label>
                    <Textarea
                      id="extra"
                      placeholder="补充角色特征，如：蓝色短发、红色战甲…"
                      rows={3}
                      value={extraDesc}
                      onChange={(e) => setExtraDesc(e.target.value)}
                      className="resize-none"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="text" className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="desc">角色描述</Label>
                    <Textarea
                      id="desc"
                      placeholder="详细描述角色外观，如：年轻女性，蓝色短发，穿红色战甲，猫耳，动漫风格…"
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="resize-none"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <GenerateBar
                loading={loading}
                onGenerate={handleGenerate}
                label="生成三视图"
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
                onChange={(v) => setSize(v)}
                options={sizeOptions}
              />
              <ParamSelect
                label="质量"
                value={quality}
                onChange={setQuality}
                options={QUALITIES}
              />
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">排版说明</p>
                <p>左侧 1/3：正面半身特写；右侧 2/3：左、正、右三个全身视图。建议使用横版尺寸。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
