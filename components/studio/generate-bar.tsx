"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatElapsed } from "@/lib/utils";

interface Props {
  loading: boolean;
  onGenerate: () => void;
  label?: string;
  disabled?: boolean;
  elapsedMs?: number;
  className?: string;
}

export function GenerateBar({
  loading,
  onGenerate,
  label = "生成",
  disabled,
  elapsedMs,
  className,
}: Props) {
  const [elapsed, setElapsed] = React.useState(0);
  const startRef = React.useRef<number | null>(null);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (loading) {
      startRef.current = Date.now();
      const tick = () => {
        setElapsed(Date.now() - (startRef.current ?? Date.now()));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setElapsed(0);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loading]);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Button
        onClick={onGenerate}
        disabled={disabled || loading}
        className="min-w-[120px] gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {loading ? "生成中…" : label}
      </Button>

      {loading && (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatElapsed(elapsed)}
        </span>
      )}

      {!loading && elapsedMs !== undefined && elapsedMs > 0 && (
        <span className="text-sm text-muted-foreground">
          耗时 {formatElapsed(elapsedMs)}
        </span>
      )}
    </div>
  );
}
