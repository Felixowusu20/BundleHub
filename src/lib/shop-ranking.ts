import type { Order, Shop } from "@/types/marketplace";

export function getCompletedOrderCount(shopId: string, orders: Order[]) {
  return orders.filter((o) => o.shopId === shopId && o.status === "completed").length;
}

export function getCompletedOrderVolume(shopId: string, orders: Order[]) {
  return orders
    .filter((o) => o.shopId === shopId && o.status === "completed")
    .reduce((sum, o) => sum + o.amountGhs, 0);
}

/** Rank shops by completed transactions, then rating, then trust score. */
export function sortShopsByTransactions(shops: Shop[], orders: Order[]) {
  return [...shops].sort((a, b) => {
    const txDiff = getCompletedOrderCount(b.id, orders) - getCompletedOrderCount(a.id, orders);
    if (txDiff !== 0) return txDiff;
    const ratingDiff = b.rating - a.rating;
    if (ratingDiff !== 0) return ratingDiff;
    return b.trustScore - a.trustScore;
  });
}

export function getShopRankMap(shops: Shop[], orders: Order[]) {
  const sorted = sortShopsByTransactions(shops, orders);
  return new Map(sorted.map((s, i) => [s.id, i + 1]));
}
