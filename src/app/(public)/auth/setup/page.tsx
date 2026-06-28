"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import { ProfilePicturePicker } from "@/components/shared/profile-picture-picker";
import { useAuthSession } from "@/providers/auth-provider";
import { dashboardPathForRole, postAuth } from "@/lib/auth-client";

export default function AdminSetupPage() {
  const router = useRouter();
  const { setUser } = useAuthSession();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    avatarUrl: null as string | null
  });

  useEffect(() => {
    fetch("/api/auth/setup-status")
      .then((r) => r.json())
      .then((d: { needsBootstrap?: boolean }) => {
        if (!d.needsBootstrap) router.replace("/auth/login");
      })
      .finally(() => setChecking(false));
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { confirmPassword: _, ...payload } = form;
      const data = await postAuth("/api/auth/bootstrap", payload);
      if (!data.ok || !data.user) {
        setError(data.error ?? "Setup failed");
        return;
      }
      setUser(data.user);
      router.refresh();
      router.push(dashboardPathForRole(data.user.role));
    } catch {
      setError("Setup failed");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <ActionLoadingOverlay active label="Checking platform…" />;
  }

  return (
    <div className="relative">
      <ActionLoadingOverlay active={loading} label="Creating platform admin…" />
      <Card className="w-full max-w-lg border-0 shadow-brand">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="font-display text-2xl">Create platform admin</CardTitle>
          <p className="text-sm text-muted-foreground">
            One-time setup — you can add sub-admins after signing in
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <ProfilePicturePicker
              email={form.email || "admin@bundlehub.gh"}
              name={form.name}
              value={form.avatarUrl}
              onChange={(avatarUrl) => setForm((f) => ({ ...f, avatarUrl }))}
            />
            {error && (
              <p className="rounded-xl bg-telecel/10 px-3 py-2 text-sm text-telecel">{error}</p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Full name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <PasswordInput
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
              <PasswordInput
                minLength={8}
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone (optional)</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <Button type="submit" variant="brand" className="w-full" disabled={loading}>
              Create admin account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already set up?{" "}
            <Link href="/auth/login" className="font-medium text-secondary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
