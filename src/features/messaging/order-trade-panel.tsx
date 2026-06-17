"use client";

import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlatformStore } from "@/stores/platform-store";
import { formatGhs } from "@/lib/format";
import type { Order, OrderStatus, Role } from "@/types/marketplace";
import { cn } from "@/lib/utils";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Pay" },
  { key: "accepted", label: "Verify" },
  { key: "processing", label: "Fulfill" },
  { key: "completed", label: "Done" }
];

const STATUS_HINT: Record<OrderStatus, { customer: string; shop: string }> = {
  pending: {
    customer: "Payment sent — seller is verifying your MoMo proof.",
    shop: "Verify MoMo proof, then confirm payment."
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

type Props = {
  order: Order;
  serviceName: string;
  role: Role;
};

export function OrderTradePanel({ order, serviceName, role }: Props) {
  const updateOrderStatus = usePlatformStore((s) => s.updateOrderStatus);

  const act = (status: OrderStatus, label: string) => {
    const result = updateOrderStatus(order.id, status);
    if (!result.ok) toast.error(result.error);
    else {
      if (status === "completed" && role === "shop_owner") {
        toast.success("Delivered! Customer has been notified.");
      } else {
        toast.success(label);
      }
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === order.status);
  const terminal = order.status === "cancelled" || order.status === "disputed";
  const hint = STATUS_HINT[order.status][role === "shop_owner" ? "shop" : "customer"];

  return (
    <div className="border-b bg-muted/30 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{serviceName}</p>
          <p className="text-xs text-muted-foreground">
            {order.id} • {formatGhs(order.amountGhs)}
          </p>
        </div>
        <Badge variant="outline" className="capitalize shrink-0">
          {order.status}
        </Badge>
      </div>

      {!terminal && (
        <div className="mt-3 flex items-center gap-1">
          {STEPS.map((step, i) => {
            const done = i < stepIndex || order.status === "completed";
            const active = i === stepIndex;
            return (
              <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px]",
                    done
                      ? "bg-mtn text-charcoal"
                      : active
                        ? "ring-2 ring-mtn/50 bg-mtn/20"
                        : "bg-muted"
                  )}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
                </div>
                <span className="text-[9px] text-muted-foreground">{step.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>

      {role === "shop_owner" && !terminal && (
        <div className="mt-3 flex flex-wrap gap-2">
          {order.status === "pending" && (
            <>
              <Button size="sm" variant="brand" onClick={() => act("accepted", "Payment verified")}>
                Verify payment
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => act("cancelled", "Order cancelled")}
              >
                Reject
              </Button>
            </>
          )}
          {order.status === "accepted" && (
            <Button size="sm" variant="brand" onClick={() => act("processing", "Now fulfilling")}>
              Start fulfilling
            </Button>
          )}
          {order.status === "processing" && (
            <Button
              size="sm"
              variant="brand"
              onClick={() => act("completed", "Order released to buyer")}
            >
              Release / Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
