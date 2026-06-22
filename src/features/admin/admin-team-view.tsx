"use client";

import { useEffect, useState } from "react";
import { Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import { ProfilePicturePicker } from "@/components/shared/profile-picture-picker";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAuthUser } from "@/hooks/use-platform";
import type { AuthUser } from "@/types/auth";

export function AdminTeamView() {
  const authUser = useAuthUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subAdmins, setSubAdmins] = useState<AuthUser[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    avatarUrl: null as string | null
  });
  const [formError, setFormError] = useState<string | null>(null);

  const isPrimary = authUser?.isPrimaryAdmin;

  const loadTeam = async () => {
    const res = await fetch("/api/auth/sub-admin");
    if (res.ok) {
      const data = (await res.json()) as { subAdmins: AuthUser[] };
      setSubAdmins(data.subAdmins);
    }
  };

  useEffect(() => {
    if (isPrimary) void loadTeam();
  }, [isPrimary]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormError("Name, email, and password are required.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    setFormError(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sub-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await res.json()) as { user?: AuthUser; error?: string };
      if (!res.ok || !data.user) {
        setFormError(data.error ?? "Failed");
        return;
      }
      setSubAdmins((prev) => [data.user!, ...prev]);
      setForm({ name: "", email: "", password: "", confirmPassword: "", phone: "", avatarUrl: null });
    } catch {
      setFormError("Failed to create sub-admin");
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) return null;

  if (!isPrimary) {
    return (
      <Card className="border-0 p-8 text-center shadow-card">
        <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 font-medium">Sub-admin account</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Only the primary platform admin can invite new team members.
        </p>
      </Card>
    );
  }

  return (
    <div className="relative space-y-6">
      <ActionLoadingOverlay active={loading} label="Creating sub-admin…" />

      <div>
        <h1 className="font-display text-2xl font-bold">Admin team</h1>
        <p className="text-sm text-muted-foreground">
          Create sub-admins who share the platform dashboard with you
        </p>
      </div>

      {(formError || error) && (
        <Card className="border-0 border-telecel/30 bg-telecel/5">
          <CardContent className="flex justify-between gap-3 p-4 text-sm text-telecel">
            <span>{formError || error}</span>
            <Button variant="ghost" size="sm" onClick={() => { setError(null); setFormError(null); }}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" />
            Add sub-admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <ProfilePicturePicker
              email={form.email || "admin@bundlehub.gh"}
              name={form.name}
              value={form.avatarUrl}
              onChange={(avatarUrl) => setForm((f) => ({ ...f, avatarUrl }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <PasswordInput
                placeholder="Password (min 8 chars)"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
              <PasswordInput
                placeholder="Confirm password"
                minLength={8}
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
              <Input
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <Button type="submit" variant="brand" disabled={loading}>
              Create sub-admin
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {subAdmins.length === 0 ? (
          <Card className="col-span-full border-0 p-8 text-center text-muted-foreground">
            No sub-admins yet.
          </Card>
        ) : (
          subAdmins.map((a) => (
            <Card key={a.id} className="border-0 shadow-card dark:shadow-card-dark">
              <CardContent className="flex items-center gap-4 p-4">
                <UserAvatar email={a.email} name={a.name} avatarUrl={a.avatarUrl} className="h-12 w-12" />
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
