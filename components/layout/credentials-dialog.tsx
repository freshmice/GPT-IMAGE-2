"use client";

import * as React from "react";
import { useCredentialsStore } from "@/lib/store/credentials";
import { MODELS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function CredentialsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { apiKey, baseUrl, model, setCredentials } = useCredentialsStore();
  const [draft, setDraft] = React.useState({ apiKey, baseUrl, model });

  React.useEffect(() => {
    if (open) setDraft({ apiKey, baseUrl, model });
  }, [open, apiKey, baseUrl, model]);

  const handleSave = () => {
    if (!draft.apiKey.trim()) {
      toast.error("API Key 不能为空");
      return;
    }
    if (!draft.baseUrl.trim().startsWith("http")) {
      toast.error("Base URL 格式不正确");
      return;
    }
    setCredentials({
      apiKey: draft.apiKey.trim(),
      baseUrl: draft.baseUrl.trim().replace(/\/$/, ""),
      model: draft.model,
    });
    toast.success("已保存。Key 仅存浏览器 localStorage");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>凭据设置</DialogTitle>
          <DialogDescription>
            PackyAPI 需使用 <b>sora 分组</b> 的令牌。API Key 仅保存在浏览器。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={draft.apiKey}
              onChange={(e) =>
                setDraft((s) => ({ ...s, apiKey: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={draft.baseUrl}
              placeholder="https://www.packyapi.com/v1"
              onChange={(e) =>
                setDraft((s) => ({ ...s, baseUrl: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Model</Label>
            <Select
              value={draft.model}
              onValueChange={(v) => setDraft((s) => ({ ...s, model: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
