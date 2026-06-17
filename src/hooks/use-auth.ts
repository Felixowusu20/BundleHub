"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlatformStore } from "@/stores/platform-store";
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
  const initialize = usePlatformStore((s) => s.initialize);
  const session = usePlatformStore((s) => s.session);
  const user = useCurrentUser();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!session || !user) {
      router.replace("/auth/login");
      return;
    }
    if (expectedRole && user.role !== expectedRole) {
      router.replace(roleRoutes[user.role]);
    }
  }, [session, user, expectedRole, router]);

  return { user, session, ready: Boolean(session && user) };
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
