"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ProfilePicturePicker } from "@/components/shared/profile-picture-picker";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import { usePlatformStore } from "@/stores/platform-store";
import { useAuthUser } from "@/hooks/use-platform";
import { useAuthSession } from "@/providers/auth-provider";
import type { AuthUser } from "@/types/auth";

export default function SettingsPage() {
  const authUser = useAuthUser();
  const { setUser } = useAuthSession();
  const resetLocalCache = usePlatformStore((s) => s.resetLocalCache);
  const initialize = usePlatformStore((s) => s.initialize);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    avatarUrl: null as string | null
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!authUser) return;
    setForm({
      name: authUser.name,
      phone: authUser.phone,
      city: authUser.city,
      avatarUrl: authUser.avatarUrl
    });
  }, [authUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await res.json()) as { user?: AuthUser; error?: string };
      if (!res.ok || !data.user) {
        toast.error(data.error ?? "Could not save profile");
        return;
      }
      setUser(data.user);
      toast.success("Profile updated");
    } catch {
      toast.error("Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (
      !confirm(
        "Reset browser cache? Locally saved orders and messages will be cleared."
      )
    ) {
      return;
    }
    resetLocalCache();
    toast.success("Browser cache cleared");
  };

  return (
    <div className="relative space-y-6">
      <ActionLoadingOverlay active={loading} label="Saving profile…" />

      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile & preferences</p>
      </div>

      {authUser && (
        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardHeader>
            <CardTitle className="text-base">Your profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <ProfilePicturePicker
                email={authUser.email}
                name={form.name}
                value={form.avatarUrl}
                onChange={(avatarUrl) => setForm((f) => ({ ...f, avatarUrl }))}
                disabled={loading}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input value={authUser.email} disabled className="flex-1" />
                  {authUser.emailVerified ? (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                      Verified
                    </span>
                  ) : (
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href={`/auth/verify-email?email=${encodeURIComponent(authUser.email)}`}>
                        Verify email
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Full name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Phone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">City</label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs capitalize text-muted-foreground">
                Role: {authUser.role.replace("_", " ")}
                {authUser.isPrimaryAdmin ? " (primary)" : authUser.adminTier === "SUB" ? " (sub-admin)" : ""}
              </p>
              <Button type="submit" variant="brand" disabled={loading}>
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Dark / light mode</p>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader>
          <CardTitle className="text-base">Browser cache</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Refreshes marketplace data from Neon PostgreSQL. Your account in the database is
            not affected.
          </p>
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleReset}>
            Reset browser cache
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
