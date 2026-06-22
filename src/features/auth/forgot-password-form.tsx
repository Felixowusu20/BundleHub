"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDevResetUrl(null);
    setEmailError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = (await res.json()) as {
        message?: string;
        error?: string;
        devResetUrl?: string;
        emailError?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }

      setMessage(
        data.message ??
          "If an account exists for that email, we sent password reset instructions."
      );
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
      if (data.emailError) setEmailError(data.emailError);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <ActionLoadingOverlay active={loading} label="Sending reset link…" />
      <Card className="w-full max-w-md border-0 shadow-brand">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="font-display text-2xl">Forgot password?</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send a reset link
          </p>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="space-y-4 text-center">
              <div className="rounded-2xl border border-mtn/30 bg-mtn/10 p-4 text-sm">
                <p>{message}</p>
              </div>
              {devResetUrl && (
                <div className="rounded-2xl border border-dashed p-4 text-left text-xs">
                  <p className="mb-2 font-medium text-muted-foreground">
                    {emailError
                      ? `Email failed (${emailError}). Use this link instead:`
                      : "Dev mode — use this reset link:"}
                  </p>
                  <Link
                    href={devResetUrl}
                    className="break-all font-medium text-secondary hover:underline"
                  >
                    {devResetUrl}
                  </Link>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/auth/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
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
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" variant="brand" className="w-full" disabled={loading}>
                Send reset link
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/auth/login" className="font-medium text-secondary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
