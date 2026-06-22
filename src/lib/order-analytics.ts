import type { Order } from "@/types/marketplace";

export type MonthlyPoint = { label: string; value: number };

/** Group orders by YYYY-MM for charts. */
export function monthlyOrderStats(
  orders: Order[],
  value: (o: Order) => number
): MonthlyPoint[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    const month = o.createdAt.slice(0, 7);
    map.set(month, (map.get(month) ?? 0) + value(o));
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, val]) => ({ label: month.slice(5), value: Math.round(val) }));
}

export function shopRevenue(orders: Order[], shopId: string): number {
  return orders
    .filter((o) => o.shopId === shopId && o.status === "completed")
    .reduce((s, o) => s + (o.amountGhs - o.platformCommissionGhs), 0);
}

export function customerTotalSpend(orders: Order[], customerId: string): number {
  return orders
    .filter((o) => o.customerId === customerId && o.status === "completed")
    .reduce((s, o) => s + o.amountGhs, 0);
}

export function uniqueShopCustomers(orders: Order[], shopId: string): string[] {
  return [
    ...new Set(
      orders.filter((o) => o.shopId === shopId).map((o) => o.customerId)
    )
  ];
}
