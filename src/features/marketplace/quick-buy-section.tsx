"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpTipsBanner } from "@/components/shared/help-tips-banner";
import { StarRating } from "@/components/shared/star-rating";
import { formatGhs } from "@/lib/format";
import { formatServiceFromLabel, getServiceFromPrice, isPerGbService } from "@/lib/pricing";
import {
  QUICK_BUY_NETWORKS,
  QUICK_BUY_TIPS,
  filterServicesByNetwork,
  groupCheapestPackages,
  parseQuickBuyNetwork,
  type QuickBuyNetwork
} from "@/lib/quick-buy";
import type { ServiceListing, Shop } from "@/types/marketplace";
import { cn } from "@/lib/utils";

type Props = {
  services: ServiceListing[];
  shopMap: Map<string, Shop>;
  onBuy: (service: ServiceListing) => void;
  compact?: boolean;
};

export function QuickBuySection({ services, shopMap, onBuy, compact }: Props) {
  const searchParams = useSearchParams();
  const networkFromUrl = parseQuickBuyNetwork(searchParams.get("network"));
  const [network, setNetwork] = useState<QuickBuyNetwork>(networkFromUrl ?? "mtn");

  useEffect(() => {
    if (networkFromUrl) setNetwork(networkFromUrl);
  }, [networkFromUrl]);

  const filtered = useMemo(
    () => filterServicesByNetwork(services, network),
    [services, network]
  );

  const packages = useMemo(() => groupCheapestPackages(filtered), [filtered]);

  const activeNetwork = QUICK_BUY_NETWORKS.find((n) => n.id === network)!;

  return (
    <div className="space-y-5">
      <div>
        <h2 className={cn("font-display font-bold", compact ? "text-xl" : "text-2xl")}>
          Quick buy
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a network or service type — we show the best price from verified shops.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_BUY_NETWORKS.map((n) => (
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

      <HelpTipsBanner message={QUICK_BUY_TIPS[network]} />

      {packages.length === 0 ? (
        <Card className="border-0 p-8 text-center shadow-card dark:shadow-card-dark">
          <p className="text-sm text-muted-foreground">
            No {activeNetwork.label} packages listed yet. Try another network or browse all
            services.
          </p>
        </Card>
      ) : (
        <div
          className={cn(
            "grid gap-3",
            compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {packages.slice(0, compact ? 6 : 12).map(({ name, best, sellerCount }) => {
            const shop = shopMap.get(best.shopId);
            return (
              <Card
                key={best.id}
                className="border-0 shadow-card transition-shadow hover:shadow-brand dark:shadow-card-dark"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {activeNetwork.label}
                    </Badge>
                    {sellerCount > 1 && (
                      <span className="text-[10px] text-muted-foreground">
                        {sellerCount} sellers
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold leading-snug">{name}</h3>
                  {isPerGbService(best) && (
                    <p className="text-xs text-muted-foreground">
                      {formatGhs(best.pricePerGb ?? 0)}/GB • {best.minGb}–{best.maxGb} GB
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {shop?.name ?? "Verified shop"}
                  </p>
                  <p className="mt-3 font-display text-2xl font-bold text-mtn">
                    {formatServiceFromLabel(best)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StarRating rating={best.rating} size="sm" />
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {best.deliverySpeedMins}m
                    </span>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    variant="brand"
                    size="sm"
                    onClick={() => onBuy(best)}
                    disabled={!best.inStock}
                  >
                    Buy now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!compact && (
        <Card className="border-0 bg-muted/40 shadow-none">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 text-mtn" />
              <div>
                <p className="text-sm font-medium">Need help?</p>
                <p className="text-xs text-muted-foreground">
                  After payment, chat with the seller to confirm delivery. Support:
                  support@bundlehub.gh
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:support@bundlehub.gh">Contact us</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
