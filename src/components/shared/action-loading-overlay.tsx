"use client";

import { PageLoader } from "@/components/shared/page-loader";
import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
  label?: string;
  className?: string;
};

/** Covers the current page section while an action runs (add, remove, save, etc.). */
export function ActionLoadingOverlay({
  active,
  label = "Please wait…",
  className
}: Props) {
  if (!active) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[90] flex items-center justify-center bg-background/75 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <PageLoader label={label} fullScreen={false} />
    </div>
  );
}
