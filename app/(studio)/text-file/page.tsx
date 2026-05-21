"use client";

import * as React from "react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { FileText, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/studio/page-header";
import { ParamSelect, ParamSlider } from "@/components/studio/param-controls";
import { GenerateBar } from "@/components/studio/generate-bar";
import { ResultGallery } from "@/components/studio/result-gallery";
import { useCredentialsStore } from "@/lib/store/credentials";
import { useHistoryStore } from "@/lib/store/history";
import { apiGenerate, apiParseFile, saveImagesForHistory } from "@/lib/fetcher";
import { SIZES_GENERATE, QUALITIES } from "@/lib/constants";
import type { GeneratedImage } from "@/lib/types";

export default function TextFilePage() {
  const { apiKey, baseUrl, model } = useCredentialsStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const [fileText, setFileText] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [extraPrompt, setExtraPrompt] = React.useState("");
  const [size, setSize] = React.useState<string>("1024x1024");
  const [quality, setQuality] = React.useState<string>("auto");
  const [n, setN] = React.useState(1);
  const [parsing, setParsing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [elapsedMs, setElapsedMs] = React.useState<number>();
  const [results, setResults] = React.useState<GeneratedImage[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/plain": [".txt", ".md"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    onDrop: async ([file]) => {
      if (!file) return;
      setParsing(true);
      try {
        const text = await apiParseFile(file);
        setFileText(text);
        setFileName(file.name);
        toast.success(`已解析 ${file.name}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "解析失败");
      } finally {
        setParsing(false);
      }
    },
  });

  const finalPrompt = [fileText.trim(), extraPrompt.trim()]
    .filter(Boolean)
    .join("\n\n");

  async function handleGenerate() {
    if (!apiKey || !baseUrl || !model) {
      toast.error("请先在右上角配置 API 凭证");
      return;
    }
    if (!finalPrompt) {
      toast.error("请上传文件或输入提示词");
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const res = await apiGenerate({
        apiKey,
        baseUrl,
        model,
        prompt: finalPrompt,
        n,
        size,
        quality,
      });
      setResults(res.images);
      setElapsedMs(res.elapsedMs);
      const refs = await saveImagesForHistory(res.images, "txtfile");
      pushHistory({
        type: "generate",
        prompt: finalPrompt,
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
        title="文件生图"
        description="上传 TXT / MD / PDF / DOCX，将文本内容作为提示词生成图像"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label>上传文件</Label>
                {fileName ? (
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{fileName}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setFileName("");
                        setFileText("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors ${
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/40"
                    } ${parsing ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <input {...getInputProps()} />
                    <FileText className="h-8 w-8 opacity-50" />
                    <span>{parsing ? "解析中…" : "拖拽或点击上传文件"}</span>
                    <span className="text-xs opacity-60">
                      支持 TXT / MD / PDF / DOCX
                    </span>
                  </div>
                )}
              </div>

              {fileText && (
                <div className="space-y-1.5">
                  <Label>文件内容预览</Label>
                  <Textarea
                    value={fileText}
                    onChange={(e) => setFileText(e.target.value)}
                    rows={6}
                    className="resize-none font-mono text-xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="extra">附加提示词（可选）</Label>
                <Textarea
                  id="extra"
                  placeholder="在文件内容基础上追加额外描述…"
                  rows={3}
                  value={extraPrompt}
                  onChange={(e) => setExtraPrompt(e.target.value)}
                  className="resize-none"
                />
              </div>

              <GenerateBar
                loading={loading}
                onGenerate={handleGenerate}
                elapsedMs={elapsedMs}
                disabled={!finalPrompt}
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
