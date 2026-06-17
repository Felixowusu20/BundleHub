"use client";

import Link from "next/link";
import { Package, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { TrendChart } from "@/components/shared/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { formatGhs, formatDate } from "@/lib/format";

export function CustomerDashboard() {
  const user = useCurrentUser();
  const orders = usePlatformStore((s) => s.orders);
  const analytics = usePlatformStore((s) => s.analytics);

  if (!user) return null;

  const myOrders = orders.filter((o) => o.customerId === user.id);
  const active = myOrders.filter((o) =>
    ["pending", "accepted", "processing"].includes(o.status)
  ).length;
  const completed = myOrders.filter((o) => o.status === "completed").length;

  const spendData = analytics.map((a) => ({
    label: a.month.slice(5),
    value: Math.round(a.revenueGhs * 0.02)
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl gradient-brand p-6 text-white md:p-8">
        <p className="text-sm text-white/80">Welcome back,</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">{user.name}</h1>
        <p className="mt-1 text-sm text-white/75">
          {user.city} • {user.loyaltyLevel} member
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/app/customer/marketplace">
              <ShoppingBag className="h-4 w-4" /> Browse marketplace
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            asChild
          >
            <Link href="/app/customer/orders">View orders</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={String(myOrders.length)}
          hint="all time"
          icon={Package}
          accent="mtn"
        />
        <StatCard
          title="Active Orders"
          value={String(active)}
          hint="in progress"
          icon={TrendingUp}
          accent="telecel"
        />
        <StatCard
          title="Completed"
          value={String(completed)}
          hint="success rate 96%"
          icon={Package}
          trend="+12%"
          accent="brand"
        />
        <StatCard
          title="Wallet Balance"
          value={formatGhs(user.walletBalanceGhs)}
          hint="available"
          icon={Wallet}
          accent="mtn"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart title="Monthly Spending" data={spendData} color="mtn" valuePrefix="GHS " />
        <TrendChart
          title="Order History"
          data={analytics.map((a) => ({ label: a.month.slice(5), value: a.orders }))}
          color="telecel"
        />
      </div>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/customer/orders">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {(myOrders.length ? myOrders : orders).slice(0, 5).map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-2xl bg-muted/50 p-4"
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
    </div>
  );
}
