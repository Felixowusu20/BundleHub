"use client";

import { create } from "zustand";
import {
  apiActivateShop,
  apiAddStaff,
  apiApproveShop,
  apiCreateService,
  apiDeleteService,
  apiDeleteShop,
  apiFeatureShop,
  apiPlaceOrder,
  apiRemoveStaff,
  apiSendMessage,
  apiSubmitMomoProof,
  apiSubmitReview,
  apiSuspendShop,
  apiTopUpWallet,
  apiUpdateOrderStatus,
  apiUpdateService,
  apiUpdateShop,
  apiWithdrawWallet,
  fetchMarketplaceSync,
  mapSyncNotifications
} from "@/lib/marketplace-client";
import type { AuthSession, AuthUser, UserAccount } from "@/types/auth";
import type {
  AnalyticsPoint,
  Conversation,
  MomoReceiptInput,
  Order,
  OrderStatus,
  PlaceOrderInput,
  Review,
  ServiceListing,
  Shop,
  StaffMember,
  UpdateServiceInput,
  UpdateShopInput,
  WalletTransaction
} from "@/types/marketplace";
import type { NotificationItem } from "@/stores/app-store";

type PlatformState = {
  initialized: boolean;
  loading: boolean;
  users: UserAccount[];
  session: AuthSession | null;
  shops: Shop[];
  services: ServiceListing[];
  orders: Order[];
  reviews: Review[];
  conversations: Conversation[];
  staff: StaffMember[];
  analytics: AnalyticsPoint[];
  notifications: NotificationItem[];
  walletTransactions: WalletTransaction[];
  pendingReviewOrderId: string | null;

  initialize: () => void;
  refreshFromServer: () => Promise<void>;
  logout: () => void;
  approveShop: (shopId: string) => Promise<void>;
  suspendShop: (shopId: string) => Promise<void>;
  activateShop: (shopId: string) => Promise<void>;
  featureShop: (shopId: string, featured: boolean) => Promise<void>;
  updateShop: (
    shopId: string,
    input: UpdateShopInput
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteShop: (shopId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  addNotification: (n: Omit<NotificationItem, "id" | "at" | "read">) => void;
  placeOrder: (
    input: PlaceOrderInput
  ) => Promise<
    | { ok: true; orderId: string; conversationId: string }
    | { ok: false; error: string }
  >;
  submitMomoProof: (
    orderId: string,
    momoReceipt: MomoReceiptInput
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteOrder: (
    orderId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  sendMessage: (
    conversationId: string,
    body: string,
    from: "customer" | "shop"
  ) => Promise<void>;
  deleteMessages: (
    conversationId: string,
    messageIds: string[]
  ) => { ok: true; deleted: number } | { ok: false; error: string };
  submitReview: (
    orderId: string,
    rating: number,
    title?: string,
    body?: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  clearPendingReview: () => void;
  promptReview: (orderId: string) => void;
  topUpWallet: (userId: string, amountGhs: number) => Promise<void>;
  addService: (
    shopId: string,
    service: Omit<ServiceListing, "id" | "shopId" | "rating" | "trustScore">
  ) => Promise<void>;
  updateService: (
    serviceId: string,
    input: UpdateServiceInput
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteService: (
    serviceId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateOwnShop: (
    input: UpdateShopInput
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  addStaffMember: (
    input: Omit<StaffMember, "id">
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  removeStaffMember: (
    staffId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  openDispute: (
    orderId: string,
    reason: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  withdrawWallet: (
    amountGhs: number
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  resetLocalCache: () => void;
  syncAuthUser: (auth: AuthUser | null) => void;

  getCurrentUser: () => UserAccount | null;
  getUserShop: (userId: string) => Shop | null;
  getActiveShops: () => Shop[];
  getPendingShops: () => Shop[];
};

function toUserAccount(u: {
  id: string;
  email?: string;
  name: string;
  phone: string;
  city: string;
  role: string;
  createdAt: string;
  walletBalanceGhs: number;
  loyaltyLevel: string;
  shopId?: string;
}): UserAccount {
  return {
    id: u.id,
    email: u.email ?? "",
    password: "",
    name: u.name,
    phone: u.phone,
    city: u.city,
    role: u.role as UserAccount["role"],
    createdAt: u.createdAt,
    walletBalanceGhs: u.walletBalanceGhs,
    loyaltyLevel: u.loyaltyLevel as UserAccount["loyaltyLevel"],
    shopId: u.shopId
  };
}

async function withRefresh<T>(fn: () => Promise<T>): Promise<T> {
  const result = await fn();
  await usePlatformStore.getState().refreshFromServer();
  return result;
}

export const usePlatformStore = create<PlatformState>()((set, get) => ({
  initialized: false,
  loading: false,
  users: [],
  session: null,
  shops: [],
  services: [],
  orders: [],
  reviews: [],
  conversations: [],
  staff: [],
  analytics: [],
  notifications: [],
  walletTransactions: [],
  pendingReviewOrderId: null,

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });
    void get().refreshFromServer();
  },

  refreshFromServer: async () => {
    set({ loading: true });
    try {
      const data = await fetchMarketplaceSync();
      const session = get().session;
      const authUser = session
        ? data.users.find((u) => u.id === session.userId)
        : undefined;

      set({
        shops: data.shops,
        services: data.services,
        orders: data.orders,
        reviews: data.reviews,
        conversations: data.conversations,
        staff: data.staff,
        walletTransactions: data.walletTransactions,
        notifications: mapSyncNotifications(data.notifications),
        users: data.users.map((u) => toUserAccount(u)),
        loading: false,
        initialized: true
      });

      if (authUser && session) {
        set((s) => ({
          users: s.users.map((u) =>
            u.id === session.userId
              ? { ...u, walletBalanceGhs: authUser.walletBalanceGhs }
              : u
          )
        }));
      }
    } catch (e) {
      console.error("marketplace sync failed", e);
      set({ loading: false });
    }
  },

  resetLocalCache: () => {
    set({
      shops: [],
      services: [],
      orders: [],
      reviews: [],
      conversations: [],
      staff: [],
      analytics: [],
      notifications: [],
      walletTransactions: [],
      pendingReviewOrderId: null,
      initialized: false
    });
    void get().refreshFromServer();
  },

  getCurrentUser: () => {
    const { session, users } = get();
    if (!session) return null;
    return users.find((u) => u.id === session.userId) ?? null;
  },

  syncAuthUser: (auth) => {
    get().initialize();
    if (!auth) {
      set({ session: null });
      void get().refreshFromServer();
      return;
    }

    const account = toUserAccount({ ...auth, role: auth.role });
    set((s) => {
      const idx = s.users.findIndex((u) => u.id === auth.id);
      const users =
        idx >= 0
          ? s.users.map((u) => (u.id === auth.id ? { ...u, ...account } : u))
          : [...s.users, account];

      return {
        users,
        session: { userId: auth.id, role: auth.role }
      };
    });
    void get().refreshFromServer();
  },

  logout: () => set({ session: null }),

  getUserShop: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    if (!user?.shopId) return null;
    return get().shops.find((s) => s.id === user.shopId) ?? null;
  },

  getActiveShops: () => get().shops.filter((s) => s.status === "active"),
  getPendingShops: () => get().shops.filter((s) => s.status === "pending"),

  approveShop: async (shopId) => {
    await withRefresh(() => apiApproveShop(shopId));
  },

  suspendShop: async (shopId) => {
    await withRefresh(() => apiSuspendShop(shopId));
  },

  activateShop: async (shopId) => {
    await withRefresh(() => apiActivateShop(shopId));
  },

  featureShop: async (shopId, featured) => {
    await withRefresh(() => apiFeatureShop(shopId, featured));
  },

  updateShop: async (shopId, input) => {
    try {
      await withRefresh(() => apiUpdateShop(shopId, input));
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Update failed." };
    }
  },

  deleteShop: async (shopId) => {
    try {
      await withRefresh(() => apiDeleteShop(shopId));
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Delete failed." };
    }
  },

  addNotification: (n) => {
    const item: NotificationItem = {
      ...n,
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      read: false
    };
    set((s) => ({ notifications: [item, ...s.notifications].slice(0, 50) }));
  },

  addService: async (shopId, service) => {
    await withRefresh(() => apiCreateService(shopId, service));
  },

  updateService: async (serviceId, input) => {
    try {
      await withRefresh(() => apiUpdateService(serviceId, input));
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Update failed." };
    }
  },

  deleteService: async (serviceId) => {
    try {
      await withRefresh(() => apiDeleteService(serviceId));
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Delete failed." };
    }
  },

  updateOwnShop: async (input) => {
    const user = get().getCurrentUser();
    if (!user?.shopId || user.role !== "shop_owner") {
      return { ok: false as const, error: "Only shop owners can edit their shop." };
    }
    const { status, featured, trustScore, ...safe } = input;
    return get().updateShop(user.shopId, safe);
  },

  addStaffMember: async (input) => {
    try {
      await withRefresh(() => apiAddStaff(input));
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Could not add staff." };
    }
  },

  removeStaffMember: async (staffId) => {
    try {
      await withRefresh(() => apiRemoveStaff(staffId));
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Could not remove staff." };
    }
  },

  placeOrder: async (input) => {
    try {
      const result = await withRefresh(() => apiPlaceOrder(input));
      return { ok: true as const, ...result };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "Could not place order."
      };
    }
  },

  submitMomoProof: async (orderId, momoReceipt) => {
    try {
      await withRefresh(() => apiSubmitMomoProof(orderId, momoReceipt));
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Could not send proof." };
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      await withRefresh(() => apiUpdateOrderStatus(orderId, status));
      if (status === "completed") set({ pendingReviewOrderId: orderId });
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Could not update order." };
    }
  },

  deleteOrder: async (orderId) => {
    try {
      await fetch("/api/orders/" + orderId, { method: "DELETE", credentials: "include" });
      await get().refreshFromServer();
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Could not delete order." };
    }
  },

  sendMessage: async (conversationId, body, from) => {
    if (!body.trim()) return;
    await withRefresh(() => apiSendMessage(conversationId, body, from));
  },

  deleteMessages: () => {
    return { ok: false as const, error: "Message deletion is not available yet." };
  },

  openDispute: async (orderId, reason) => {
    try {
      await fetch("/api/orders/" + orderId, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dispute", reason })
      });
      await get().refreshFromServer();
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Could not open dispute." };
    }
  },

  submitReview: async (orderId, rating, title, body) => {
    try {
      await withRefresh(() => apiSubmitReview(orderId, rating, title, body));
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Could not submit review." };
    }
  },

  clearPendingReview: () => set({ pendingReviewOrderId: null }),
  promptReview: (orderId) => set({ pendingReviewOrderId: orderId }),

  topUpWallet: async (_userId, amountGhs) => {
    await withRefresh(() => apiTopUpWallet(amountGhs));
  },

  withdrawWallet: async (amountGhs) => {
    try {
      await withRefresh(() => apiWithdrawWallet(amountGhs));
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Withdrawal failed." };
    }
  }
}));
