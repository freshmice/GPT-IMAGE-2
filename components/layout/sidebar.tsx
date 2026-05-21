"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV, NAV_GROUPS } from "./nav-config";

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-col gap-6 overflow-y-auto scrollbar-thin px-3 py-4",
        className,
      )}
    >
      {NAV_GROUPS.map((g) => (
        <div key={g} className="space-y-1">
          <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {g}
          </div>
          {NAV.filter((i) => i.group === g).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
