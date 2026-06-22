"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Filter,
  LayoutGrid,
  MapPin,
  Package,
  Phone,
  Search,
  Store,
  Tag,
  User,
  X,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";
import { StarRating } from "@/components/shared/star-rating";
import { TrustScore } from "@/components/shared/trust-score";
import { usePlatformStore } from "@/stores/platform-store";
import { formatGhs } from "@/lib/format";
import { formatServiceFromLabel, isPerGbService } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { PricingModel, ServiceCategory, ServiceListing, Shop } from "@/types/marketplace";

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

const networks = ["MTN", "Telecel", "AirtelTigo"] as const;

type GroupMode = "shop" | "category";
type StockFilter = "all" | "in" | "out";
type PricingFilter = "all" | PricingModel;

type ShopGroup = {
  shop: Shop;
  services: ServiceListing[];
};

type CategoryGroup = {
  category: ServiceCategory;
  services: ServiceListing[];
};

function shopStatusBadge(status: Shop["status"]) {
  switch (status) {
    case "active":
      return <Badge variant="success" className="capitalize">{status}</Badge>;
    case "pending":
      return <Badge variant="warning" className="capitalize">{status}</Badge>;
    default:
      return <Badge variant="outline" className="capitalize">{status}</Badge>;
  }
}

function ServiceRow({ svc, shop }: { svc: ServiceListing; shop?: Shop }) {
  const perGb = isPerGbService(svc);

  return (
    <div className="grid gap-3 border-t px-4 py-3 text-sm transition-colors hover:bg-muted/20 md:grid-cols-[1.4fr_0.9fr_0.7fr_0.8fr_0.6fr_0.5fr] md:items-center">
      <div className="min-w-0">
        <p className="font-medium leading-snug">{svc.name}</p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
          {svc.description || "No description"}
        </p>
        {shop && (
          <p className="mt-1 text-[10px] text-muted-foreground md:hidden">
            {shop.name} • {shop.ownerName}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px]">
          {svc.category}
        </Badge>
        {svc.network && (
          <Badge variant="outline" className="text-[10px]">
            {svc.network}
          </Badge>
        )}
        {perGb && (
          <Badge className="bg-mtn/10 text-[10px] text-mtn">Per GB</Badge>
        )}
      </div>

      <div>
        <p className="font-semibold text-mtn">{formatServiceFromLabel(svc)}</p>
        {perGb && (
          <p className="text-[10px] text-muted-foreground">
            {formatGhs(svc.pricePerGb ?? 0)}/GB
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <StarRating rating={svc.rating} size="sm" />
        <TrustScore score={svc.trustScore} size="sm" />
      </div>

      <p className="text-xs text-muted-foreground">{svc.deliverySpeedMins}m delivery</p>

      <div>
        <Badge
          className={
            svc.inStock
              ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }
        >
          {svc.inStock ? "Live" : "Hidden"}
        </Badge>
      </div>
    </div>
  );
}

function ShopSection({
  group,
  defaultOpen = true
}: {
  group: ShopGroup;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { shop, services } = group;
  const perGbCount = services.filter(isPerGbService).length;
  const inStockCount = services.filter((s) => s.inStock).length;

  return (
    <Card className="overflow-hidden border-0 shadow-card dark:shadow-card-dark">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 border-b bg-muted/20 p-4 text-left transition-colors hover:bg-muted/30 sm:p-5"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mtn/15 font-display text-lg font-bold text-mtn">
          {shop.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{shop.name}</h3>
            {shop.featured && (
              <Badge className="gradient-mtn text-[10px] text-charcoal">Featured</Badge>
            )}
            {shopStatusBadge(shop.status)}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {shop.ownerName}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {shop.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {shop.phone}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StarRating rating={shop.rating} size="sm" />
            <TrustScore score={shop.trustScore} size="sm" />
            {shop.badges[0] && (
              <Badge variant="outline" className="text-[10px]">
                {shop.badges[0]}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {services.length} listing{services.length !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {inStockCount} live
            </Badge>
            {perGbCount > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {perGbCount} per-GB
              </Badge>
            )}
          </div>
          {open ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <>
          <div className="hidden border-b bg-muted/10 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[1.4fr_0.9fr_0.7fr_0.8fr_0.6fr_0.5fr]">
            <span>Service</span>
            <span>Type</span>
            <span>Price</span>
            <span>Trust</span>
            <span>Speed</span>
            <span>Status</span>
          </div>

          <div>
            {services.map((svc) => (
              <ServiceRow key={svc.id} svc={svc} shop={shop} />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t bg-muted/10 px-4 py-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/app/super_admin/shops/${shop.id}/edit`}>Manage shop</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/marketplace/shops/${shop.id}`}>View storefront</Link>
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

function CategorySection({ group }: { group: CategoryGroup }) {
  const [open, setOpen] = useState(true);
  const shops = usePlatformStore((s) => s.shops);
  const shopMap = useMemo(() => new Map(shops.map((s) => [s.id, s])), [shops]);

  const shopCount = new Set(group.services.map((s) => s.shopId)).size;

  return (
    <Card className="overflow-hidden border-0 shadow-card dark:shadow-card-dark">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b bg-muted/20 p-4 text-left sm:p-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15">
            <Tag className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold">{group.category}</h3>
            <p className="text-xs text-muted-foreground">
              {group.services.length} listings • {shopCount} shop{shopCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div>
          {group.services.map((svc) => (
            <ServiceRow key={svc.id} svc={svc} shop={shopMap.get(svc.shopId)} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function AdminServicesView() {
  const services = usePlatformStore((s) => s.services);
  const shops = usePlatformStore((s) => s.shops);

  const [search, setSearch] = useState("");
  const [shopFilter, setShopFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | "all">("all");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [shopStatusFilter, setShopStatusFilter] = useState<Shop["status"] | "all">("all");
  const [groupMode, setGroupMode] = useState<GroupMode>("shop");

  const shopMap = useMemo(() => new Map(shops.map((s) => [s.id, s])), [shops]);

  const owners = useMemo(() => {
    const seen = new Map<string, string>();
    for (const shop of shops) {
      if (!seen.has(shop.ownerId)) seen.set(shop.ownerId, shop.ownerName);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [shops]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((svc) => {
      const shop = shopMap.get(svc.shopId);
      if (!shop) return false;

      if (shopFilter !== "all" && svc.shopId !== shopFilter) return false;
      if (ownerFilter !== "all" && shop.ownerId !== ownerFilter) return false;
      if (categoryFilter !== "all" && svc.category !== categoryFilter) return false;
      if (networkFilter !== "all" && svc.network !== networkFilter) return false;
      if (shopStatusFilter !== "all" && shop.status !== shopStatusFilter) return false;

      if (pricingFilter === "per_gb" && !isPerGbService(svc)) return false;
      if (pricingFilter === "fixed" && isPerGbService(svc)) return false;
      if (stockFilter === "in" && !svc.inStock) return false;
      if (stockFilter === "out" && svc.inStock) return false;

      if (!q) return true;
      return (
        svc.name.toLowerCase().includes(q) ||
        svc.category.toLowerCase().includes(q) ||
        svc.network?.toLowerCase().includes(q) ||
        shop.name.toLowerCase().includes(q) ||
        shop.ownerName.toLowerCase().includes(q) ||
        shop.city.toLowerCase().includes(q)
      );
    });
  }, [
    services,
    shopMap,
    search,
    shopFilter,
    ownerFilter,
    categoryFilter,
    networkFilter,
    pricingFilter,
    stockFilter,
    shopStatusFilter
  ]);

  const shopGroups = useMemo((): ShopGroup[] => {
    const byShop = new Map<string, ServiceListing[]>();
    for (const svc of filtered) {
      const arr = byShop.get(svc.shopId) ?? [];
      arr.push(svc);
      byShop.set(svc.shopId, arr);
    }

    return [...byShop.entries()]
      .map(([shopId, list]) => {
        const shop = shopMap.get(shopId);
        if (!shop) return null;
        return {
          shop,
          services: [...list].sort((a, b) => {
            if (a.category !== b.category) return a.category.localeCompare(b.category);
            return a.name.localeCompare(b.name);
          })
        };
      })
      .filter((g): g is ShopGroup => g !== null)
      .sort((a, b) => {
        if (a.shop.status !== b.shop.status) {
          const order = { active: 0, pending: 1, suspended: 2 };
          return order[a.shop.status] - order[b.shop.status];
        }
        return a.shop.name.localeCompare(b.shop.name);
      });
  }, [filtered, shopMap]);

  const categoryGroups = useMemo((): CategoryGroup[] => {
    const byCat = new Map<ServiceCategory, ServiceListing[]>();
    for (const svc of filtered) {
      const arr = byCat.get(svc.category) ?? [];
      arr.push(svc);
      byCat.set(svc.category, arr);
    }

    return categories
      .filter((c) => byCat.has(c))
      .map((category) => ({
        category,
        services: [...(byCat.get(category) ?? [])].sort((a, b) => {
          const shopA = shopMap.get(a.shopId)?.name ?? "";
          const shopB = shopMap.get(b.shopId)?.name ?? "";
          if (shopA !== shopB) return shopA.localeCompare(shopB);
          return a.name.localeCompare(b.name);
        })
      }));
  }, [filtered, shopMap]);

  const stats = useMemo(() => {
    const shopIds = new Set(services.map((s) => s.shopId));
    const ownersSet = new Set(
      services.map((s) => shopMap.get(s.shopId)?.ownerId).filter(Boolean)
    );
    return {
      total: services.length,
      shops: shopIds.size,
      owners: ownersSet.size,
      inStock: services.filter((s) => s.inStock).length,
      perGb: services.filter(isPerGbService).length,
      categories: new Set(services.map((s) => s.category)).size
    };
  }, [services, shopMap]);

  const hasFilters =
    search.trim().length > 0 ||
    shopFilter !== "all" ||
    ownerFilter !== "all" ||
    categoryFilter !== "all" ||
    networkFilter !== "all" ||
    pricingFilter !== "all" ||
    stockFilter !== "all" ||
    shopStatusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setShopFilter("all");
    setOwnerFilter("all");
    setCategoryFilter("all");
    setNetworkFilter("all");
    setPricingFilter("all");
    setStockFilter("all");
    setShopStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Platform services</h1>
          <p className="text-sm text-muted-foreground">
            Browse listings by shop owner, category, network, and pricing model
          </p>
        </div>
        <Badge variant="outline" className="rounded-full px-3 py-1">
          {filtered.length} of {services.length} shown
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total listings" value={String(stats.total)} icon={Package} accent="brand" />
        <StatCard
          title="Shop owners"
          value={String(stats.owners)}
          hint={`${stats.shops} shops`}
          icon={User}
          accent="mtn"
        />
        <StatCard
          title="Live listings"
          value={String(stats.inStock)}
          hint={`${stats.perGb} per-GB data plans`}
          icon={Zap}
          accent="telecel"
        />
        <StatCard
          title="Categories"
          value={String(stats.categories)}
          icon={LayoutGrid}
          accent="brand"
        />
      </div>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters & grouping
            </div>
            <div className="flex rounded-xl border p-1">
              <Button
                type="button"
                size="sm"
                variant={groupMode === "shop" ? "brand" : "ghost"}
                className="h-8 rounded-lg text-xs"
                onClick={() => setGroupMode("shop")}
              >
                <Store className="mr-1 h-3.5 w-3.5" />
                By shop
              </Button>
              <Button
                type="button"
                size="sm"
                variant={groupMode === "category" ? "brand" : "ghost"}
                className="h-8 rounded-lg text-xs"
                onClick={() => setGroupMode("category")}
              >
                <Tag className="mr-1 h-3.5 w-3.5" />
                By category
              </Button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-12">
            <div className="relative lg:col-span-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search service, shop, owner…"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm lg:col-span-2"
            >
              <option value="all">All owners</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>

            <select
              value={shopFilter}
              onChange={(e) => setShopFilter(e.target.value)}
              className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm lg:col-span-2"
            >
              <option value="all">All shops</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ServiceCategory | "all")}
              className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm lg:col-span-2"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm lg:col-span-1"
            >
              <option value="all">Network</option>
              {networks.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <select
              value={pricingFilter}
              onChange={(e) => setPricingFilter(e.target.value as PricingFilter)}
              className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm lg:col-span-1"
            >
              <option value="all">Pricing</option>
              <option value="per_gb">Per GB</option>
              <option value="fixed">Fixed</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm lg:col-span-1"
            >
              <option value="all">Stock</option>
              <option value="in">Live</option>
              <option value="out">Hidden</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Shop status:</span>
            {(["all", "active", "pending", "suspended"] as const).map((s) => (
              <Badge
                key={s}
                variant={shopStatusFilter === s ? "default" : "outline"}
                className={cn(
                  "cursor-pointer capitalize",
                  shopStatusFilter === s && s === "all" && "gradient-mtn text-charcoal"
                )}
                onClick={() => setShopStatusFilter(s)}
              >
                {s}
              </Badge>
            ))}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto gap-1 text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-0 p-12 text-center shadow-card dark:shadow-card-dark">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">No services match your filters</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different shop owner, category, or network.
          </p>
          {hasFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Reset filters
            </Button>
          )}
        </Card>
      ) : groupMode === "shop" ? (
        <div className="space-y-5">
          {shopGroups.map((group, i) => (
            <ShopSection key={group.shop.id} group={group} defaultOpen={i < 3} />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {categoryGroups.map((group) => (
            <CategorySection key={group.category} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
