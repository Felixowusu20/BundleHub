"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import {
  BarChart3,
  Package,
  Star,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { StarRating } from "@/components/shared/star-rating";
import { TrendChart } from "@/components/shared/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser, useUserShop } from "@/hooks/use-platform";
import { formatGhs, formatPercent } from "@/lib/format";

export function ShopOwnerDashboard() {
  const user = useCurrentUser();
  const shop = useUserShop(user?.id, user?.shopId);
  const orders = usePlatformStore((s) => s.orders);
  const analytics = usePlatformStore((s) => s.analytics);

  if (!user || !shop) {
    return (
      <div className="rounded-3xl border border-telecel/30 bg-telecel/5 p-8 text-center">
        <p className="font-medium">No shop linked to your account.</p>
        <Button className="mt-4" variant="brand" asChild>
          <Link href="/auth/register?type=shop">Register a shop</Link>
        </Button>
      </div>
    );
  }

  const shopOrders = orders.filter((o) => o.shopId === shop.id);
  const pendingOrders = shopOrders.filter((o) => o.status === "pending");
  const revenue = shopOrders.reduce((s, o) => s + o.amountGhs, 0);
  const completed = shopOrders.filter((o) => o.status === "completed").length;
  const completionRate = shopOrders.length
    ? (completed / shopOrders.length) * 100
    : 0;

  const isPending = shop.status === "pending";
  const isSuspended = shop.status === "suspended";

  return (
    <div className="space-y-6">
      {pendingOrders.length > 0 && !isPending && (
        <div className="flex items-start gap-3 rounded-3xl border border-telecel/40 bg-telecel/10 p-5">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-telecel" />
          <div className="flex-1">
            <p className="font-semibold">
              {pendingOrders.length} new order{pendingOrders.length > 1 ? "s" : ""} waiting
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and accept requests, then message customers to fulfill.
            </p>
          </div>
          <Button variant="brand" size="sm" asChild>
            <Link href="/app/shop_owner/orders">View orders</Link>
          </Button>
        </div>
      )}

      {isPending && (
        <div className="flex items-start gap-3 rounded-3xl border border-mtn/40 bg-mtn/10 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-mtn" />
          <div>
            <p className="font-semibold">Awaiting admin approval</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your shop <strong>{shop.name}</strong> is pending review. You can set up
              services, but they won&apos;t appear in the marketplace until approved.
            </p>
          </div>
          <Badge className="ml-auto shrink-0 gradient-mtn text-charcoal">Pending</Badge>
        </div>
      )}

      {isSuspended && (
        <div className="rounded-3xl border border-telecel/40 bg-telecel/10 p-5 text-sm">
          <p className="font-semibold text-telecel">Shop suspended</p>
          <p className="mt-1 text-muted-foreground">
            Contact platform support to restore your shop.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Shop dashboard</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{shop.name}</h1>
          <div className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
            <span>{shop.city}</span>
            <span>•</span>
            <span>Trust {shop.trustScore}/100</span>
            <span>•</span>
            <StarRating rating={shop.rating} size="sm" showValue className="inline-flex" />
            {shop.featured && (
              <>
                <span>•</span>
                <span>Featured</span>
              </>
            )}
          </div>
        </div>
        <Button variant="brand" asChild disabled={isPending}>
          <Link href="/app/shop_owner/services">Manage services</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Revenue" value={formatGhs(revenue)} icon={TrendingUp} accent="mtn" />
        <StatCard title="Wallet" value={formatGhs(user.walletBalanceGhs)} icon={Wallet} accent="brand" />
        <StatCard title="Orders" value={String(shopOrders.length)} icon={Package} accent="telecel" />
        <StatCard
          title="Active"
          value={String(shopOrders.filter((o) => o.status === "processing").length)}
          icon={Package}
          accent="mtn"
        />
        <StatCard
          title="Completion"
          value={formatPercent(completionRate || 94.2)}
          icon={BarChart3}
          accent="brand"
        />
        <StatCard title="Rating" value={String(shop.rating || "—")} icon={Star} accent="telecel" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart
          title="Revenue Trends"
          data={analytics.map((a) => ({ label: a.month.slice(5), value: a.revenueGhs }))}
          color="mtn"
          valuePrefix="GHS "
        />
        <TrendChart
          title="Sales Trends"
          data={analytics.map((a) => ({ label: a.month.slice(5), value: a.orders }))}
          color="telecel"
        />
      </div>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Branches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Accra Branch", "Kumasi Branch", "Takoradi Branch"].map((b, i) => (
            <div key={b} className="flex items-center justify-between rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mtn/15">
                  <Users className="h-5 w-5 text-mtn" />
                </div>
                <div>
                  <p className="text-sm font-medium">{b}</p>
                  <p className="text-xs text-muted-foreground">{3 + i} staff</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-mtn">{formatGhs(4200 + i * 800)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
