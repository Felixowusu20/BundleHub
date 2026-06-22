"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import { PageLoader } from "@/components/shared/page-loader";
import { useAuthSession } from "@/providers/auth-provider";
import type { AuthUser } from "@/types/auth";

const roleRedirect: Record<string, string> = {
  customer: "/app/customer",
  shop_owner: "/app/shop_owner",
  shop_staff: "/app/shop_staff",
  super_admin: "/app/super_admin"
};

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthSession();

  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(Boolean(token));
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then(
        (d: {
          valid?: boolean;
          alreadyVerified?: boolean;
          user?: AuthUser;
          error?: string;
        }) => {
          if (!d.valid) {
            setError(d.error ?? "Verification failed");
            return;
          }
          setVerified(true);
          if (d.user) {
            setUser(d.user);
            setTimeout(() => router.replace(roleRedirect[d.user!.role] ?? "/app"), 1500);
          }
        }
      )
      .catch(() => setError("Verification failed"))
      .finally(() => setLoading(false));
  }, [token, router, setUser]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setResending(true);
    setError(null);
    setMessage(null);
    setDevVerifyUrl(null);

    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = (await res.json()) as {
        message?: string;
        error?: string;
        devVerifyUrl?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not send email");
        return;
      }
      setMessage(data.message ?? "Verification email sent.");
      if (data.devVerifyUrl) setDevVerifyUrl(data.devVerifyUrl);
    } catch {
      setError("Could not send email");
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return <PageLoader label="Verifying your email…" />;
  }

  if (verified) {
    return (
      <Card className="w-full max-w-md border-0 p-8 text-center shadow-brand">
        <CheckCircle2 className="mx-auto h-12 w-12 text-mtn" />
        <p className="mt-4 font-display text-xl font-bold">Email verified!</p>
        <p className="mt-2 text-sm text-muted-foreground">Taking you to your dashboard…</p>
      </Card>
    );
  }

  if (token && error) {
    return (
      <Card className="w-full max-w-md border-0 shadow-brand">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl">Link expired</CardTitle>
          <p className="text-sm text-telecel">{error}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResend} className="space-y-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            <Button type="submit" variant="brand" className="w-full" disabled={resending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Send new verification link
            </Button>
          </form>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <ActionLoadingOverlay active={resending} label="Sending verification email…" />
      <Card className="w-full max-w-md border-0 shadow-brand">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="font-display text-2xl">Verify your email</CardTitle>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to your inbox. Click it to activate your account.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className="rounded-2xl border border-mtn/30 bg-mtn/10 p-4 text-sm">{message}</div>
          )}
          {error && (
            <p className="rounded-xl bg-telecel/10 px-3 py-2 text-sm text-telecel">{error}</p>
          )}
          {devVerifyUrl && (
            <div className="rounded-2xl border border-dashed p-4 text-left text-xs">
              <p className="mb-2 font-medium text-muted-foreground">Dev verification link:</p>
              <Link href={devVerifyUrl} className="break-all font-medium text-secondary hover:underline">
                {devVerifyUrl}
              </Link>
            </div>
          )}

          <form onSubmit={handleResend} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" variant="brand" className="w-full" disabled={resending}>
              Resend verification email
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already verified?{" "}
            <Link href="/auth/login" className="font-medium text-secondary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function VerifyEmailForm() {
  return (
    <Suspense fallback={<PageLoader label="Loading…" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
