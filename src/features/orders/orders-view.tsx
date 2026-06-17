"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { formatGhs, formatDate } from "@/lib/format";
import type { Order, OrderStatus, Role } from "@/types/marketplace";
import { CheckCircle2, Circle, Clock, MessageSquare, Star } from "lucide-react";

const statuses: OrderStatus[] = [
  "pending",
  "accepted",
  "processing",
  "completed",
  "cancelled",
  "disputed"
];

function OrderTimeline({ status }: { status: OrderStatus }) {
  const steps: OrderStatus[] = ["pending", "accepted", "processing", "completed"];
  const terminal = status === "cancelled" || status === "disputed";
  const currentIdx = terminal ? -1 : steps.indexOf(status);

  return (
    <div className="mt-4 flex items-center gap-1">
      {steps.map((s, i) => {
        const done = terminal ? false : i <= currentIdx;
        const active = !terminal && i === currentIdx;
        return (
          <div key={s} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                done
                  ? "gradient-mtn text-charcoal"
                  : "border-2 border-muted bg-muted/50"
              } ${active ? "ring-2 ring-mtn/40" : ""}`}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Circle className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <span className="text-[9px] capitalize text-muted-foreground">{s}</span>
          </div>
        );
      })}
    </div>
  );
}

function OrderDetailsBlock({ order }: { order: Order }) {
  const d = order.details;
  if (!d) return null;
  const rows = [
    d.phoneNumber && `Phone: ${d.phoneNumber}`,
    d.network && `Network: ${d.network}`,
    d.meterNumber && `Meter: ${d.meterNumber}`,
    d.accountNumber && `Account: ${d.accountNumber}`,
    d.smartCardNumber && `Smart card: ${d.smartCardNumber}`,
    d.quantity && `Qty: ${d.quantity}`,
    d.notes && `Notes: ${d.notes}`
  ].filter(Boolean);

  if (!rows.length) return null;

  return (
    <div className="mt-3 rounded-2xl bg-muted/50 p-3 text-xs text-muted-foreground">
      {rows.map((row) => (
        <p key={row}>{row}</p>
      ))}
    </div>
  );
}

function OrderActions({
  order,
  role
}: {
  order: Order;
  role: Role;
}) {
  const updateOrderStatus = usePlatformStore((s) => s.updateOrderStatus);
  const promptReview = usePlatformStore((s) => s.promptReview);
  const messagesPath = `/app/${role}/messages?c=${order.conversationId ?? ""}`;

  const act = (status: OrderStatus, label: string) => {
    const result = updateOrderStatus(order.id, status);
    if (!result.ok) toast.error(result.error);
    else toast.success(label);
  };

  if (role === "shop_owner") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {order.status === "pending" && (
          <>
            <Button size="sm" variant="brand" onClick={() => act("accepted", "Order accepted")}>
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => act("cancelled", "Order rejected — customer refunded")}
            >
              Reject
            </Button>
          </>
        )}
        {order.status === "accepted" && (
          <Button size="sm" variant="brand" onClick={() => act("processing", "Order processing")}>
            Mark processing
          </Button>
        )}
        {order.status === "processing" && (
          <Button size="sm" variant="brand" onClick={() => act("completed", "Order completed")}>
            Mark completed
          </Button>
        )}
        {order.conversationId && (
          <Button size="sm" variant="outline" asChild>
            <Link href={messagesPath}>
              <MessageSquare className="mr-1 h-4 w-4" />
              Message customer
            </Link>
          </Button>
        )}
      </div>
    );
  }

  if (role === "customer" && order.conversationId) {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link href={messagesPath}>
            <MessageSquare className="mr-1 h-4 w-4" />
            Message shop
          </Link>
        </Button>
        {order.status === "completed" && !order.reviewSubmitted && (
          <Button
            size="sm"
            variant="brand"
            onClick={() => promptReview(order.id)}
          >
            <Star className="mr-1 h-4 w-4" />
            Rate shop
          </Button>
        )}
      </div>
    );
  }

  return null;
}

export function OrdersView() {
  const params = useParams<{ role: string }>();
  const role = params.role as Role;
  const user = useCurrentUser();
  const orders = usePlatformStore((s) => s.orders);
  const allServices = usePlatformStore((s) => s.services);
  const allShops = usePlatformStore((s) => s.shops);

  let list = orders;
  if (role === "customer" && user) {
    list = orders.filter((o) => o.customerId === user.id);
  } else if (role === "shop_owner" && user?.shopId) {
    list = orders.filter((o) => o.shopId === user.shopId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {role === "shop_owner"
            ? "Review requests, fulfill orders, and message customers"
            : "Track your purchases from pending to completed"}
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          {statuses.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>

        {["all", ...statuses].map((tab) => {
          const filtered =
            tab === "all" ? list : list.filter((o) => o.status === tab);
          return (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
              {filtered.length === 0 ? (
                <Card className="border-0 p-8 text-center text-muted-foreground">
                  No orders in this category
                </Card>
              ) : (
                filtered.map((o) => {
                  const svc = allServices.find((s) => s.id === o.serviceId);
                  const shop = allShops.find((s) => s.id === o.shopId);
                  return (
                    <Card key={o.id} className="border-0 shadow-card dark:shadow-card-dark">
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{svc?.name ?? "Service"}</p>
                            <p className="text-xs text-muted-foreground">
                              {o.id} • {shop?.name} • {formatDate(o.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-lg font-bold text-mtn">
                              {formatGhs(o.amountGhs)}
                            </p>
                            <Badge variant="outline" className="mt-1 capitalize">
                              {o.status}
                            </Badge>
                          </div>
                        </div>

                        <OrderDetailsBlock order={o} />

                        {o.status === "disputed" ? (
                          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-telecel/10 p-3 text-sm text-telecel">
                            <Clock className="h-4 w-4" />
                            Dispute opened — under review
                          </div>
                        ) : o.status === "cancelled" ? (
                          <div className="mt-4 rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
                            Order cancelled — refund issued to customer wallet
                          </div>
                        ) : (
                          <OrderTimeline status={o.status} />
                        )}

                        <OrderActions order={o} role={role} />
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
