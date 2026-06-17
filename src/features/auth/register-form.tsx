"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Store, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlatformStore } from "@/stores/platform-store";
import { cn } from "@/lib/utils";

const cities = ["Accra", "Kumasi", "Takoradi", "Tema", "Tamale", "Cape Coast"];

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("type") === "shop" ? "shop" : "customer";

  const registerCustomer = usePlatformStore((s) => s.registerCustomer);
  const registerShopOwner = usePlatformStore((s) => s.registerShopOwner);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "Accra",
    shopName: "",
    shopDescription: ""
  });

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submitCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = registerCustomer({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      city: form.city
    });
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Account created! Welcome to BundleHub.");
    router.push("/app/customer");
  };

  const submitShop = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = registerShopOwner({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      city: form.city,
      shopName: form.shopName,
      shopDescription: form.shopDescription
    });
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Shop submitted! An admin will review your application.");
    router.push("/app/shop_owner");
  };

  const fields = (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Full name</label>
        <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Email</label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Password</label>
        <Input
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          minLength={6}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Phone</label>
          <Input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="0241234567"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">City</label>
          <select
            className="flex h-10 w-full rounded-xl border bg-background px-3 text-sm"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );

  return (
    <Card className="w-full max-w-lg border-0 shadow-brand">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="font-display text-2xl">Create your account</CardTitle>
        <p className="text-sm text-muted-foreground">
          Stored in localStorage — ready for database sync later
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="customer" className="gap-2">
              <User className="h-4 w-4" /> Customer
            </TabsTrigger>
            <TabsTrigger value="shop" className="gap-2">
              <Store className="h-4 w-4" /> Shop owner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer">
            <form onSubmit={submitCustomer} className="space-y-4">
              {fields}
              <Button type="submit" variant="brand" className="w-full" disabled={loading}>
                {loading ? "Creating…" : "Create customer account"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="shop">
            <form onSubmit={submitShop} className="space-y-4">
              {fields}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Shop name</label>
                <Input
                  value={form.shopName}
                  onChange={(e) => update("shopName", e.target.value)}
                  placeholder="Swift Connect Digital"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Shop description</label>
                <Input
                  value={form.shopDescription}
                  onChange={(e) => update("shopDescription", e.target.value)}
                  placeholder="MTN & Telecel bundles, ECG tokens…"
                />
              </div>
              <div className="rounded-2xl bg-mtn/10 p-3 text-xs text-muted-foreground">
                Your shop will be <strong>pending</strong> until a super admin approves it.
              </div>
              <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                {loading ? "Submitting…" : "Register shop"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className={cn("font-medium text-secondary hover:underline")}>
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
