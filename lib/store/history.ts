"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { HistoryItem } from "@/lib/types";
import { HISTORY_LIMIT } from "@/lib/constants";

type NewHistoryItem = Omit<HistoryItem, "id">;

interface HistoryState {
  items: HistoryItem[];
  push: (item: NewHistoryItem) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      push: (item) =>
        set((s) => ({
          items: [
            { ...item, id: crypto.randomUUID() },
            ...s.items,
          ].slice(0, HISTORY_LIMIT),
        })),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "gpt-image-history",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
