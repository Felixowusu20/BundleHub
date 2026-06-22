"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import { PageLoader } from "@/components/shared/page-loader";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setValid(false);
      return;
    }

    fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d: { valid?: boolean; email?: string; error?: string }) => {
        setValid(!!d.valid);
        if (d.email) setEmail(d.email);
        if (!d.valid) setError(d.error ?? "Invalid reset link");
      })
      .catch(() => setError("Could not verify reset link"))
      .finally(() => setChecking(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not reset password");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch {
      setError("Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <PageLoader label="Verifying reset link…" />;
  }

  if (!token || !valid) {
    return (
      <Card className="w-full max-w-md border-0 p-8 text-center shadow-brand">
        <KeyRound className="mx-auto h-10 w-10 text-telecel" />
        <p className="mt-4 font-medium">Link expired or invalid</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "Request a new password reset link."}
        </p>
        <Button variant="brand" className="mt-6 w-full" asChild>
          <Link href="/auth/forgot-password">Request new link</Link>
        </Button>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-md border-0 p-8 text-center shadow-brand">
        <CheckCircle2 className="mx-auto h-12 w-12 text-mtn" />
        <p className="mt-4 font-display text-xl font-bold">Password updated</p>
        <p className="mt-2 text-sm text-muted-foreground">Redirecting you to sign in…</p>
        <Button variant="brand" className="mt-6 w-full" asChild>
          <Link href="/auth/login">Sign in now</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="relative">
      <ActionLoadingOverlay active={loading} label="Updating password…" />
      <Card className="w-full max-w-md border-0 shadow-brand">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="font-display text-2xl">Set new password</CardTitle>
          {email && (
            <p className="text-sm text-muted-foreground">
              for <span className="font-medium text-foreground">{email}</span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded-xl bg-telecel/10 px-3 py-2 text-sm text-telecel">{error}</p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">New password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                placeholder="At least 8 characters"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
              <PasswordInput
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" variant="brand" className="w-full" disabled={loading}>
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
