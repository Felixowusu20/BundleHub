"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { formatGhs, formatDate } from "@/lib/format";
import type { Role } from "@/types/marketplace";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  loyaltyLevel: string;
  walletBalanceGhs: number;
  orderCount: number;
  totalSpendGhs: number;
  lastOrderAt?: string;
};

export default function CustomersPage() {
  const params = useParams<{ role: string }>();
  const role = params.role as Role;
  const user = useCurrentUser();
  const users = usePlatformStore((s) => s.users);
  const orders = usePlatformStore((s) => s.orders);

  const customers = useMemo((): CustomerRow[] => {
    const customerUsers = users.filter((u) => u.role === "customer");

    if (role === "shop_owner" && user?.shopId) {
      const shopOrders = orders.filter((o) => o.shopId === user.shopId);
      const byCustomer = new Map<string, typeof shopOrders>();

      for (const o of shopOrders) {
        const arr = byCustomer.get(o.customerId) ?? [];
        arr.push(o);
        byCustomer.set(o.customerId, arr);
      }

      return [...byCustomer.entries()]
        .flatMap(([customerId, custOrders]): CustomerRow[] => {
          const c = customerUsers.find((u) => u.id === customerId);
          if (!c) return [];
          const sorted = [...custOrders].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const totalSpendGhs = custOrders
            .filter((o) => o.status === "completed")
            .reduce((s, o) => s + o.amountGhs, 0);
          return [
            {
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone,
              city: c.city,
              loyaltyLevel: c.loyaltyLevel,
              walletBalanceGhs: c.walletBalanceGhs,
              orderCount: custOrders.length,
              totalSpendGhs,
              lastOrderAt: sorted[0]?.createdAt
            }
          ];
        })
        .sort((a, b) => b.totalSpendGhs - a.totalSpendGhs);
    }

    return customerUsers.map((c) => {
      const custOrders = orders.filter((o) => o.customerId === c.id);
      const totalSpendGhs = custOrders
        .filter((o) => o.status === "completed")
        .reduce((s, o) => s + o.amountGhs, 0);
      const lastOrderAt = [...custOrders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]?.createdAt;
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        loyaltyLevel: c.loyaltyLevel,
        walletBalanceGhs: c.walletBalanceGhs,
        orderCount: custOrders.length,
        totalSpendGhs,
        lastOrderAt
      };
    });
  }, [users, orders, role, user?.shopId]);

  const title =
    role === "shop_owner" ? "Your customers" : "Customers";
  const subtitle =
    role === "shop_owner"
      ? `${customers.length} buyer${customers.length !== 1 ? "s" : ""} who ordered from your shop`
      : `${customers.length} registered customer${customers.length !== 1 ? "s" : ""} (local accounts)`;

  const ordersHref = `/app/${role}/orders`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid gap-3">
        {customers.length === 0 ? (
          <Card className="border-0 p-8 text-center text-muted-foreground">
            {role === "shop_owner"
              ? "No customers yet. Share your shop link to get your first order."
              : "No customers registered yet."}
          </Card>
        ) : (
          customers.map((c) => (
            <Card key={c.id} className="border-0 shadow-card dark:shadow-card-dark">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.email} • {c.phone} • {c.city}
                    </p>
                    {c.lastOrderAt && (
                      <p className="text-[10px] text-muted-foreground">
                        Last order {formatDate(c.lastOrderAt)}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline">{c.loyaltyLevel}</Badge>
                <div className="text-right text-sm">
                  <p className="font-semibold text-mtn">{formatGhs(c.totalSpendGhs)}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                  </p>
                </div>
                {role === "super_admin" && (
                  <p className="text-sm text-muted-foreground">{formatGhs(c.walletBalanceGhs)}</p>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={ordersHref}>View orders</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
