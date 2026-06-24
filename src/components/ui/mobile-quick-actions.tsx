"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  accent?: "mtn" | "telecel" | "brand" | "muted";
};

const accentMap = {
  mtn: "bg-mtn/15 text-mtn",
  telecel: "bg-telecel/15 text-telecel",
  brand: "gradient-brand text-white shadow-brand",
  muted: "bg-muted text-muted-foreground"
};

export function MobileQuickActions({
  actions,
  className
}: {
  actions: QuickAction[];
  className?: string;
}) {
  return (
    <div className={cn("mobile-action-scroll", className)}>
      {actions.map((action) => (
        <Link key={action.href} href={action.href} className="mobile-action-chip">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl",
              accentMap[action.accent ?? "mtn"]
            )}
          >
            <action.icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="max-w-[4.5rem] truncate text-center text-[11px] font-semibold">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
