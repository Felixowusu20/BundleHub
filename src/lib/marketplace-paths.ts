import type { Role } from "@/types/marketplace";

/** Marketplace shop detail URL for public or logged-in customer. */
export function shopMarketplacePath(shopId: string, role?: Role | string | null): string {
  if (role === "customer") {
    return `/app/customer/marketplace/shops/${shopId}`;
  }
  return `/marketplace/shops/${shopId}`;
}
