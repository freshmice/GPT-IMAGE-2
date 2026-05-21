"use client";

import * as React from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  TWELVE_GRID_DEFAULT_CELLS,
  twelveGridPrompt,
} from "@/lib/prompts";
import type { GeneratedImage } from "@/lib/types";

export default function Grid12Page() {
  const { apiKey, baseUrl, model } = useCredentialsStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const [mode, setMode] = React.useState<"ref" | "text">("ref");
  const [refs, setRefs] = React.useState<File[]>([]);
  const [description, setDescription] = React.useState("");
  const [cells, setCells] = React.useState<string[]>(
    TWELVE_GRID_DEFAULT_CELLS.slice(),
  );
  const [size, setSize] = React.useState<string>("1024x1024");
  const [quality, setQuality] = React.useState<string>("auto");
  const [loading, setLoading] = React.useState(false);
  const [elapsedMs, setElapsedMs] = React.useState<number>();
  const [results, setResults] = React.useState<GeneratedImage[]>([]);

  function updateCell(idx: number, val: string) {
    setCells((c) => c.map((x, i) => (i === idx ? val : x)));
  }

  function resetCells() {
    setCells(TWELVE_GRID_DEFAULT_CELLS.slice());
  }

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

    const prompt = twelveGridPrompt(
      mode === "text" ? description.trim() : undefined,
      cells,
    );

    setLoading(true);
    setResults([]);
    try {
      let res;
      if (mode === "ref") {
        res = await apiEdit({
          apiKey,
          baseUrl,
          model,
          prompt,
          images: refs,
          size,
          quality,
          n: 1,
        });
      } else {
        res = await apiGenerate({
          apiKey,
          baseUrl,
          model,
          prompt,
          n: 1,
          size,
          quality,
        });
      }
      setResults(res.images);
      setElapsedMs(res.elapsedMs);
      const savedRefs = await saveImagesForHistory(res.images, "grid12");
      pushHistory({
        type: "grid12",
        prompt,
        images: savedRefs,
        elapsedMs: res.elapsedMs,
        createdAt: Date.now(),
      });
      toast.success("12 宫格生成完成");
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
        title="12 宫格"
        description="生成包含 12 个不同姿势/表情/动作的角色表情包宫格图"
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

                <TabsContent value="ref" className="mt-4">
                  <div className="space-y-1.5">
                    <Label>角色参考图（最多 3 张）</Label>
                    <MultiImageUpload
                      value={refs}
                      onChange={setRefs}
                      maxFiles={3}
                      label="拖拽或点击上传角色参考图"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="text" className="mt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="desc">角色描述</Label>
                    <Textarea
                      id="desc"
                      placeholder="详细描述角色外观，如：年轻女性，蓝色短发，穿红色战甲，动漫风格…"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="resize-none"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>宫格内容（12 格）</Label>
                  <Button variant="ghost" size="sm" onClick={resetCells}>
                    重置默认
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {cells.map((cell, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <span className="text-xs text-muted-foreground">
                        {idx + 1}
                      </span>
                      <Input
                        value={cell}
                        onChange={(e) => updateCell(idx, e.target.value)}
                        className="h-8 text-xs"
                        placeholder={`格 ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <GenerateBar
                loading={loading}
                onGenerate={handleGenerate}
                label="生成宫格"
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
                options={sizeOptions}
              />
              <ParamSelect
                label="质量"
                value={quality}
                onChange={setQuality}
                options={QUALITIES}
              />
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">使用提示</p>
                <p>输出为单张 3×4 宫格图，每格展示不同姿势或表情。建议使用方形尺寸。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
