"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Database,
  Mail,
  Moon,
  Phone,
  MapPin,
  User,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ProfilePicturePicker } from "@/components/shared/profile-picture-picker";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import { MobileListGroup, MobileListRow } from "@/components/ui/mobile-list-row";
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
    <div className="relative space-y-5 md:space-y-6">
      <ActionLoadingOverlay active={loading} label="Saving profile…" />

      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile & preferences</p>
      </div>

      {authUser && (
        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-mtn" />
              Your profile
            </CardTitle>
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
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email
                </label>
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
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Full name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Phone
                  </label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    City
                  </label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Role: {authUser.role.replace("_", " ")}
                {authUser.isPrimaryAdmin ? " (primary)" : authUser.adminTier === "SUB" ? " (sub-admin)" : ""}
              </p>
              <Button type="submit" variant="brand" className="w-full sm:w-auto" disabled={loading}>
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Mobile: grouped list style */}
      <div className="md:hidden">
        <MobileListGroup title="Preferences">
          <div className="mobile-list-row">
            <span className="mobile-list-icon bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Moon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 text-sm font-medium">Appearance</span>
            <ThemeToggle />
          </div>
        </MobileListGroup>

        <MobileListGroup title="Data" className="mt-4">
          <MobileListRow
            icon={Database}
            label="Reset browser cache"
            description="Refresh marketplace data from server"
            iconBgClassName="bg-telecel/15 text-telecel"
            trailing={null}
            onClick={handleReset}
          />
        </MobileListGroup>
      </div>

      {/* Desktop cards */}
      <Card className="hidden border-0 shadow-card dark:shadow-card-dark md:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4 text-mtn" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Dark / light mode</p>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card className="hidden border-0 shadow-card dark:shadow-card-dark md:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-telecel" />
            Browser cache
          </CardTitle>
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
