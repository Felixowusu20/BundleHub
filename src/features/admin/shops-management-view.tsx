"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Pencil,
  Search,
  ShieldOff,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { TrustScore } from "@/components/shared/trust-score";
import { usePlatformStore } from "@/stores/platform-store";
import { formatDate } from "@/lib/format";
import type { Shop } from "@/types/marketplace";

function ShopStatusBadge({ status }: { status: Shop["status"] }) {
  return (
    <Badge
      variant={
        status === "active" ? "success" : status === "pending" ? "warning" : "outline"
      }
      className="capitalize"
    >
      {status}
    </Badge>
  );
}

function ShopCard({ shop }: { shop: Shop }) {
  const approveShop = usePlatformStore((s) => s.approveShop);
  const suspendShop = usePlatformStore((s) => s.suspendShop);
  const activateShop = usePlatformStore((s) => s.activateShop);
  const featureShop = usePlatformStore((s) => s.featureShop);
  const services = usePlatformStore((s) => s.services);
  const serviceCount = services.filter((s) => s.shopId === shop.id).length;

  const editHref = `/app/super_admin/shops/${shop.id}/edit`;

  return (
    <Card className="border-0 shadow-card transition-shadow hover:shadow-brand dark:shadow-card-dark">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mtn/15 font-display text-lg font-bold text-mtn">
              {shop.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold">{shop.name}</h3>
                {shop.featured && (
                  <Badge className="gradient-mtn text-[10px] text-charcoal">Featured</Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {shop.ownerName} • {shop.city}
              </p>
              {shop.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {shop.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{shop.phone}</span>
                <span>•</span>
                <span>{serviceCount} service{serviceCount !== 1 ? "s" : ""}</span>
                <span>•</span>
                <span>Joined {formatDate(shop.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-end lg:flex-row lg:items-center">
            <TrustScore score={shop.trustScore} size="sm" />
            <ShopStatusBadge status={shop.status} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {shop.status === "pending" && (
              <Button
                size="sm"
                variant="brand"
                onClick={() => {
                  approveShop(shop.id);
                  toast.success(`${shop.name} approved.`);
                }}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Approve
              </Button>
            )}
            {shop.status === "active" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    suspendShop(shop.id);
                    toast.success(`${shop.name} suspended.`);
                  }}
                >
                  <ShieldOff className="mr-1.5 h-4 w-4" />
                  Suspend
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    featureShop(shop.id, !shop.featured);
                    toast.success(shop.featured ? "Removed from featured" : "Shop featured");
                  }}
                >
                  <Star className="mr-1.5 h-4 w-4" />
                  {shop.featured ? "Unfeature" : "Feature"}
                </Button>
              </>
            )}
            {shop.status === "suspended" && (
              <Button
                size="sm"
                variant="brand"
                onClick={() => {
                  activateShop(shop.id);
                  toast.success(`${shop.name} reactivated.`);
                }}
              >
                Reactivate
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={editHref}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={editHref}>Edit shop</Link>
                </DropdownMenuItem>
                {shop.status === "pending" && (
                  <DropdownMenuItem
                    onClick={() => {
                      approveShop(shop.id);
                      toast.success(`${shop.name} approved.`);
                    }}
                  >
                    Approve
                  </DropdownMenuItem>
                )}
                {shop.status === "active" && (
                  <DropdownMenuItem
                    onClick={() => {
                      suspendShop(shop.id);
                      toast.success(`${shop.name} suspended.`);
                    }}
                  >
                    Suspend
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="text-telecel focus:text-telecel">
                  <Link href={`${editHref}?delete=1`}>Delete shop…</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ShopsManagementView() {
  const shops = usePlatformStore((s) => s.shops);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return shops;
    const q = query.toLowerCase();
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }, [shops, query]);

  const pending = filtered.filter((s) => s.status === "pending");
  const active = filtered.filter((s) => s.status === "active");
  const suspended = filtered.filter((s) => s.status === "suspended");

  const stats = [
    { label: "Total shops", value: shops.length, icon: Building2, accent: "brand" as const },
    { label: "Pending", value: shops.filter((s) => s.status === "pending").length, icon: Clock, accent: "telecel" as const },
    { label: "Active", value: shops.filter((s) => s.status === "active").length, icon: CheckCircle2, accent: "mtn" as const },
    { label: "Suspended", value: shops.filter((s) => s.status === "suspended").length, icon: ShieldOff, accent: "telecel" as const }
  ];

  const renderList = (list: Shop[]) => (
    <div className="space-y-3">
      {list.length === 0 ? (
        <Card className="border-0 p-10 text-center shadow-card dark:shadow-card-dark">
          <p className="text-sm text-muted-foreground">
            {query ? "No shops match your search." : "No shops in this category."}
          </p>
        </Card>
      ) : (
        list.map((shop) => <ShopCard key={shop.id} shop={shop} />)
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-charcoal p-6 text-white md:p-8 dark:bg-card">
        <p className="text-sm text-white/60">Super Admin</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Shop Management</h1>
        <p className="mt-2 max-w-xl text-sm text-white/70">
          Approve registrations, edit shop profiles, suspend sellers, or remove shops from the
          marketplace.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-0 shadow-card dark:shadow-card-dark">
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`rounded-2xl p-3 ${
                  s.accent === "mtn"
                    ? "bg-mtn/15"
                    : s.accent === "telecel"
                      ? "bg-telecel/15"
                      : "bg-secondary/15"
                }`}
              >
                <s.icon
                  className={`h-5 w-5 ${
                    s.accent === "mtn"
                      ? "text-mtn"
                      : s.accent === "telecel"
                        ? "text-telecel"
                        : "text-secondary"
                  }`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, owner, city, phone…"
          className="rounded-2xl pl-10"
        />
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="suspended" className="text-xs sm:text-sm">
            Suspended ({suspended.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All ({filtered.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          {renderList(pending)}
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          {renderList(active)}
        </TabsContent>
        <TabsContent value="suspended" className="mt-4">
          {renderList(suspended)}
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          {renderList(filtered)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
