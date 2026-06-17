"use client";

import Link from "next/link";
import { Building2, CreditCard, Package, Pencil, TrendingUp, Users } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { TrendChart } from "@/components/shared/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustScore } from "@/components/shared/trust-score";
import { usePlatformStore } from "@/stores/platform-store";
import { formatGhs, formatNumber } from "@/lib/format";

export function AdminDashboard() {
  const analytics = usePlatformStore((s) => s.analytics);
  const shops = usePlatformStore((s) => s.shops);
  const users = usePlatformStore((s) => s.users);
  const orders = usePlatformStore((s) => s.orders);
  const pendingCount = shops.filter((s) => s.status === "pending").length;

  const totalRevenue = analytics.reduce((s, a) => s + a.revenueGhs, 0);
  const totalCommission = analytics.reduce((s, a) => s + a.commissionGhs, 0);
  const customerCount = users.filter((u) => u.role === "customer").length;
  const ordersToday = orders.filter((o) => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-charcoal p-6 text-white md:p-8 dark:bg-card">
        <p className="text-sm text-white/60">Super Admin</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">
          Platform <span className="text-mtn">Overview</span>
        </h1>
        <p className="mt-2 text-sm text-white/70">
          {pendingCount} shop{pendingCount !== 1 ? "s" : ""} awaiting approval
        </p>
        {pendingCount > 0 && (
          <Button className="mt-4" variant="default" asChild>
            <Link href="/app/super_admin/shops">Review pending shops</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Revenue" value={formatGhs(totalRevenue)} icon={TrendingUp} accent="mtn" trend="+24%" />
        <StatCard title="Commission" value={formatGhs(totalCommission)} icon={CreditCard} accent="telecel" />
        <StatCard title="Active Shops" value={String(shops.filter((s) => s.status === "active").length)} icon={Building2} accent="brand" />
        <StatCard title="Customers" value={formatNumber(customerCount)} icon={Users} accent="mtn" />
        <StatCard title="Pending Shops" value={String(pendingCount)} icon={Building2} accent="telecel" />
        <StatCard title="Orders Today" value={String(ordersToday)} icon={Package} accent="brand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart
          title="Revenue Growth"
          data={analytics.map((a) => ({ label: a.month.slice(5), value: a.revenueGhs }))}
          color="mtn"
          valuePrefix="GHS "
        />
        <TrendChart
          title="Customer Growth"
          data={analytics.map((a) => ({ label: a.month.slice(5), value: a.newCustomers }))}
          color="telecel"
        />
      </div>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent shop registrations</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/super_admin/shops">Manage all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Shop</th>
                  <th className="pb-3 font-medium">Owner</th>
                  <th className="pb-3 font-medium">City</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...shops]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 8)
                  .map((shop) => (
                    <ShopRow key={shop.id} shop={shop} />
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ShopRow({ shop }: { shop: ReturnType<typeof usePlatformStore.getState>["shops"][0] }) {
  const approveShop = usePlatformStore((s) => s.approveShop);
  const suspendShop = usePlatformStore((s) => s.suspendShop);

  return (
    <tr className="border-b border-border/50">
      <td className="py-3 font-medium">
        {shop.name}
        {shop.featured && (
          <Badge className="ml-2 text-[10px] gradient-mtn text-charcoal">Featured</Badge>
        )}
      </td>
      <td className="py-3 text-muted-foreground">{shop.ownerName}</td>
      <td className="py-3 text-muted-foreground">{shop.city}</td>
      <td className="py-3">
        <Badge
          variant={
            shop.status === "active"
              ? "success"
              : shop.status === "pending"
                ? "warning"
                : "outline"
          }
          className="capitalize"
        >
          {shop.status}
        </Badge>
      </td>
      <td className="py-3">
        <div className="flex flex-wrap gap-2">
          {shop.status === "pending" && (
            <Button size="sm" variant="brand" onClick={() => approveShop(shop.id)}>
              Approve
            </Button>
          )}
          {shop.status === "active" && (
            <Button size="sm" variant="outline" onClick={() => suspendShop(shop.id)}>
              Suspend
            </Button>
          )}
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/app/super_admin/shops/${shop.id}/edit`}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}
