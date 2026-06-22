"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlatformStore } from "@/stores/platform-store";
import { useAuthSession } from "@/providers/auth-provider";
import { useCurrentUser } from "@/hooks/use-platform";
import type { AccountRole } from "@/types/auth";

const roleRoutes: Record<AccountRole, string> = {
  customer: "/app/customer",
  shop_owner: "/app/shop_owner",
  shop_staff: "/app/shop_staff",
  super_admin: "/app/super_admin"
};

export function useRequireAuth(expectedRole?: AccountRole) {
  const router = useRouter();
  const { user, loading } = useAuthSession();
  const currentUser = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (expectedRole && user.role !== expectedRole) {
      router.replace(roleRoutes[user.role]);
    }
  }, [loading, user, expectedRole, router]);

  return { user: currentUser, authUser: user, ready: Boolean(!loading && user) };
}

export function usePlatformData() {
  const initialize = usePlatformStore((s) => s.initialize);
  const shops = usePlatformStore((s) => s.shops);
  const services = usePlatformStore((s) => s.services);
  const orders = usePlatformStore((s) => s.orders);
  const users = usePlatformStore((s) => s.users);
  const analytics = usePlatformStore((s) => s.analytics);
  const conversations = usePlatformStore((s) => s.conversations);
  const staff = usePlatformStore((s) => s.staff);
  const reviews = usePlatformStore((s) => s.reviews);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return { shops, services, orders, users, analytics, conversations, staff, reviews };
}
