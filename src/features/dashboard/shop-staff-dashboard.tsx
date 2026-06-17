"use client";

import { Package, MessageSquare } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlatformStore } from "@/stores/platform-store";
import { formatGhs, formatDate } from "@/lib/format";

export function ShopStaffDashboard() {
  const orders = usePlatformStore((s) => s.orders);
  const assigned = orders.filter((o) =>
    ["accepted", "processing"].includes(o.status)
  ).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-mtn/20 bg-mtn/5 p-6">
        <p className="text-sm text-muted-foreground">Staff view — limited access</p>
        <h1 className="font-display text-2xl font-bold">Fulfillment Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Process assigned orders and chat with customers. No wallet or settings access.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Assigned" value="8" icon={Package} accent="mtn" />
        <StatCard title="Processing" value="3" icon={Package} accent="telecel" />
        <StatCard title="Messages" value="5" icon={MessageSquare} accent="brand" />
      </div>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader>
          <CardTitle className="text-base">Assigned Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assigned.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/50 p-4"
            >
              <div>
                <p className="font-medium">{o.id}</p>
                <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
              </div>
              <Badge className="capitalize">{o.status}</Badge>
              <p className="font-semibold text-mtn">{formatGhs(o.amountGhs)}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="brand">Process</Button>
                <Button size="sm" variant="outline">Chat</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
