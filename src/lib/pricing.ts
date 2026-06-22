import { formatGhs } from "@/lib/format";
import type { OrderDetails, ServiceListing } from "@/types/marketplace";

export const STANDARD_GB_TIERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 10, 15, 20, 25, 30, 40, 50, 100
] as const;

export function isPerGbService(service: ServiceListing): boolean {
  return service.pricingModel === "per_gb" && (service.pricePerGb ?? 0) > 0;
}

export function getGbBounds(service: ServiceListing): { min: number; max: number } {
  const tiers = service.gbTiers?.length ? service.gbTiers : STANDARD_GB_TIERS;
  const sorted = [...tiers].sort((a, b) => a - b);
  return {
    min: service.minGb ?? sorted[0] ?? 1,
    max: service.maxGb ?? sorted[sorted.length - 1] ?? 100
  };
}

/** GB sizes the shop offers for this listing. */
export function getAvailableGbTiers(service: ServiceListing): number[] {
  const { min, max } = getGbBounds(service);
  const source = service.gbTiers?.length ? service.gbTiers : [...STANDARD_GB_TIERS];
  return [...new Set(source)]
    .filter((g) => g >= min && g <= max)
    .sort((a, b) => a - b);
}

export function isValidGbTier(service: ServiceListing, gb: number): boolean {
  return getAvailableGbTiers(service).includes(gb);
}

export function clampGb(service: ServiceListing, gb: number): number {
  const tiers = getAvailableGbTiers(service);
  if (tiers.includes(gb)) return gb;
  const { min, max } = getGbBounds(service);
  const clamped = Math.min(max, Math.max(min, Math.round(gb)));
  return tiers.reduce((prev, cur) =>
    Math.abs(cur - clamped) < Math.abs(prev - clamped) ? cur : prev
  );
}

export function priceForGb(service: ServiceListing, gb: number): number {
  const rate = service.pricePerGb ?? 0;
  return Math.round(gb * rate * 100) / 100;
}

/** Order total from service + buyer choices. */
export function calculateOrderAmount(
  service: ServiceListing,
  details: Pick<OrderDetails, "quantityGb" | "quantity">
): number {
  if (isPerGbService(service)) {
    const gb = details.quantityGb ?? getAvailableGbTiers(service)[0] ?? 1;
    return priceForGb(service, gb);
  }

  const qty = details.quantity ?? 1;
  if (
    (service.category === "WAEC Vouchers" || service.category === "BECE Vouchers") &&
    qty > 1
  ) {
    return Math.round(service.priceGhs * qty * 100) / 100;
  }

  return service.priceGhs;
}

export function getServicePriceRange(service: ServiceListing): {
  min: number;
  max: number;
} {
  if (!isPerGbService(service)) {
    return { min: service.priceGhs, max: service.priceGhs };
  }
  const tiers = getAvailableGbTiers(service);
  if (!tiers.length) {
    const rate = service.pricePerGb ?? 0;
    const { min, max } = getGbBounds(service);
    return { min: min * rate, max: max * rate };
  }
  return {
    min: priceForGb(service, tiers[0]),
    max: priceForGb(service, tiers[tiers.length - 1])
  };
}

/** Lowest price shown on cards (per-GB uses smallest tier). */
export function getServiceFromPrice(service: ServiceListing): number {
  if (isPerGbService(service)) {
    const tiers = getAvailableGbTiers(service);
    return priceForGb(service, tiers[0] ?? 1);
  }
  return service.priceGhs;
}

export function formatServicePriceLabel(service: ServiceListing): string {
  if (isPerGbService(service)) {
    return `${formatGhs(service.pricePerGb ?? 0)}/GB`;
  }
  return formatGhs(service.priceGhs);
}

export function formatServiceFromLabel(service: ServiceListing): string {
  if (isPerGbService(service)) {
    const { min, max } = getServicePriceRange(service);
    if (min === max) return formatGhs(min);
    return `${formatGhs(min)} – ${formatGhs(max)}`;
  }
  return formatGhs(service.priceGhs);
}

export function formatServicePriceRange(service: ServiceListing): string {
  const { min, max } = getServicePriceRange(service);
  if (min === max) return formatGhs(min);
  return `${formatGhs(min)} – ${formatGhs(max)}`;
}
