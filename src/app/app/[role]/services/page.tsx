"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser, useUserShop } from "@/hooks/use-platform";
import { formatGhs } from "@/lib/format";
import { Plus, Search } from "lucide-react";
import type { ServiceCategory } from "@/types/marketplace";

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

export default function ServicesPage() {
  const user = useCurrentUser();
  const shop = useUserShop(user?.id, user?.shopId);
  const allServices = usePlatformStore((s) => s.services);
  const addService = usePlatformStore((s) => s.addService);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Data Bundles" as ServiceCategory,
    priceGhs: "",
    description: ""
  });

  const myServices = user?.shopId
    ? allServices.filter((s) => s.shopId === user.shopId)
    : [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.shopId || !shop) return;
    if (shop.status !== "active") {
      toast.error("Shop must be approved before listings go live.");
    }
    addService(user.shopId, {
      category: form.category,
      name: form.name,
      description: form.description || `${form.name} — fulfilled manually`,
      priceGhs: Number(form.priceGhs),
      inStock: true,
      deliverySpeedMins: 15
    });
    toast.success(
      shop.status === "active"
        ? "Service added to marketplace"
        : "Service saved — visible after shop approval"
    );
    setForm({ name: "", category: "Data Bundles", priceGhs: "", description: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Services</h1>
          <p className="text-sm text-muted-foreground">
            {shop?.name ?? "Your shop"} — {myServices.length} listing
            {myServices.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="brand" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Add listing
        </Button>
      </div>

      {showForm && (
        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardContent className="p-6">
            <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">Service name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="MTN 10GB Bundle"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Category</label>
                <select
                  className="flex h-10 w-full rounded-xl border bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value as ServiceCategory }))
                  }
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Price (GHS)</label>
                <Input
                  type="number"
                  min="1"
                  value={form.priceGhs}
                  onChange={(e) => setForm((f) => ({ ...f, priceGhs: e.target.value }))}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" variant="brand">
                  Save listing
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search services…" className="pl-10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {myServices.length === 0 ? (
          <Card className="col-span-full border-0 p-8 text-center text-muted-foreground">
            No services yet. Add your first listing above.
          </Card>
        ) : (
          myServices.map((svc) => (
            <Card key={svc.id} className="border-0 shadow-card dark:shadow-card-dark">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {svc.category}
                  </Badge>
                  <Badge className={svc.inStock ? "bg-emerald-600/10 text-emerald-700" : ""}>
                    {svc.inStock ? "In stock" : "Out"}
                  </Badge>
                </div>
                <h3 className="mt-3 font-semibold">{svc.name}</h3>
                <p className="mt-3 font-display text-xl font-bold text-mtn">
                  {formatGhs(svc.priceGhs)}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-telecel">
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
