"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export function ParamSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  labelFor,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  labelFor?: (v: T) => string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {labelFor ? labelFor(o) : o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ParamSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 4,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm tabular-nums text-muted-foreground">
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}
