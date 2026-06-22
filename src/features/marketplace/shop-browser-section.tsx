"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpTipsBanner } from "@/components/shared/help-tips-banner";
import { StarRating } from "@/components/shared/star-rating";
import { TrustScore } from "@/components/shared/trust-score";
import { usePlatformStore } from "@/stores/platform-store";
import { useActiveShops, useCurrentUser } from "@/hooks/use-platform";
import { formatGhs } from "@/lib/format";
import { shopMarketplacePath } from "@/lib/marketplace-paths";
import {
  QUICK_BUY_NETWORKS,
  QUICK_BUY_TIPS,
  filterServicesByNetwork,
  parseQuickBuyNetwork,
  type QuickBuyNetwork
} from "@/lib/quick-buy";
import { getServiceFromPrice } from "@/lib/pricing";
import { BRAND_ASSETS } from "@/lib/service-brand";
import { getCompletedOrderCount } from "@/lib/shop-ranking";
import type { ServiceListing } from "@/types/marketplace";
import { cn } from "@/lib/utils";

const NETWORK_BRAND_IMG: Partial<Record<QuickBuyNetwork, string>> = {
  mtn: BRAND_ASSETS.mtn,
  telecel: BRAND_ASSETS.telecel,
  airteltigo: BRAND_ASSETS.airteltigo,
  airtime: BRAND_ASSETS.airtime
};

type Props = {
  services: ServiceListing[];
  compact?: boolean;
};

export function ShopBrowserSection({ services, compact }: Props) {
  const searchParams = useSearchParams();
  const user = useCurrentUser();
  const orders = usePlatformStore((s) => s.orders);
  const allShops = useActiveShops();

  const networkFromUrl = parseQuickBuyNetwork(searchParams.get("network"));
  const [network, setNetwork] = useState<QuickBuyNetwork>(networkFromUrl ?? "mtn");

  useEffect(() => {
    if (networkFromUrl) setNetwork(networkFromUrl);
  }, [networkFromUrl]);

  const activeShopIds = new Set(allShops.map((s) => s.id));
  const marketplaceServices = services.filter((s) => activeShopIds.has(s.shopId));

  const filteredServices = useMemo(
    () => filterServicesByNetwork(marketplaceServices, network),
    [marketplaceServices, network]
  );

  const shopsWithServices = useMemo(() => {
    const shopIds = new Set(filteredServices.map((s) => s.shopId));
    return allShops
      .filter((shop) => shopIds.has(shop.id))
      .map((shop) => {
        const shopServices = filteredServices.filter((s) => s.shopId === shop.id);
        const prices = shopServices.map(getServiceFromPrice);
        return {
          shop,
          serviceCount: shopServices.length,
          fromPrice: Math.min(...prices),
          sales: getCompletedOrderCount(shop.id, orders)
        };
      })
      .sort((a, b) => b.sales - a.sales || a.fromPrice - b.fromPrice);
  }, [allShops, filteredServices, orders]);

  const activeNetwork = QUICK_BUY_NETWORKS.find((n) => n.id === network)!;

  return (
    <div className="space-y-5">
      <div>
        <h2 className={cn("font-display font-bold", compact ? "text-xl" : "text-2xl")}>
          Browse shops
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a network, choose a shop, then select your GB size — just like a data vendor.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_BUY_NETWORKS.slice(0, 4).map((n) => (
          <Button
            key={n.id}
            type="button"
            size="sm"
            variant={network === n.id ? "brand" : "outline"}
            className="rounded-full gap-2"
            onClick={() => setNetwork(n.id)}
          >
            {NETWORK_BRAND_IMG[n.id] && (
              <span className="relative h-5 w-5 overflow-hidden rounded-full">
                <Image
                  src={NETWORK_BRAND_IMG[n.id]!}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="20px"
                />
              </span>
            )}
            {n.label}
          </Button>
        ))}
      </div>

      <HelpTipsBanner message={QUICK_BUY_TIPS[network]} />

      {shopsWithServices.length === 0 ? (
        <Card className="border-0 p-8 text-center shadow-card dark:shadow-card-dark">
          <p className="text-sm text-muted-foreground">
            No shops selling {activeNetwork.label} packages yet.
          </p>
        </Card>
      ) : (
        <div
          className={cn(
            "grid gap-3",
            compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {shopsWithServices.slice(0, compact ? 6 : 12).map(
            ({ shop, serviceCount, fromPrice, sales }) => (
              <Link key={shop.id} href={shopMarketplacePath(shop.id, user?.role)}>
                <Card className="h-full border-0 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-brand dark:shadow-card-dark">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand text-sm font-bold text-white">
                        <Store className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {activeNetwork.label}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-semibold leading-snug">{shop.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {shop.city} • {shop.ownerName}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {serviceCount} package{serviceCount !== 1 ? "s" : ""} • {sales} sales
                    </p>
                    <p className="mt-3 font-display text-xl font-bold text-mtn">
                      From {formatGhs(fromPrice)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <StarRating rating={shop.rating} size="sm" />
                      <TrustScore score={shop.trustScore} size="sm" />
                    </div>
                    <Button className="mt-4 w-full" variant="brand" size="sm" asChild>
                      <span>View shop</span>
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
