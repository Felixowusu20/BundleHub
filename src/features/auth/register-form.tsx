"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import { ProfilePicturePicker } from "@/components/shared/profile-picture-picker";
import { postAuth, storeDevVerifyUrl, storePendingLogin } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const cities = ["Accra", "Kumasi", "Takoradi", "Tema", "Tamale", "Cape Coast"];

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("type") === "shop" ? "shop" : "customer";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "Accra",
    shopName: "",
    shopDescription: "",
    avatarUrl: null as string | null,
    confirmPassword: ""
  });

  const update = (key: string, value: string | null) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (type: "customer" | "shop_owner") => {
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword: _, ...payload } = form;
      const data = await postAuth("/api/auth/register", { type, ...payload });

      if (!data.ok || !data.email) {
        setError(data.error ?? "Registration failed");
        return;
      }

      if (data.devVerifyUrl) {
        storeDevVerifyUrl(String(data.devVerifyUrl));
      }

      storePendingLogin(String(data.email), form.password);

      router.push(`/auth/verify-email?email=${encodeURIComponent(String(data.email))}`);
    } catch {
      setError("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const fields = (
    <>
      <ProfilePicturePicker
        email={form.email || "you@example.com"}
        name={form.name}
        value={form.avatarUrl}
        onChange={(avatarUrl) => update("avatarUrl", avatarUrl)}
        disabled={loading}
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium">Full name</label>
        <Input
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          autoComplete="name"
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Email</label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Password</label>
        <PasswordInput
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
        <PasswordInput
          value={form.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
          autoComplete="new-password"
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
            autoComplete="tel"
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
    <div className="relative">
      <ActionLoadingOverlay active={loading} label="Creating your account…" />
      <Card className="w-full max-w-lg border-0 shadow-brand">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="font-display text-2xl">Create your account</CardTitle>
          <p className="text-sm text-muted-foreground">
            We&apos;ll email you a verification link after signup
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-xl bg-telecel/10 px-3 py-2 text-sm text-telecel">{error}</p>
          )}
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit("customer");
                }}
                className="space-y-4"
              >
                {fields}
                <Button type="submit" variant="brand" className="w-full" disabled={loading}>
                  Create customer account
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="shop">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit("shop_owner");
                }}
                className="space-y-4"
              >
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
                  Your shop will be <strong>pending</strong> until a platform admin approves it.
                </div>
                <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                  Register shop
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
    </div>
  );
}
