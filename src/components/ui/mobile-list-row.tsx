"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type RowProps = {
  icon: LucideIcon;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  iconClassName?: string;
  iconBgClassName?: string;
  trailing?: React.ReactNode;
  destructive?: boolean;
  className?: string;
};

export function MobileListRow({
  icon: Icon,
  label,
  description,
  href,
  onClick,
  iconClassName,
  iconBgClassName = "bg-mtn/15 text-mtn",
  trailing,
  destructive,
  className
}: RowProps) {
  const content = (
    <>
      <span className={cn("mobile-list-icon", iconBgClassName, iconClassName)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm font-medium", destructive && "text-destructive")}>
          {label}
        </span>
        {description && (
          <span className="block truncate text-xs text-muted-foreground">{description}</span>
        )}
      </span>
      {trailing ?? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />}
    </>
  );

  const rowClass = cn("mobile-list-row", className);

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(rowClass, "w-full")}>
      {content}
    </button>
  );
}

export function MobileListGroup({
  children,
  title,
  className
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {title && (
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      )}
      <div className="mobile-list-group">{children}</div>
    </div>
  );
}
