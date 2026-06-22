"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Filter,
  MessageSquare,
  MoreHorizontal,
  Package,
  Search,
  Trash2,
  User,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { usePlatformStore } from "@/stores/platform-store";
import { formatGhs, formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/marketplace";

const statuses: OrderStatus[] = [
  "pending",
  "accepted",
  "processing",
  "completed",
  "cancelled",
  "disputed"
];

type DatePreset = "all" | "today" | "yesterday" | "last7" | "last30";

function statusVariant(status: OrderStatus) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "disputed":
      return "outline" as const;
    case "cancelled":
      return "outline" as const;
    default:
      return "info" as const;
  }
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateGroupLabel(iso: string) {
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";

  return d.toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function matchesDatePreset(iso: string, preset: DatePreset) {
  if (preset === "all") return true;
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const orderDay = startOfDay(d);
  const diffDays = Math.floor((today.getTime() - orderDay.getTime()) / 86_400_000);

  if (preset === "today") return diffDays === 0;
  if (preset === "yesterday") return diffDays === 1;
  if (preset === "last7") return diffDays >= 0 && diffDays < 7;
  if (preset === "last30") return diffDays >= 0 && diffDays < 30;
  return true;
}

function adminNextStatuses(status: OrderStatus): OrderStatus[] {
  const map: Record<OrderStatus, OrderStatus[]> = {
    pending: ["accepted", "processing", "completed", "cancelled"],
    accepted: ["processing", "completed", "cancelled"],
    processing: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
    disputed: ["processing", "completed", "cancelled"]
  };
  return map[status];
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant={statusVariant(status)}
      className={cn(
        "capitalize",
        status === "disputed" && "border-telecel/50 bg-telecel/10 text-telecel",
        status === "cancelled" && "text-muted-foreground"
      )}
    >
      {status}
    </Badge>
  );
}

export function AdminOrdersView() {
  const orders = usePlatformStore((s) => s.orders);
  const services = usePlatformStore((s) => s.services);
  const shops = usePlatformStore((s) => s.shops);
  const users = usePlatformStore((s) => s.users);
  const updateOrderStatus = usePlatformStore((s) => s.updateOrderStatus);
  const deleteOrder = usePlatformStore((s) => s.deleteOrder);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [shopFilter, setShopFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  const shopMap = useMemo(() => new Map(shops.map((s) => [s.id, s])), [shops]);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const customers = useMemo(
    () => users.filter((u) => u.role === "customer"),
    [users]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...orders]
      .filter((o) => {
        if (statusFilter !== "all" && o.status !== statusFilter) return false;
        if (shopFilter !== "all" && o.shopId !== shopFilter) return false;
        if (customerFilter !== "all" && o.customerId !== customerFilter) return false;
        if (!matchesDatePreset(o.createdAt, datePreset)) return false;

        if (!q) return true;
        const shop = shopMap.get(o.shopId);
        const customer = userMap.get(o.customerId);
        const service = serviceMap.get(o.serviceId);
        return (
          o.id.toLowerCase().includes(q) ||
          shop?.name.toLowerCase().includes(q) ||
          customer?.name.toLowerCase().includes(q) ||
          customer?.email.toLowerCase().includes(q) ||
          service?.name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [
    orders,
    statusFilter,
    shopFilter,
    customerFilter,
    datePreset,
    search,
    shopMap,
    userMap,
    serviceMap
  ]);

  const grouped = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of filtered) {
      const key = dateGroupLabel(o.createdAt);
      const arr = map.get(key) ?? [];
      arr.push(o);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [filtered]);

  const stats = useMemo(() => {
    const total = orders.length;
    const volume = orders.reduce((s, o) => s + o.amountGhs, 0);
    const commission = orders.reduce((s, o) => s + o.platformCommissionGhs, 0);
    const pending = orders.filter((o) =>
      ["pending", "accepted", "processing"].includes(o.status)
    ).length;
    const disputed = orders.filter((o) => o.status === "disputed").length;
    return { total, volume, commission, pending, disputed };
  }, [orders]);

  const hasFilters =
    statusFilter !== "all" ||
    shopFilter !== "all" ||
    customerFilter !== "all" ||
    datePreset !== "all" ||
    search.trim().length > 0;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setShopFilter("all");
    setCustomerFilter("all");
    setDatePreset("all");
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    const result = await updateOrderStatus(orderId, status);
    if (!result.ok) toast.error(result.error);
    else toast.success(`Order marked as ${status}`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteOrder(deleteTarget.id);
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Order removed from platform");
    if (expandedId === deleteTarget.id) setExpandedId(null);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Platform orders</h1>
          <p className="text-sm text-muted-foreground">
            Monitor transactions, resolve disputes, and manage order lifecycle
          </p>
        </div>
        <Badge variant="outline" className="rounded-full px-3 py-1">
          {filtered.length} of {orders.length} shown
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total orders" value={String(stats.total)} icon={Package} accent="brand" />
        <StatCard
          title="Gross volume"
          value={formatGhs(stats.volume)}
          icon={Calendar}
          accent="mtn"
        />
        <StatCard
          title="Active pipeline"
          value={String(stats.pending)}
          hint="pending · accepted · processing"
          icon={Filter}
          accent="telecel"
        />
        <StatCard
          title="Disputes"
          value={String(stats.disputed)}
          hint={`${formatGhs(stats.commission)} platform commission`}
          icon={AlertTriangle}
          accent="telecel"
        />
      </div>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filters
          </div>

          <div className="grid gap-3 lg:grid-cols-12">
            <div className="relative lg:col-span-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search order, shop, customer…"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
              className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm lg:col-span-2"
            >
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
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
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm lg:col-span-2"
            >
              <option value="all">All customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm lg:col-span-2"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
            </select>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-0 p-12 text-center shadow-card dark:shadow-card-dark">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">No orders match your filters</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting shop, customer, date, or status filters.
          </p>
          {hasFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Reset filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(([dateLabel, dayOrders]) => (
            <section key={dateLabel} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 items-center gap-2 rounded-full bg-mtn/10 px-4 text-sm font-semibold text-mtn">
                  <Calendar className="h-4 w-4" />
                  {dateLabel}
                </div>
                <span className="text-xs text-muted-foreground">
                  {dayOrders.length} order{dayOrders.length !== 1 ? "s" : ""}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Card className="overflow-hidden border-0 shadow-card dark:shadow-card-dark">
                <div className="hidden border-b bg-muted/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[1.2fr_1fr_1fr_1fr_0.7fr_0.8fr_0.5fr] md:gap-3">
                  <span>Order</span>
                  <span>Customer</span>
                  <span>Shop</span>
                  <span>Service</span>
                  <span className="text-right">Amount</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>

                <div className="divide-y">
                  {dayOrders.map((o) => {
                    const shop = shopMap.get(o.shopId);
                    const customer = userMap.get(o.customerId);
                    const service = serviceMap.get(o.serviceId);
                    const expanded = expandedId === o.id;
                    const nextStatuses = adminNextStatuses(o.status);

                    return (
                      <div key={o.id} className="bg-card">
                        <div
                          className={cn(
                            "grid gap-3 px-4 py-4 transition-colors md:grid-cols-[1.2fr_1fr_1fr_1fr_0.7fr_0.8fr_0.5fr] md:items-center",
                            expanded && "bg-muted/20"
                          )}
                        >
                          <button
                            type="button"
                            className="flex min-w-0 items-start gap-2 text-left"
                            onClick={() => setExpandedId(expanded ? null : o.id)}
                          >
                            {expanded ? (
                              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-mono text-xs font-medium">{o.id}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatTime(o.createdAt)}
                              </p>
                            </div>
                          </button>

                          <div className="flex min-w-0 items-center gap-2 md:block">
                            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground md:hidden" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {customer?.name ?? "Unknown"}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {customer?.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex min-w-0 items-center gap-2 md:block">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground md:hidden" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {shop?.name ?? "—"}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {shop?.city}
                              </p>
                            </div>
                          </div>

                          <p className="truncate text-sm">{service?.name ?? "Service"}</p>

                          <div className="text-left md:text-right">
                            <p className="font-display font-bold text-mtn">
                              {formatGhs(o.amountGhs)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              fee {formatGhs(o.platformCommissionGhs)}
                            </p>
                          </div>

                          <div>
                            <OrderStatusBadge status={o.status} />
                          </div>

                          <div className="flex justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                {nextStatuses.map((s) => (
                                  <DropdownMenuItem
                                    key={s}
                                    className="capitalize"
                                    onClick={() => handleStatusChange(o.id, s)}
                                  >
                                    Mark {s}
                                  </DropdownMenuItem>
                                ))}
                                {nextStatuses.length > 0 && <DropdownMenuSeparator />}
                                {o.conversationId && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/app/super_admin/messages?c=${o.conversationId}`}>
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      Open chat
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-telecel focus:text-telecel"
                                  onClick={() => setDeleteTarget(o)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {expanded && (
                          <div className="border-t bg-muted/10 px-4 py-4 md:px-8">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <div className="rounded-2xl border bg-card p-4">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Customer
                                </p>
                                <p className="mt-1 font-medium">{customer?.name}</p>
                                <p className="text-xs text-muted-foreground">{customer?.email}</p>
                                <p className="text-xs text-muted-foreground">{customer?.phone}</p>
                              </div>
                              <div className="rounded-2xl border bg-card p-4">
                                <p className="text-xs font-medium text-muted-foreground">Shop</p>
                                <p className="mt-1 font-medium">{shop?.name}</p>
                                <p className="text-xs text-muted-foreground">{shop?.ownerName}</p>
                                <p className="text-xs text-muted-foreground">{shop?.phone}</p>
                              </div>
                              <div className="rounded-2xl border bg-card p-4">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Transaction
                                </p>
                                <p className="mt-1 font-medium">{formatGhs(o.amountGhs)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Commission {formatGhs(o.platformCommissionGhs)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(o.createdAt)}
                                </p>
                              </div>
                            </div>

                            {o.details && (
                              <div className="mt-4 rounded-2xl border bg-card p-4">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Order details
                                </p>
                                <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                                  {o.details.phoneNumber && (
                                    <p>Phone: {o.details.phoneNumber}</p>
                                  )}
                                  {o.details.network && <p>Network: {o.details.network}</p>}
                                  {o.details.quantityGb && (
                                    <p>Data: {o.details.quantityGb} GB</p>
                                  )}
                                  {o.details.meterNumber && (
                                    <p>Meter: {o.details.meterNumber}</p>
                                  )}
                                  {o.details.notes && <p>Notes: {o.details.notes}</p>}
                                </div>
                              </div>
                            )}

                            <div className="mt-4 flex flex-wrap gap-2">
                              {nextStatuses.map((s) => (
                                <Button
                                  key={s}
                                  size="sm"
                                  variant={s === "cancelled" ? "outline" : "brand"}
                                  className="capitalize"
                                  onClick={() => handleStatusChange(o.id, s)}
                                >
                                  Mark {s}
                                </Button>
                              ))}
                              {o.conversationId && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/app/super_admin/messages?c=${o.conversationId}`}>
                                    <MessageSquare className="mr-1 h-4 w-4" />
                                    Chat
                                  </Link>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-telecel hover:text-telecel"
                                onClick={() => setDeleteTarget(o)}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete order?"
        description="This permanently removes the order from the platform ledger."
        itemLabel="Order"
        itemDetail={
          deleteTarget
            ? `${deleteTarget.id} • ${formatGhs(deleteTarget.amountGhs)}`
            : undefined
        }
        warning={
          deleteTarget &&
          ["pending", "accepted", "processing", "disputed"].includes(deleteTarget.status)
            ? "The customer will be refunded to their wallet. Chat thread and reviews for this order will also be removed."
            : "Chat thread and reviews linked to this order will be removed. Completed order payouts are not reversed."
        }
        confirmLabel="Delete order"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
