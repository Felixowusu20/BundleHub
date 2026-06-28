"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import { useAuthSession } from "@/providers/auth-provider";
import {
  consumePendingLogin,
  dashboardPathForRole,
  postAuth
} from "@/lib/auth-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthSession();
  const emailParam = searchParams.get("email") ?? "";
  const justVerified = searchParams.get("verified") === "1";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const autoLoginStarted = useRef(false);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    fetch("/api/auth/setup-status")
      .then((r) => r.json())
      .then((d: { needsBootstrap?: boolean }) => setNeedsSetup(!!d.needsBootstrap));
  }, []);

  const signIn = useCallback(
    async (loginEmail: string, loginPassword: string) => {
      setError(null);
      setLoading(true);
      try {
        const data = await postAuth("/api/auth/login", {
          email: loginEmail,
          password: loginPassword
        });

        if (data.needsEmailVerification && data.email) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }

        if (!data.ok || !data.user) {
          setError(data.error ?? "Sign in failed");
          return;
        }

        setUser(data.user);
        router.refresh();

        const next = searchParams.get("next");
        const destination =
          next?.startsWith("/app") ? next : dashboardPathForRole(data.user.role);
        router.replace(destination);
      } catch {
        setError("Sign in failed");
      } finally {
        setLoading(false);
      }
    },
    [router, searchParams, setUser]
  );

  useEffect(() => {
    if (!justVerified || !emailParam || autoLoginStarted.current) return;

    const pendingPassword = consumePendingLogin(emailParam);
    if (!pendingPassword) return;

    autoLoginStarted.current = true;
    setPassword(pendingPassword);
    void signIn(emailParam, pendingPassword);
  }, [justVerified, emailParam, signIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    autoLoginStarted.current = true;
    await signIn(email, password);
  };

  return (
    <div className="relative">
      <ActionLoadingOverlay
        active={loading}
        label={justVerified ? "Email verified — signing you in…" : "Signing you in…"}
      />
      <Card className="w-full max-w-md border-0 shadow-brand">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="font-display text-2xl">Sign in to BundleHub</CardTitle>
          <p className="text-sm text-muted-foreground">Secure accounts powered by Neon</p>
        </CardHeader>
        <CardContent>
          {justVerified && (
            <div className="mb-4 rounded-2xl border border-mtn/30 bg-mtn/10 p-4 text-sm">
              <p className="font-medium text-mtn">Email verified successfully!</p>
              <p className="mt-1 text-muted-foreground">
                {loading ? "Signing you in now…" : "Sign in below to continue."}
              </p>
            </div>
          )}

          {needsSetup && (
            <div className="mb-4 rounded-2xl border border-mtn/30 bg-mtn/10 p-4 text-sm">
              <p className="font-medium">First time here?</p>
              <p className="mt-1 text-muted-foreground">
                Create the primary platform admin account once.
              </p>
              <Button variant="brand" size="sm" className="mt-3" asChild>
                <Link href="/auth/setup">Set up platform admin</Link>
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded-xl bg-telecel/10 px-3 py-2 text-sm text-telecel">{error}</p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">Password</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-secondary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" variant="brand" className="w-full" disabled={loading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/auth/register" className="font-medium text-secondary hover:underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
