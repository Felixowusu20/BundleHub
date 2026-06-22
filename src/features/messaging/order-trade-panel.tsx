"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Package
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlatformStore } from "@/stores/platform-store";
import { formatGhs } from "@/lib/format";
import type { Order, OrderStatus, Role } from "@/types/marketplace";
import { cn } from "@/lib/utils";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Paid" },
  { key: "accepted", label: "Verified" },
  { key: "processing", label: "Sending" },
  { key: "completed", label: "Done" }
];

const STATUS_HINT: Record<OrderStatus, { customer: string; shop: string }> = {
  pending: {
    customer: "Payment done. Send MoMo proof below if needed, then wait for the seller.",
    shop: "Buyer paid from wallet. Check MoMo proof in chat, then verify and fulfill."
  },
  accepted: {
    customer: "Payment verified — seller is fulfilling your order.",
    shop: "Payment confirmed — fulfill the service."
  },
  processing: {
    customer: "Seller is processing — you'll be notified when done.",
    shop: "Complete the order and release to buyer."
  },
  completed: {
    customer: "Order completed. Thank you for trading!",
    shop: "Order released — payout credited to your wallet."
  },
  cancelled: {
    customer: "This order was cancelled.",
    shop: "This order was cancelled."
  },
  disputed: {
    customer: "This order is under dispute.",
    shop: "This order is under dispute."
  }
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "border-mtn/40 bg-mtn/10 text-mtn",
  accepted: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  processing: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "border-muted bg-muted text-muted-foreground",
  disputed: "border-telecel/40 bg-telecel/10 text-telecel"
};

function stepProgress(status: OrderStatus): number {
  if (status === "cancelled" || status === "disputed") return -1;
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

type Props = {
  order: Order;
  serviceName: string;
  role: Role;
  defaultExpanded?: boolean;
};

export function OrderTradePanel({
  order,
  serviceName,
  role,
  defaultExpanded = true
}: Props) {
  const updateOrderStatus = usePlatformStore((s) => s.updateOrderStatus);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const act = async (status: OrderStatus, label: string) => {
    const result = await updateOrderStatus(order.id, status);
    if (!result.ok) toast.error(result.error);
    else {
      if (status === "completed" && role === "shop_owner") {
        toast.success("Delivered! Customer has been notified.");
      } else {
        toast.success(label);
      }
    }
  };

  const currentStep = stepProgress(order.status);
  const terminal = order.status === "cancelled" || order.status === "disputed";
  const hint = STATUS_HINT[order.status][role === "shop_owner" ? "shop" : "customer"];
  const shortId = order.id.replace(/^ord_/, "").slice(0, 12);

  return (
    <div className="shrink-0 border-b bg-card/95 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 sm:px-4"
        aria-expanded={expanded}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mtn/15">
          <Package className="h-4 w-4 text-mtn" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold">{serviceName}</p>
            <Badge
              variant="outline"
              className={cn("h-5 shrink-0 px-2 text-[10px] capitalize", STATUS_BADGE[order.status])}
            >
              {order.status}
            </Badge>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            {shortId}… • {formatGhs(order.amountGhs)}
          </p>
        </div>
        {!terminal && !expanded && (
          <div className="hidden items-center gap-1 sm:flex">
            {STEPS.map((step, i) => (
              <span
                key={step.key}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i < currentStep
                    ? "bg-mtn"
                    : i === currentStep
                      ? "bg-mtn ring-2 ring-mtn/30"
                      : "bg-muted-foreground/25"
                )}
              />
            ))}
          </div>
        )}
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border/60 px-3 pb-3 pt-2.5 sm:px-4 sm:pb-4">
          {!terminal && (
            <div className="flex items-center px-1">
              {STEPS.map((step, i) => {
                const allDone = order.status === "completed";
                const done = allDone || i < currentStep;
                const active = !allDone && i === currentStep;
                const isLast = i === STEPS.length - 1;

                return (
                  <div key={step.key} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                          done
                            ? "border-mtn bg-mtn text-charcoal"
                            : active
                              ? "border-mtn bg-mtn/15 ring-2 ring-mtn/25"
                              : "border-muted-foreground/20 bg-muted/50"
                        )}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        ) : (
                          <Circle
                            className={cn(
                              "h-2.5 w-2.5",
                              active ? "fill-mtn text-mtn" : "fill-muted-foreground/30 text-transparent"
                            )}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium leading-none",
                          active || done ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          "mx-1 mb-5 h-0.5 flex-1 rounded-full",
                          i < currentStep ? "bg-mtn" : "bg-muted-foreground/15"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="rounded-xl bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
            {hint}
          </p>

          {role === "shop_owner" && !terminal && (
            <div className="flex flex-wrap gap-2">
              {order.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    variant="brand"
                    className="h-8 rounded-xl text-xs"
                    onClick={() => act("accepted", "Payment verified")}
                  >
                    Verify payment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-xl text-xs"
                    onClick={() => act("cancelled", "Order cancelled")}
                  >
                    Reject
                  </Button>
                </>
              )}
              {order.status === "accepted" && (
                <Button
                  size="sm"
                  variant="brand"
                  className="h-8 rounded-xl text-xs"
                  onClick={() => act("processing", "Now fulfilling")}
                >
                  Start fulfilling
                </Button>
              )}
              {order.status === "processing" && (
                <Button
                  size="sm"
                  variant="brand"
                  className="h-8 rounded-xl text-xs"
                  onClick={() => act("completed", "Order released to buyer")}
                >
                  Release / Complete
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
