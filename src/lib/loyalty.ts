import type { LoyaltyLevel } from "@/types/auth";
import type { Order } from "@/types/marketplace";
import { customerTotalSpend } from "@/lib/order-analytics";

const LEVELS: { level: LoyaltyLevel; minSpend: number }[] = [
  { level: "Diamond", minSpend: 2000 },
  { level: "Platinum", minSpend: 1000 },
  { level: "Gold", minSpend: 500 },
  { level: "Silver", minSpend: 200 },
  { level: "Bronze", minSpend: 0 }
];

export function loyaltyLevelFromSpend(spendGhs: number): LoyaltyLevel {
  return LEVELS.find((l) => spendGhs >= l.minSpend)?.level ?? "Bronze";
}

export function loyaltyPointsFromSpend(spendGhs: number): number {
  return Math.floor(spendGhs);
}

export function nextLoyaltyTier(spendGhs: number): {
  current: LoyaltyLevel;
  next: LoyaltyLevel | null;
  points: number;
  spendToNext: number;
} {
  const current = loyaltyLevelFromSpend(spendGhs);
  const idx = LEVELS.findIndex((l) => l.level === current);
  const next = idx > 0 ? LEVELS[idx - 1] : null;
  return {
    current,
    next: next?.level ?? null,
    points: loyaltyPointsFromSpend(spendGhs),
    spendToNext: next ? Math.max(0, next.minSpend - spendGhs) : 0
  };
}

export function getCustomerLoyalty(customerId: string, orders: Order[]) {
  const spend = customerTotalSpend(orders, customerId);
  return { spend, ...nextLoyaltyTier(spend) };
}

/** Mock referral code from user id */
export function referralCode(userId: string): string {
  return `BH-${userId.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase()}`;
}
