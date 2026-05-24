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
import {
  apiEdit,
  apiGenerate,
  imagesToHistoryRefs,
  resultGalleryImages,
} from "@/lib/fetcher";
import { SIZES_EDIT, SIZES_GENERATE, QUALITIES } from "@/lib/constants";
import { TURNAROUND_REF_PROMPT, TURNAROUND_TXT_PROMPT } from "@/lib/prompts";
import type { GeneratedImage } from "@/lib/types";

const TURNAROUND_STYLES = [
  { label: "写实定妆照", value: "写实影视定妆照，真实布料质感，棚拍产品级光线" },
  { label: "游戏设定稿", value: "高质量游戏角色设定稿，细节清晰，材质可读" },
  { label: "动漫设定稿", value: "精致动漫角色设定稿，线条干净，色彩稳定" },
];

const TURNAROUND_BACKGROUNDS = [
  { label: "纯白棚拍", value: "纯白背景，柔和均匀棚拍光线，轻微接触阴影" },
  { label: "浅灰背景", value: "极浅灰背景，柔和顶光，服装轮廓清楚" },
  { label: "透明感白底", value: "干净白底，高亮但不过曝，适合抠图和设计参考" },
];

const TURNAROUND_SHOTS = [
  { label: "正面半身", value: "左侧肖像必须为正面拍摄，头顶到胸口，脸部居中清晰" },
  { label: "正面上半身", value: "左侧肖像必须为正面拍摄，头顶到腰部，展示更多服装结构" },
  { label: "证件照构图", value: "左侧肖像为证件照式正面构图，表情自然，五官比例准确" },
];

const styleOptions = TURNAROUND_STYLES.map((item) => item.value);
const backgroundOptions = TURNAROUND_BACKGROUNDS.map((item) => item.value);
const shotOptions = TURNAROUND_SHOTS.map((item) => item.value);

function optionLabel(options: { label: string; value: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? value;
}

export default function TurnaroundPage() {
  const { apiKey, baseUrl, model } = useCredentialsStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const [mode, setMode] = React.useState<"ref" | "text">("ref");
  const [refs, setRefs] = React.useState<File[]>([]);
  const [description, setDescription] = React.useState("");
  const [extraDesc, setExtraDesc] = React.useState("");
  const [turnaroundStyle, setTurnaroundStyle] = React.useState(TURNAROUND_STYLES[0].value);
  const [background, setBackground] = React.useState(TURNAROUND_BACKGROUNDS[0].value);
  const [shot, setShot] = React.useState(TURNAROUND_SHOTS[0].value);
  const [size, setSize] = React.useState<string>("1792x1024");
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
          ? TURNAROUND_REF_PROMPT(extraDesc.trim(), {
              style: turnaroundStyle,
              background,
              shot,
            })
          : TURNAROUND_TXT_PROMPT(description.trim(), {
              style: turnaroundStyle,
              background,
              shot,
            });

      const res =
        mode === "ref"
          ? await apiEdit({
              apiKey,
              baseUrl,
              model,
              prompt,
              images: refs,
              size,
              quality,
              n: 1,
              prefix: "turnaround",
            })
          : await apiGenerate({
              apiKey,
              baseUrl,
              model,
              prompt,
              n: 1,
              size,
              quality,
              prefix: "turnaround",
            });

      setResults(res.images);
      setElapsedMs(res.elapsedMs);
      pushHistory({
        type: "turnaround",
        prompt,
        images: imagesToHistoryRefs(res.images),
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
        description="生成左侧正面半身 + 右侧正面、侧面、背面全身的角色设定图"
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
                      placeholder="补充角色特征，如：黑色古装、银色发冠、腰间玉佩、长发束起…"
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

          {(loading || results.length > 0) && (
            <ResultGallery
              images={resultGalleryImages(results)}
              loading={loading}
              expectedCount={1}
              title="三视图结果"
              status={loading ? "正在生成正面半身、正面全身、侧面全身和背面全身" : undefined}
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
              <ParamSelect
                label="风格"
                value={turnaroundStyle}
                onChange={setTurnaroundStyle}
                options={styleOptions}
                labelFor={(v) => optionLabel(TURNAROUND_STYLES, v)}
              />
              <ParamSelect
                label="背景"
                value={background}
                onChange={setBackground}
                options={backgroundOptions}
                labelFor={(v) => optionLabel(TURNAROUND_BACKGROUNDS, v)}
              />
              <ParamSelect
                label="左侧肖像"
                value={shot}
                onChange={setShot}
                options={shotOptions}
                labelFor={(v) => optionLabel(TURNAROUND_SHOTS, v)}
              />
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">排版说明</p>
                <p>左侧：正面半身特写；右侧：正面、侧面、背面三个全身站立视图。建议使用 1792×1024 或 1536×1024。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
