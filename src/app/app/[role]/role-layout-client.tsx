"use client";

import React, { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageLoader } from "@/components/shared/page-loader";
import { usePlatformStore } from "@/stores/platform-store";
import { useAuthSession } from "@/providers/auth-provider";
import type { Role } from "@/types/marketplace";

function isRole(x: string): x is Role {
  return ["customer", "shop_owner", "shop_staff", "super_admin"].includes(x);
}

export function RoleLayoutClient({
  role,
  children
}: {
  role: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const initialize = usePlatformStore((s) => s.initialize);
  const { user, loading } = useAuthSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize();
    setReady(true);
  }, [initialize]);

  useEffect(() => {
    if (!ready || loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (!user.emailVerified) {
      router.replace(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);
      return;
    }
    if (isRole(role) && user.role !== role) {
      router.replace(`/app/${user.role}`);
    }
  }, [ready, loading, user, role, router]);

  if (!isRole(role)) return notFound();

  if (!ready || loading || !user) {
    return <PageLoader label="Loading your workspace…" />;
  }

  if (user.role !== role) return null;

  return <AppShell role={role}>{children}</AppShell>;
}
