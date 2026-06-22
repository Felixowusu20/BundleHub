"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { TrendChart } from "@/components/shared/trend-chart";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { formatGhs } from "@/lib/format";
import {
  monthlyOrderStats,
  shopRevenue,
  uniqueShopCustomers
} from "@/lib/order-analytics";
import { Package, TrendingUp, Users } from "lucide-react";
import type { Role } from "@/types/marketplace";

export function AnalyticsDashboard() {
  const params = useParams<{ role: string }>();
  const role = params.role as Role;
  const user = useCurrentUser();
  const orders = usePlatformStore((s) => s.orders);
  const analytics = usePlatformStore((s) => s.analytics);

  const shopId = user?.shopId;
  const scopedOrders = useMemo(() => {
    if (role === "shop_owner" && shopId) {
      return orders.filter((o) => o.shopId === shopId);
    }
    return orders;
  }, [orders, role, shopId]);

  const revenueData = useMemo(
    () =>
      monthlyOrderStats(scopedOrders, (o) =>
        role === "shop_owner" && o.status === "completed"
          ? o.amountGhs - o.platformCommissionGhs
          : o.amountGhs
      ),
    [scopedOrders, role]
  );

  const orderCountData = useMemo(
    () => monthlyOrderStats(scopedOrders, () => 1),
    [scopedOrders]
  );

  const totalRevenue =
    role === "shop_owner" && shopId
      ? shopRevenue(orders, shopId)
      : analytics.reduce((s, a) => s + a.revenueGhs, 0);

  const customerCount =
    role === "shop_owner" && shopId ? uniqueShopCustomers(orders, shopId).length : 0;

  const title =
    role === "shop_owner" ? "Shop analytics" : "Platform analytics";
  const subtitle =
    role === "shop_owner"
      ? "Your sales, revenue & customer activity"
      : "Revenue, orders & growth across BundleHub";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {role === "shop_owner" && shopId && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Net revenue"
            value={formatGhs(totalRevenue)}
            icon={TrendingUp}
            accent="mtn"
          />
          <StatCard
            title="Total orders"
            value={String(scopedOrders.length)}
            icon={Package}
            accent="telecel"
          />
          <StatCard
            title="Customers"
            value={String(customerCount)}
            icon={Users}
            accent="brand"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart
          title={role === "shop_owner" ? "Your revenue" : "Platform revenue"}
          data={revenueData.length ? revenueData : analytics.map((a) => ({
            label: a.month.slice(5),
            value: a.revenueGhs
          }))}
          color="mtn"
          valuePrefix="GHS "
        />
        <TrendChart
          title="Orders"
          data={orderCountData.length ? orderCountData : analytics.map((a) => ({
            label: a.month.slice(5),
            value: a.orders
          }))}
          color="telecel"
        />
      </div>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader>
          <CardTitle className="text-base">Commission breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl bg-muted/50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Example order</p>
                <p className="text-2xl font-bold">{formatGhs(100)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-telecel">Platform (3%)</p>
                <p className="text-xl font-bold text-telecel">{formatGhs(3)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-mtn">Shop receives</p>
                <p className="text-xl font-bold text-mtn">{formatGhs(97)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
