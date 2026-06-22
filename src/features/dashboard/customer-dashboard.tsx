"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Package, ShoppingBag, TrendingUp, Wallet, Zap, Gift } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { TrendChart } from "@/components/shared/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlatformStore } from "@/stores/platform-store";
import { DashboardWelcome } from "@/components/shared/dashboard-welcome";
import { useCurrentUser, useAuthUser } from "@/hooks/use-platform";
import { formatGhs, formatDate } from "@/lib/format";
import { QUICK_BUY_NETWORKS } from "@/lib/quick-buy";
import { monthlyOrderStats } from "@/lib/order-analytics";
import { getCustomerLoyalty, referralCode } from "@/lib/loyalty";

export function CustomerDashboard() {
  const user = useCurrentUser();
  const authUser = useAuthUser();
  const orders = usePlatformStore((s) => s.orders);
  const services = usePlatformStore((s) => s.services);
  const shops = usePlatformStore((s) => s.shops);

  const myOrders = useMemo(
    () => (user ? orders.filter((o) => o.customerId === user.id) : []),
    [orders, user]
  );

  const spendData = useMemo(
    () =>
      monthlyOrderStats(
        myOrders.filter((o) => o.status === "completed"),
        (o) => o.amountGhs
      ),
    [myOrders]
  );

  const orderVolumeData = useMemo(
    () => monthlyOrderStats(myOrders, () => 1),
    [myOrders]
  );

  if (!user) return null;
  const active = myOrders.filter((o) =>
    ["pending", "accepted", "processing"].includes(o.status)
  ).length;
  const completed = myOrders.filter((o) => o.status === "completed").length;
  const loyalty = getCustomerLoyalty(user.id, orders);

  const recentOrders = [...myOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const refCode = referralCode(user.id);

  const copyReferral = () => {
    void navigator.clipboard.writeText(refCode);
    toast.success("Referral code copied");
  };

  return (
    <div className="space-y-6">
      {authUser ? (
        <DashboardWelcome
          user={authUser}
          subtitle={`${user.city} • ${loyalty.current} member • ${loyalty.points} pts`}
        >
          <div className="flex flex-wrap gap-3">
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
        </DashboardWelcome>
      ) : (
        <div className="rounded-3xl gradient-brand p-6 text-white md:p-8">
          <p className="text-sm text-white/80">Welcome back,</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{user.name}</h1>
          <p className="mt-1 text-sm text-white/75">
            {user.city} • {loyalty.current} member • {loyalty.points} pts
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
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4 text-mtn" />
              Loyalty & referrals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Total spend: <strong>{formatGhs(loyalty.spend)}</strong>
            </p>
            {loyalty.next && (
              <p className="text-muted-foreground">
                {formatGhs(loyalty.spendToNext)} more to reach {loyalty.next}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Input readOnly value={refCode} className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={copyReferral}>
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share your code — friends get GHS 50 welcome credit when they sign up.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-mtn" />
              Quick buy
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {QUICK_BUY_NETWORKS.slice(0, 4).map((n) => (
              <Button key={n.id} variant="outline" size="sm" className="rounded-full" asChild>
                <Link href={`/app/customer/marketplace?network=${n.id}`}>{n.label}</Link>
              </Button>
            ))}
            <Button variant="brand" size="sm" className="rounded-full" asChild>
              <Link href="/app/customer/marketplace">All shops</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Orders" value={String(myOrders.length)} hint="all time" icon={Package} accent="mtn" />
        <StatCard title="Active" value={String(active)} hint="in progress" icon={TrendingUp} accent="telecel" />
        <StatCard title="Completed" value={String(completed)} hint="delivered" icon={Package} accent="brand" />
        <StatCard title="Wallet" value={formatGhs(user.walletBalanceGhs)} hint="available" icon={Wallet} accent="mtn" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart
          title="Your spending"
          data={spendData}
          color="mtn"
          valuePrefix="GHS "
        />
        <TrendChart title="Your orders" data={orderVolumeData} color="telecel" />
      </div>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/customer/orders">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentOrders.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <p>No orders yet.</p>
              <Button variant="brand" size="sm" className="mt-3" asChild>
                <Link href="/app/customer/marketplace">Browse shops</Link>
              </Button>
            </div>
          ) : (
            recentOrders.map((o) => {
              const svc = services.find((s) => s.id === o.serviceId);
              const shop = shops.find((s) => s.id === o.shopId);
              return (
                <Link
                  key={o.id}
                  href={o.conversationId ? `/app/customer/messages?c=${o.conversationId}` : "/app/customer/orders"}
                  className="flex items-center justify-between rounded-2xl bg-muted/50 p-4 transition-colors hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium">{svc?.name ?? o.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {shop?.name} • {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-mtn">{formatGhs(o.amountGhs)}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                      {o.status}
                    </Badge>
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
