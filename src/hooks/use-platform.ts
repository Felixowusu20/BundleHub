"use client";

import { usePlatformStore } from "@/stores/platform-store";
import { useMemo } from "react";

/** Stable selectors — never call store methods that return new arrays/objects in usePlatformStore selectors. */

export function useCurrentUser() {
  const userId = usePlatformStore((s) => s.session?.userId);
  const users = usePlatformStore((s) => s.users);
  return useMemo(
    () => (userId ? users.find((u) => u.id === userId) ?? null : null),
    [userId, users]
  );
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
