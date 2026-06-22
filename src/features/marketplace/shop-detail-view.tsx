"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpTipsBanner } from "@/components/shared/help-tips-banner";
import { StarRating } from "@/components/shared/star-rating";
import { TrustScore } from "@/components/shared/trust-score";
import { PlaceOrderDialog } from "@/features/orders/place-order-dialog";
import { FixedServiceBuyCard } from "@/features/marketplace/fixed-service-buy-card";
import { ServiceBuyCard } from "@/features/marketplace/service-buy-card";
import { ShopReviewsSection } from "@/features/reviews/shop-reviews-section";
import { usePlatformStore } from "@/stores/platform-store";
import { useActiveShops } from "@/hooks/use-platform";
import {
  QUICK_BUY_NETWORKS,
  QUICK_BUY_TIPS,
  filterServicesByNetwork,
  parseQuickBuyNetwork,
  type QuickBuyNetwork
} from "@/lib/quick-buy";
import { isPerGbService } from "@/lib/pricing";
import { getCompletedOrderCount } from "@/lib/shop-ranking";
import type { ServiceListing } from "@/types/marketplace";

type Props = {
  shopId: string;
  marketplaceHref?: string;
};

export function ShopDetailView({ shopId, marketplaceHref = "/marketplace" }: Props) {
  const searchParams = useSearchParams();
  const initialize = usePlatformStore((s) => s.initialize);
  const allServices = usePlatformStore((s) => s.services);
  const orders = usePlatformStore((s) => s.orders);
  const reviews = usePlatformStore((s) => s.reviews);
  const users = usePlatformStore((s) => s.users);
  const allShops = useActiveShops();

  const [network, setNetwork] = useState<QuickBuyNetwork>("mtn");
  const [fixedTarget, setFixedTarget] = useState<{
    service: ServiceListing;
    shopId: string;
  } | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const fromUrl = parseQuickBuyNetwork(searchParams.get("network"));
    if (fromUrl) setNetwork(fromUrl);
  }, [searchParams]);

  const shop = allShops.find((s) => s.id === shopId);
  const shopServices = useMemo(
    () => allServices.filter((s) => s.shopId === shopId && s.inStock),
    [allServices, shopId]
  );

  const filtered = useMemo(
    () => filterServicesByNetwork(shopServices, network),
    [shopServices, network]
  );

  const perGbServices = filtered.filter(isPerGbService);
  const fixedServices = filtered.filter((s) => !isPerGbService(s));

  const highlightServiceId = searchParams.get("service");

  useEffect(() => {
    if (highlightServiceId) {
      const el = document.getElementById(`service-${highlightServiceId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightServiceId, perGbServices.length]);

  if (!shop) {
    return (
      <Card className="mx-auto max-w-lg border-0 p-8 text-center">
        <p className="text-muted-foreground">Shop not found or not active.</p>
        <Button variant="brand" className="mt-4" asChild>
          <Link href={marketplaceHref}>Back to marketplace</Link>
        </Button>
      </Card>
    );
  }

  const sales = getCompletedOrderCount(shop.id, orders);

  return (
    <div className="min-h-dvh">
      <div className="border-b bg-muted/30 px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1" asChild>
            <Link href={marketplaceHref}>
              <ArrowLeft className="h-4 w-4" />
              All shops
            </Link>
          </Button>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold md:text-3xl">{shop.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {shop.city}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {shop.phone}
                </span>
              </p>
              {shop.description && (
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">{shop.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {shop.badges.slice(0, 2).map((b) => (
                <Badge key={b} variant="outline">
                  {b}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <StarRating rating={shop.rating} />
            <TrustScore score={shop.trustScore} size="sm" />
            <span className="text-xs text-muted-foreground">{sales} completed sales</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <p className="mb-2 text-sm font-medium">Filter by network</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_BUY_NETWORKS.slice(0, 4).map((n) => (
              <Button
                key={n.id}
                type="button"
                size="sm"
                variant={network === n.id ? "brand" : "outline"}
                className="rounded-full"
                onClick={() => setNetwork(n.id)}
              >
                {n.label}
              </Button>
            ))}
          </div>
        </div>

        <HelpTipsBanner message={QUICK_BUY_TIPS[network]} />

        {perGbServices.length === 0 && fixedServices.length === 0 ? (
          <Card className="border-0 p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">
              This shop has no {QUICK_BUY_NETWORKS.find((n) => n.id === network)?.label} listings
              yet. Try another network.
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-6">
              <h2 className="font-display text-lg font-semibold">Data packages</h2>
              {perGbServices.map((service) => (
                <ServiceBuyCard
                  key={service.id}
                  service={service}
                  shop={shop}
                  defaultSelected={highlightServiceId === service.id}
                />
              ))}
            </div>

            {fixedServices.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-lg font-semibold">Other services</h2>
                <div className="grid gap-4">
                  {fixedServices.map((service) => (
                    <FixedServiceBuyCard
                      key={service.id}
                      service={service}
                      onBuy={() => setFixedTarget({ service, shopId: shop.id })}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <ShopReviewsSection
          reviews={reviews}
          users={users}
          shopId={shop.id}
        />
      </div>

      {fixedTarget && (
        <PlaceOrderDialog
          service={fixedTarget.service}
          shop={shop}
          open={!!fixedTarget}
          onOpenChange={(open) => !open && setFixedTarget(null)}
        />
      )}
    </div>
  );
}
