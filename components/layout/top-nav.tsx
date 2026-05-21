"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Sparkles, Settings, CircleCheck, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { CredentialsDialog } from "./credentials-dialog";
import { useCredentialsStore } from "@/lib/store/credentials";

export function TopNav() {
  const [open, setOpen] = React.useState(false);
  const [credOpen, setCredOpen] = React.useState(false);
  const { apiKey } = useCredentialsStore();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const connected = Boolean(apiKey);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="菜单"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="px-4 py-3">
              <Link
                href="/text-to-image"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 font-semibold"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                GPT-Image Studio
              </Link>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <Link
          href="/text-to-image"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span>GPT-Image Studio</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {mounted && (
            <Badge
              variant={connected ? "success" : "warning"}
              className="hidden sm:inline-flex"
            >
              {connected ? (
                <>
                  <CircleCheck className="mr-1 h-3 w-3" /> 已连接
                </>
              ) : (
                <>
                  <CircleAlert className="mr-1 h-3 w-3" /> 未配置 Key
                </>
              )}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCredOpen(true)}
            aria-label="凭据设置"
          >
            <Settings className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">凭据</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <CredentialsDialog open={credOpen} onOpenChange={setCredOpen} />
    </header>
  );
}
