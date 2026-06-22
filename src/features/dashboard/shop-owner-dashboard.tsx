"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import {
  BarChart3,
  Package,
  Star,
  TrendingUp,
  Wallet
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { TrendChart } from "@/components/shared/trend-chart";
import { DashboardWelcome } from "@/components/shared/dashboard-welcome";
import { PageLoader } from "@/components/shared/page-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser, useAuthUser } from "@/hooks/use-platform";
import { useOwnerShop } from "@/hooks/use-owner-shop";
import { formatGhs, formatPercent, formatDate } from "@/lib/format";
import { monthlyOrderStats, shopRevenue } from "@/lib/order-analytics";

export function ShopOwnerDashboard() {
  const user = useCurrentUser();
  const authUser = useAuthUser();
  const { shop, loading } = useOwnerShop();
  const orders = usePlatformStore((s) => s.orders);

  if (!user) return null;

  if (loading) {
    return <PageLoader label="Loading your shop…" />;
  }

  if (!shop) {
    return (
      <div className="rounded-3xl border border-telecel/30 bg-telecel/5 p-8 text-center">
        <p className="font-medium">No shop linked to your account.</p>
        <Button className="mt-4" variant="brand" asChild>
          <Link href="/auth/register?type=shop">Register a shop</Link>
        </Button>
      </div>
    );
  }

  const isPending = shop.status === "pending";
  const isSuspended = shop.status === "suspended";
  const shopOrders = orders.filter((o) => o.shopId === shop.id);
  const pendingOrders = shopOrders.filter((o) => o.status === "pending");
  const revenue = shopRevenue(orders, shop.id);
  const completed = shopOrders.filter((o) => o.status === "completed").length;
  const completionRate = shopOrders.length ? (completed / shopOrders.length) * 100 : 0;
  const hasOrders = shopOrders.length > 0;

  const revenueData = monthlyOrderStats(shopOrders, (o) =>
    o.status === "completed" ? o.amountGhs - o.platformCommissionGhs : 0
  );
  const salesData = monthlyOrderStats(shopOrders, () => 1);

  const recentShopOrders = [...shopOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {authUser && (
        <DashboardWelcome
          user={authUser}
          badge="Shop owner"
          subtitle={`${shop.name} • ${shop.city}`}
        />
      )}

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

      {!hasOrders && (
        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardHeader>
            <CardTitle className="text-base">Getting started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Your shop is live in your account. Add services and start selling — orders and
              analytics will appear here as customers buy from you.
            </p>
            <Button variant="brand" asChild disabled={isPending}>
              <Link href="/app/shop_owner/services">Set up services</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasOrders && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Shop dashboard</p>
              <h1 className="font-display text-2xl font-bold md:text-3xl">{shop.name}</h1>
              <p className="text-sm text-muted-foreground">{shop.city}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="brand" asChild disabled={isPending}>
                <Link href="/app/shop_owner/services">Manage services</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/app/shop_owner/shop">My shop profile</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
              value={formatPercent(completionRate)}
              icon={BarChart3}
              accent="brand"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TrendChart title="Your revenue" data={revenueData} color="mtn" valuePrefix="GHS " />
            <TrendChart title="Your sales" data={salesData} color="telecel" />
          </div>

          <Card className="border-0 shadow-card dark:shadow-card-dark">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent orders</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/app/shop_owner/orders">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentShopOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-2xl border p-4"
                >
                  <div>
                    <p className="text-sm font-medium">{o.id}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-mtn">{formatGhs(o.amountGhs)}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                      {o.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
