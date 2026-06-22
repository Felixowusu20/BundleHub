"use client";

import { usePlatformStore } from "@/stores/platform-store";
import { useAuthSession } from "@/providers/auth-provider";
import { useMemo } from "react";
import type { UserAccount, AuthUser } from "@/types/auth";

function authToUserAccount(auth: AuthUser): UserAccount {
  return {
    id: auth.id,
    email: auth.email,
    password: "",
    name: auth.name,
    phone: auth.phone,
    city: auth.city,
    role: auth.role,
    createdAt: auth.createdAt,
    walletBalanceGhs: auth.walletBalanceGhs,
    loyaltyLevel: auth.loyaltyLevel,
    shopId: auth.shopId
  };
}

export function useCurrentUser() {
  const { user: authUser } = useAuthSession();

  return useMemo(
    () => (authUser ? authToUserAccount(authUser) : null),
    [authUser]
  );
}

export function useAuthUser() {
  return useAuthSession().user;
}

export function useActiveShops() {
  const shops = usePlatformStore((s) => s.shops);
  return useMemo(() => shops.filter((s) => s.status === "active"), [shops]);
}

export function usePendingShops() {
  const shops = usePlatformStore((s) => s.shops);
  return useMemo(() => shops.filter((s) => s.status === "pending"), [shops]);
}

export function useUserShop(userId: string | undefined, shopId: string | undefined) {
  const shops = usePlatformStore((s) => s.shops);
  return useMemo(
    () => (shopId ? shops.find((sh) => sh.id === shopId) ?? null : null),
    [shopId, shops]
  );
}

export function useUserNotifications() {
  const userId = usePlatformStore((s) => s.session?.userId);
  const notifications = usePlatformStore((s) => s.notifications);
  return useMemo(() => {
    if (!userId) return [];
    return notifications.filter((n) => n.forUserId === userId);
  }, [notifications, userId]);
}
