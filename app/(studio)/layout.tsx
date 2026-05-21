import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r lg:block">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <Sidebar className="h-full" />
          </div>
        </aside>
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
