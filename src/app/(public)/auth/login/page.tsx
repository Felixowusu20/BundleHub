"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePlatformStore } from "@/stores/platform-store";
import { SUPER_ADMIN_EMAIL } from "@/types/auth";

const roleRedirect: Record<string, string> = {
  customer: "/app/customer",
  shop_owner: "/app/shop_owner",
  shop_staff: "/app/shop_staff",
  super_admin: "/app/super_admin"
};

export default function LoginPage() {
  const router = useRouter();
  const login = usePlatformStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = login({ email, password });
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const user = usePlatformStore.getState().getCurrentUser();
    if (user) {
      toast.success(`Welcome back, ${user.name}!`);
      router.push(roleRedirect[user.role] ?? "/app");
    }
  };

  return (
    <Card className="w-full max-w-md border-0 shadow-brand">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="font-display text-2xl">Sign in to BundleHub</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your account is saved locally in this browser
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" variant="brand" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 rounded-2xl bg-muted/60 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo super admin</p>
          <p className="mt-1">Email: {SUPER_ADMIN_EMAIL}</p>
          <p>Password: admin123</p>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/auth/register" className="font-medium text-secondary hover:underline">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
