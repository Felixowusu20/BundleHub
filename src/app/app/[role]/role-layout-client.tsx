"use client";

import React, { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import type { Role } from "@/types/marketplace";
import type { AccountRole } from "@/types/auth";
import { Skeleton } from "@/components/ui/skeleton";

function isRole(x: string): x is Role {
  return ["customer", "shop_owner", "shop_staff", "super_admin"].includes(x);
}

const roleMap: Record<Role, AccountRole> = {
  customer: "customer",
  shop_owner: "shop_owner",
  shop_staff: "shop_staff",
  super_admin: "super_admin"
};

export function RoleLayoutClient({
  role,
  children
}: {
  role: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const initialize = usePlatformStore((s) => s.initialize);
  const session = usePlatformStore((s) => s.session);
  const user = useCurrentUser();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    initialize();
    setHydrated(true);
  }, [initialize]);

  useEffect(() => {
    if (!hydrated) return;
    if (!session || !user) {
      router.replace("/auth/login");
      return;
    }
    if (isRole(role) && user.role !== roleMap[role]) {
      router.replace(`/app/${user.role}`);
    }
  }, [hydrated, session, user, role, router]);

  if (!isRole(role)) return notFound();

  if (!hydrated || !session || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8">
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    );
  }

  if (user.role !== roleMap[role]) return null;

  return <AppShell role={role}>{children}</AppShell>;
}
