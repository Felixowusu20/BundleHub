"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  Filter,
  Search,
  Zap,
  Clock,
  BadgeCheck
} from "lucide-react";
import { toast } from "sonner";
import { usePlatformStore } from "@/stores/platform-store";
import { useActiveShops, useCurrentUser } from "@/hooks/use-platform";
import { formatGhs } from "@/lib/format";
import { shopMarketplacePath } from "@/lib/marketplace-paths";
import {
  formatServiceFromLabel,
  getServiceFromPrice,
  isPerGbService
} from "@/lib/pricing";
import { getCompletedOrderCount, sortShopsByTransactions } from "@/lib/shop-ranking";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrustScore } from "@/components/shared/trust-score";
import { StarRating } from "@/components/shared/star-rating";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { PlaceOrderDialog } from "@/features/orders/place-order-dialog";
import { ShopBrowserSection } from "@/features/marketplace/shop-browser-section";
import type { ServiceCategory, ServiceListing } from "@/types/marketplace";

const categories: ServiceCategory[] = [
  "Data Bundles",
  "Airtime",
  "Electricity",
  "Water",
  "TV Subscription",
  "WAEC Vouchers",
  "BECE Vouchers",
  "Digital Services"
];

export function MarketplaceView() {
  const router = useRouter();
  const user = useCurrentUser();
  const initialize = usePlatformStore((s) => s.initialize);
  const allServices = usePlatformStore((s) => s.services);
  const orders = usePlatformStore((s) => s.orders);
  const allShops = useActiveShops();

  useEffect(() => {
    initialize();
  }, [initialize]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "All">("All");
  const [sort, setSort] = useState<"popular" | "price" | "trust" | "rating">("popular");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minTrust, setMinTrust] = useState(0);
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [orderTarget, setOrderTarget] = useState<{
    service: ServiceListing;
    shopId: string;
  } | null>(null);

  const handleOrderClick = (service: ServiceListing) => {
    const shop = allShops.find((s) => s.id === service.shopId);
    if (!shop) return;
    if (isPerGbService(service)) {
      router.push(
        `${shopMarketplacePath(shop.id, user?.role)}?service=${service.id}`
      );
      return;
    }
    if (!user) {
      toast.message("Sign in to place orders");
      router.push("/auth/login");
      return;
    }
    if (user.role !== "customer") {
      toast.error("Use a customer account to buy from the marketplace.");
      return;
    }
    setOrderTarget({ service, shopId: shop.id });
  };

  const activeShopIds = new Set(allShops.map((s) => s.id));
  const services = allServices.filter((s) => activeShopIds.has(s.shopId));

  const shopMap = useMemo(
    () => new Map(allShops.map((s) => [s.id, s])),
    [allShops]
  );

  const shopTransactionCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const shop of allShops) {
      map.set(shop.id, getCompletedOrderCount(shop.id, orders));
    }
    return map;
  }, [allShops, orders]);

  const filtered = useMemo(() => {
    let list = [...services];
    if (category !== "All") list = list.filter((s) => s.category === category);
    if (inStockOnly) list = list.filter((s) => s.inStock);
    if (minTrust > 0) list = list.filter((s) => s.trustScore >= minTrust);
    if (networkFilter !== "all") {
      list = list.filter(
        (s) => s.network?.toLowerCase() === networkFilter.toLowerCase()
      );
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((s) => {
        const shop = shopMap.get(s.shopId);
        return (
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          shop?.name.toLowerCase().includes(q)
        );
      });
    }
    list.sort((a, b) => {
      if (sort === "popular") {
        const txA = shopTransactionCount.get(a.shopId) ?? 0;
        const txB = shopTransactionCount.get(b.shopId) ?? 0;
        if (txB !== txA) return txB - txA;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.trustScore - a.trustScore;
      }
      if (sort === "price") return getServiceFromPrice(a) - getServiceFromPrice(b);
      if (sort === "rating") return b.rating - a.rating;
      return b.trustScore - a.trustScore;
    });
    return list;
  }, [category, query, sort, shopMap, services, shopTransactionCount, inStockOnly, minTrust, networkFilter]);

  const activeFilterCount =
    (inStockOnly ? 1 : 0) + (minTrust > 0 ? 1 : 0) + (networkFilter !== "all" ? 1 : 0);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof services>();
    for (const s of services) {
      const key = s.name;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return [...map.entries()].slice(0, 8);
  }, [services]);

  return (
    <div className="min-h-dvh">
      {/* Hero banner */}
      <div className="gradient-brand px-4 py-12 text-white md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Zap className="h-4 w-4" />
            Compare prices across verified shops
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
            Marketplace
          </h1>
          <p className="mt-3 max-w-xl text-white/85">
            Affordable data, airtime & bills — pick your network and buy from trusted sellers in
            minutes.
          </p>
          <div className="relative mt-8 max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search MTN 10GB, ECG, DStv, WAEC…"
              className="h-14 rounded-2xl border-0 bg-white pl-12 text-base text-charcoal shadow-xl placeholder:text-gray-500 focus-visible:ring-mtn/40"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Tabs defaultValue="quick">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="quick">Browse shops</TabsTrigger>
              <TabsTrigger value="services">All services</TabsTrigger>
              <TabsTrigger value="compare">Price compare</TabsTrigger>
              <TabsTrigger value="agents">Top sellers</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSort(
                    sort === "popular"
                      ? "price"
                      : sort === "price"
                        ? "rating"
                        : sort === "rating"
                          ? "trust"
                          : "popular"
                  )
                }
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort: {sort === "popular" ? "top sellers" : sort}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 gradient-mtn text-charcoal">{activeFilterCount}</Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Category pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge
              variant={category === "All" ? "default" : "outline"}
              className={`cursor-pointer px-4 py-1.5 text-xs ${
                category === "All" ? "gradient-mtn text-charcoal" : ""
              }`}
              onClick={() => setCategory("All")}
            >
              All
            </Badge>
            {categories.map((c) => (
              <Badge
                key={c}
                variant={category === c ? "default" : "outline"}
                className={`cursor-pointer px-4 py-1.5 text-xs ${
                  category === c ? "gradient-mtn text-charcoal" : ""
                }`}
                onClick={() => setCategory(c)}
              >
                {c}
              </Badge>
            ))}
          </div>

          <TabsContent value="quick" className="mt-6">
            <ShopBrowserSection services={services} />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            {filtered.length === 0 ? (
              <Card className="border-0 p-12 text-center shadow-card">
                <p className="font-medium">No services match your filters</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try clearing filters or browse shops for per-GB data plans.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setQuery("");
                    setCategory("All");
                    setInStockOnly(false);
                    setMinTrust(0);
                    setNetworkFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </Card>
            ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, 24).map((svc, i) => {
                const shop = shopMap.get(svc.shopId);
                return (
                  <motion.div
                    key={svc.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="group h-full border-0 shadow-card transition-all hover:shadow-brand dark:shadow-card-dark">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {svc.category}
                          </Badge>
                          {svc.inStock ? (
                            <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                              In stock
                            </Badge>
                          ) : (
                            <Badge variant="outline">Out of stock</Badge>
                          )}
                        </div>
                        <h3 className="mt-3 font-semibold leading-snug">{svc.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {shop?.name} • {shop?.city}
                        </p>
                        <div className="mt-4 flex items-end justify-between">
                          <div>
                            <p className="font-display text-2xl font-bold text-mtn">
                              {formatServiceFromLabel(svc)}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <StarRating rating={svc.rating} size="sm" />
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {svc.deliverySpeedMins}m
                              </span>
                              {(shopTransactionCount.get(svc.shopId) ?? 0) > 0 && (
                                <span>{shopTransactionCount.get(svc.shopId)} sales</span>
                              )}
                            </div>
                          </div>
                          <TrustScore score={svc.trustScore} size="sm" />
                        </div>
                        <Button
                          className="mt-4 w-full"
                          variant="brand"
                          size="sm"
                          onClick={() => handleOrderClick(svc)}
                          disabled={!svc.inStock}
                        >
                          {isPerGbService(svc) ? "Choose GB" : "Order now"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
            )}
          </TabsContent>

          <TabsContent value="compare" className="mt-6 space-y-6">
            {grouped.map(([name, listings]) => {
              const sorted = [...listings].sort((a, b) => a.priceGhs - b.priceGhs);
              const best = sorted[0];
              return (
                <Card key={name} className="border-0 shadow-card dark:shadow-card-dark">
                  <CardContent className="p-6">
                    <h3 className="font-semibold">{name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {listings.length} sellers • Best: {formatGhs(best?.priceGhs ?? 0)}
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {sorted.slice(0, 3).map((l, idx) => {
                        const shop = shopMap.get(l.shopId);
                        const labels = ["Best Price", "Top Rated", "Fastest"];
                        return (
                          <div
                            key={l.id}
                            className={`rounded-2xl border p-4 ${
                              idx === 0 ? "border-mtn/50 bg-mtn/5" : ""
                            }`}
                          >
                            <Badge
                              variant={idx === 0 ? "default" : "outline"}
                              className={idx === 0 ? "gradient-mtn text-charcoal" : ""}
                            >
                              {labels[idx] ?? "Seller"}
                            </Badge>
                            <p className="mt-2 text-sm font-medium">{shop?.name}</p>
                            <p className="font-display text-xl font-bold text-mtn">
                              {formatGhs(l.priceGhs)}
                            </p>
                            <TrustScore score={l.trustScore} size="sm" className="mt-1" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="agents" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortShopsByTransactions(allShops, orders)
                .slice(0, 12)
                .map((shop, i) => (
                  <Card key={shop.id} className="border-0 shadow-card dark:shadow-card-dark">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="gradient-mtn text-charcoal text-[10px]">
                            #{i + 1} seller
                          </Badge>
                          <h3 className="mt-2 font-semibold">{shop.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {shop.city} • {shop.ownerName}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {getCompletedOrderCount(shop.id, orders)} completed orders
                          </p>
                        </div>
                        <Badge variant="outline">{shop.badges[0]}</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1">
                        {shop.verification.map((v) => (
                          <span
                            key={v}
                            className="flex items-center gap-0.5 text-[10px] text-emerald-600"
                          >
                            <BadgeCheck className="h-3 w-3" />
                            {v.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <StarRating rating={shop.rating} size="sm" />
                        <TrustScore score={shop.trustScore} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {orderTarget && (
        <PlaceOrderDialog
          service={orderTarget.service}
          shop={shopMap.get(orderTarget.shopId)!}
          open={!!orderTarget}
          onOpenChange={(open) => !open && setOrderTarget(null)}
        />
      )}

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter services</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              In stock only
            </label>
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum trust score</label>
              <select
                value={minTrust}
                onChange={(e) => setMinTrust(Number(e.target.value))}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value={0}>Any</option>
                <option value={60}>60+</option>
                <option value={75}>75+</option>
                <option value={90}>90+</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Network</label>
              <select
                value={networkFilter}
                onChange={(e) => setNetworkFilter(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="all">All networks</option>
                <option value="MTN">MTN</option>
                <option value="Telecel">Telecel</option>
                <option value="AirtelTigo">AirtelTigo</option>
              </select>
            </div>
            <Button
              variant="brand"
              className="w-full"
              onClick={() => setFiltersOpen(false)}
            >
              Apply filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
