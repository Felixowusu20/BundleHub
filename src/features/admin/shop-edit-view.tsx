"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Save,
  Trash2,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { TrustScore } from "@/components/shared/trust-score";
import { usePlatformStore } from "@/stores/platform-store";
import { formatDate } from "@/lib/format";
import type { Shop, UpdateShopInput } from "@/types/marketplace";

const ghanaCities = [
  "Accra",
  "Kumasi",
  "Takoradi",
  "Tamale",
  "Cape Coast",
  "Tema",
  "Ho",
  "Sunyani"
];

type Props = {
  shopId: string;
};

export function ShopEditView({ shopId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shop = usePlatformStore((s) => s.shops.find((sh) => sh.id === shopId));
  const services = usePlatformStore((s) => s.services);
  const orders = usePlatformStore((s) => s.orders);
  const updateShop = usePlatformStore((s) => s.updateShop);
  const deleteShop = usePlatformStore((s) => s.deleteShop);

  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Shop["status"]>("pending");
  const [featured, setFeatured] = useState(false);
  const [trustScore, setTrustScore] = useState(50);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (!shop) return;
    setName(shop.name);
    setOwnerName(shop.ownerName);
    setPhone(shop.phone);
    setCity(shop.city);
    setDescription(shop.description ?? "");
    setStatus(shop.status);
    setFeatured(shop.featured);
    setTrustScore(shop.trustScore);
  }, [shop]);

  useEffect(() => {
    if (searchParams.get("delete") === "1") setDeleteOpen(true);
  }, [searchParams]);

  const serviceCount = useMemo(
    () => services.filter((s) => s.shopId === shopId).length,
    [services, shopId]
  );
  const orderCount = useMemo(
    () => orders.filter((o) => o.shopId === shopId).length,
    [orders, shopId]
  );

  if (!shop) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Shop not found.</p>
        <Button variant="brand" asChild>
          <Link href="/app/super_admin/shops">Back to shops</Link>
        </Button>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerName.trim() || !phone.trim() || !city.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const input: UpdateShopInput = {
      name: name.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      description: description.trim(),
      status,
      featured,
      trustScore: Math.min(100, Math.max(0, trustScore))
    };

    setSaving(true);
    const result = updateShop(shopId, input);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Shop updated successfully.");
  };

  const handleDelete = () => {
    if (deleteConfirm !== shop.name) {
      toast.error("Type the shop name exactly to confirm deletion.");
      return;
    }
    const result = deleteShop(shopId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${shop.name} has been deleted.`);
    router.push("/app/super_admin/shops");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="rounded-full">
          <Link href="/app/super_admin/shops">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Shops
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-mtn/15 font-display text-xl font-bold text-mtn">
            {shop.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Edit shop</h1>
            <p className="text-sm text-muted-foreground">
              {shop.id} • Created {formatDate(shop.createdAt)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {shop.status}
              </Badge>
              {shop.featured && (
                <Badge className="gradient-mtn text-charcoal">Featured</Badge>
              )}
              <TrustScore score={shop.trustScore} size="sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{serviceCount}</p>
            <p className="text-xs text-muted-foreground">Services</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{orderCount}</p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{shop.rating || "—"}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-mtn" />
              Shop details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Shop name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="What does this shop sell?"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-mtn" />
              Owner & contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Owner name
              </label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                City
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                list="ghana-cities"
                required
                className="rounded-xl"
              />
              <datalist id="ghana-cities">
                {ghanaCities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardHeader>
            <CardTitle className="text-base">Status & visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Shop status</label>
              <div className="flex flex-wrap gap-2">
                {(["pending", "active", "suspended"] as const).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={status === s ? "brand" : "outline"}
                    className="capitalize"
                    onClick={() => setStatus(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4">
              <div>
                <p className="text-sm font-medium">Featured on marketplace</p>
                <p className="text-xs text-muted-foreground">
                  Highlight this shop in search and listings
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={featured ? "brand" : "outline"}
                onClick={() => setFeatured(!featured)}
              >
                {featured ? "Featured" : "Not featured"}
              </Button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Trust score ({trustScore}/100)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={trustScore}
                onChange={(e) => setTrustScore(Number(e.target.value))}
                className="w-full accent-mtn"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="brand" disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/app/super_admin/shops">Cancel</Link>
          </Button>
        </div>
      </form>

      <Card className="border border-telecel/30 bg-telecel/5 shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-telecel">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Delete this shop</p>
            <p className="text-xs text-muted-foreground">
              Permanently removes the shop, its {serviceCount} service
              {serviceCount !== 1 ? "s" : ""}, {orderCount} order
              {orderCount !== 1 ? "s" : ""}, and messages. This cannot be undone.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-telecel/40 text-telecel hover:bg-telecel/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete shop
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {shop.name}?</DialogTitle>
            <p className="text-sm text-muted-foreground">
              This will permanently remove the shop and all related data from the platform.
              Type <strong>{shop.name}</strong> below to confirm.
            </p>
          </DialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={shop.name}
            className="rounded-xl"
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== shop.name}
              onClick={handleDelete}
            >
              Delete permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
