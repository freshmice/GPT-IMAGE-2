"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from "@/lib/constants";
import type { Credentials } from "@/lib/types";

interface CredentialsState extends Credentials {
  setCredentials: (c: Partial<Credentials>) => void;
  reset: () => void;
}

export const useCredentialsStore = create<CredentialsState>()(
  persist(
    (set) => ({
      apiKey: "",
      baseUrl: DEFAULT_BASE_URL,
      model: DEFAULT_MODEL,
      setCredentials: (c) => set((s) => ({ ...s, ...c })),
      reset: () =>
        set({ apiKey: "", baseUrl: DEFAULT_BASE_URL, model: DEFAULT_MODEL }),
    }),
    {
      name: "gpt-image-credentials",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
