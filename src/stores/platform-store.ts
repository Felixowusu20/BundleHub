"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateMockData, LIGHT_SEED } from "@/mock-data/generator";
import { partitionUserRecords } from "@/lib/seed-helpers";
import { applyReviewAverages } from "@/lib/ratings";
import { createId } from "@/lib/id";
import type {
  AuthSession,
  LoginInput,
  RegisterCustomerInput,
  RegisterShopOwnerInput,
  UserAccount
} from "@/types/auth";
import {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD
} from "@/types/auth";
import type {
  AnalyticsPoint,
  Conversation,
  MomoReceipt,
  Order,
  OrderDetails,
  OrderStatus,
  PlaceOrderInput,
  Review,
  ServiceListing,
  Shop,
  StaffMember,
  UpdateShopInput,
  WalletTransaction
} from "@/types/marketplace";
import type { NotificationItem } from "@/stores/app-store";

type PlatformState = {
  initialized: boolean;
  seedVersion: number;
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
  login: (input: LoginInput) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  registerCustomer: (
    input: RegisterCustomerInput
  ) => { ok: true; userId: string } | { ok: false; error: string };
  registerShopOwner: (
    input: RegisterShopOwnerInput
  ) => { ok: true; userId: string; shopId: string } | { ok: false; error: string };
  approveShop: (shopId: string) => void;
  suspendShop: (shopId: string) => void;
  activateShop: (shopId: string) => void;
  featureShop: (shopId: string, featured: boolean) => void;
  updateShop: (
    shopId: string,
    input: UpdateShopInput
  ) => { ok: true } | { ok: false; error: string };
  deleteShop: (shopId: string) => { ok: true } | { ok: false; error: string };
  addNotification: (
    n: Omit<NotificationItem, "id" | "at" | "read">
  ) => void;
  placeOrder: (
    input: PlaceOrderInput
  ) =>
    | { ok: true; orderId: string; conversationId: string }
    | { ok: false; error: string };
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus
  ) => { ok: true } | { ok: false; error: string };
  sendMessage: (
    conversationId: string,
    body: string,
    from: "customer" | "shop"
  ) => void;
  submitReview: (
    orderId: string,
    rating: number,
    title?: string,
    body?: string
  ) => { ok: true } | { ok: false; error: string };
  clearPendingReview: () => void;
  promptReview: (orderId: string) => void;
  topUpWallet: (userId: string, amountGhs: number) => void;
  addService: (
    shopId: string,
    service: Omit<ServiceListing, "id" | "shopId" | "rating" | "trustScore">
  ) => void;
  resetDemoData: () => void;

  getCurrentUser: () => UserAccount | null;
  getUserShop: (userId: string) => Shop | null;
  getActiveShops: () => Shop[];
  getPendingShops: () => Shop[];
};

function createSuperAdmin(): UserAccount {
  return {
    id: "user_super_admin",
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    name: "Platform Admin",
    phone: "0200000000",
    city: "Accra",
    role: "super_admin",
    createdAt: new Date().toISOString(),
    walletBalanceGhs: 0,
    loyaltyLevel: "Diamond"
  };
}

const CURRENT_SEED_VERSION = 2;

function seedPlatform(): Pick<
  PlatformState,
  | "users"
  | "shops"
  | "services"
  | "orders"
  | "reviews"
  | "conversations"
  | "staff"
  | "analytics"
> {
  const mock = generateMockData(20260617, LIGHT_SEED);
  return {
    users: [createSuperAdmin()],
    shops: mock.shops,
    services: mock.services,
    orders: mock.orders,
    reviews: mock.reviews,
    conversations: mock.conversations,
    staff: mock.staff,
    analytics: mock.analytics
  };
}

function mergeWithUserData(
  state: PlatformState,
  fresh: ReturnType<typeof seedPlatform>
): Partial<PlatformState> {
  const userShops = partitionUserRecords(state.shops, "shop").user;
  const userServices = partitionUserRecords(state.services, "svc").user;
  const userOrders = partitionUserRecords(state.orders, "ord").user;
  const userConvos = partitionUserRecords(state.conversations, "convo").user;
  const registeredUsers = state.users.filter((u) => u.id !== "user_super_admin");

  return {
    ...fresh,
    users: [createSuperAdmin(), ...registeredUsers],
    shops: [...fresh.shops, ...userShops],
    services: [...fresh.services, ...userServices],
    orders: [...fresh.orders, ...userOrders],
    conversations: [...fresh.conversations, ...userConvos],
    walletTransactions: state.walletTransactions ?? [],
    session: state.session,
    notifications: state.notifications,
    seedVersion: CURRENT_SEED_VERSION,
    initialized: true
  };
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      initialized: false,
      seedVersion: 0,
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
        const state = get();
        if (state.initialized && state.seedVersion === CURRENT_SEED_VERSION) return;

        const fresh = seedPlatform();

        if (state.initialized && state.seedVersion !== CURRENT_SEED_VERSION) {
          set(mergeWithUserData(state, fresh));
          return;
        }

        set({ ...fresh, seedVersion: CURRENT_SEED_VERSION, initialized: true });
      },

      resetDemoData: () => {
        set({
          ...seedPlatform(),
          seedVersion: CURRENT_SEED_VERSION,
          initialized: true,
          session: null,
          notifications: [],
          walletTransactions: []
        });
      },

      getCurrentUser: () => {
        const { session, users } = get();
        if (!session) return null;
        return users.find((u) => u.id === session.userId) ?? null;
      },

      getUserShop: (userId) => {
        const user = get().users.find((u) => u.id === userId);
        if (!user?.shopId) return null;
        return get().shops.find((s) => s.id === user.shopId) ?? null;
      },

      getActiveShops: () => get().shops.filter((s) => s.status === "active"),
      getPendingShops: () => get().shops.filter((s) => s.status === "pending"),

      login: (input) => {
        get().initialize();
        const user = get().users.find(
          (u) =>
            u.email.toLowerCase() === input.email.toLowerCase() &&
            u.password === input.password
        );
        if (!user) return { ok: false, error: "Invalid email or password" };
        set({ session: { userId: user.id, role: user.role } });
        return { ok: true };
      },

      logout: () => set({ session: null }),

      registerCustomer: (input) => {
        get().initialize();
        const exists = get().users.some(
          (u) => u.email.toLowerCase() === input.email.toLowerCase()
        );
        if (exists) return { ok: false, error: "Email already registered" };

        const user: UserAccount = {
          id: createId("user"),
          email: input.email.toLowerCase(),
          password: input.password,
          name: input.name,
          phone: input.phone,
          city: input.city,
          role: "customer",
          createdAt: new Date().toISOString(),
          walletBalanceGhs: 500,
          loyaltyLevel: "Bronze"
        };

        set((s) => ({
          users: [...s.users, user],
          session: { userId: user.id, role: "customer" },
          walletTransactions: [
            {
              id: createId("tx"),
              userId: user.id,
              type: "credit",
              amountGhs: 500,
              label: "Welcome bonus",
              at: new Date().toISOString()
            },
            ...s.walletTransactions
          ]
        }));

        get().addNotification({
          title: "Welcome to BundleHub",
          body: `Hi ${user.name}! Your customer account is ready with GHS 500 demo balance.`,
          kind: "system",
          forUserId: user.id
        });

        return { ok: true, userId: user.id };
      },

      registerShopOwner: (input) => {
        get().initialize();
        const exists = get().users.some(
          (u) => u.email.toLowerCase() === input.email.toLowerCase()
        );
        if (exists) return { ok: false, error: "Email already registered" };

        const shopId = createId("shop");
        const userId = createId("user");

        const shop: Shop = {
          id: shopId,
          name: input.shopName,
          ownerId: userId,
          ownerName: input.name,
          phone: input.phone,
          city: input.city,
          description: input.shopDescription,
          rating: 0,
          trustScore: 50,
          badges: ["New Seller"],
          verification: ["phone_verified", "email_verified"],
          status: "pending",
          featured: false,
          createdAt: new Date().toISOString()
        };

        const user: UserAccount = {
          id: userId,
          email: input.email.toLowerCase(),
          password: input.password,
          name: input.name,
          phone: input.phone,
          city: input.city,
          role: "shop_owner",
          createdAt: new Date().toISOString(),
          walletBalanceGhs: 0,
          loyaltyLevel: "Bronze",
          shopId
        };

        set((s) => ({
          users: [...s.users, user],
          shops: [...s.shops, shop],
          session: { userId: user.id, role: "shop_owner" }
        }));

        get().addNotification({
          title: "Shop registration submitted",
          body: `${shop.name} is pending admin approval.`,
          kind: "system"
        });

        return { ok: true, userId, shopId };
      },

      approveShop: (shopId) => {
        const shop = get().shops.find((s) => s.id === shopId);
        set((s) => ({
          shops: s.shops.map((sh) =>
            sh.id === shopId
              ? {
                  ...sh,
                  status: "active" as const,
                  badges: sh.badges.includes("Verified Seller")
                    ? sh.badges
                    : [...sh.badges, "Verified Seller" as const]
                }
              : sh
          )
        }));
        if (shop) {
          get().addNotification({
            title: "Shop approved",
            body: `${shop.name} is now live on BundleHub.`,
            kind: "system",
            forUserId: shop.ownerId
          });
        }
      },

      suspendShop: (shopId) => {
        set((s) => ({
          shops: s.shops.map((sh) =>
            sh.id === shopId ? { ...sh, status: "suspended" as const } : sh
          )
        }));
      },

      activateShop: (shopId) => {
        set((s) => ({
          shops: s.shops.map((sh) =>
            sh.id === shopId ? { ...sh, status: "active" as const } : sh
          )
        }));
      },

      featureShop: (shopId, featured) => {
        set((s) => ({
          shops: s.shops.map((sh) => (sh.id === shopId ? { ...sh, featured } : sh))
        }));
      },

      updateShop: (shopId, input) => {
        const shop = get().shops.find((s) => s.id === shopId);
        if (!shop) return { ok: false, error: "Shop not found." };

        const updated: Shop = {
          ...shop,
          ...input,
          name: input.name?.trim() || shop.name,
          ownerName: input.ownerName?.trim() || shop.ownerName,
          phone: input.phone?.trim() || shop.phone,
          city: input.city?.trim() || shop.city,
          description: input.description?.trim() ?? shop.description
        };

        set((s) => ({
          shops: s.shops.map((sh) => (sh.id === shopId ? updated : sh)),
          users: s.users.map((u) => {
            if (u.id !== shop.ownerId) return u;
            return {
              ...u,
              ...(input.ownerName ? { name: input.ownerName.trim() } : {}),
              ...(input.phone ? { phone: input.phone.trim() } : {}),
              ...(input.city ? { city: input.city.trim() } : {})
            };
          })
        }));

        if (shop.ownerId) {
          get().addNotification({
            title: "Shop profile updated",
            body: `${updated.name} was updated by platform admin.`,
            kind: "system",
            forUserId: shop.ownerId
          });
        }

        return { ok: true };
      },

      deleteShop: (shopId) => {
        const shop = get().shops.find((s) => s.id === shopId);
        if (!shop) return { ok: false, error: "Shop not found." };

        const orderIds = new Set(
          get().orders.filter((o) => o.shopId === shopId).map((o) => o.id)
        );

        set((s) => ({
          shops: s.shops.filter((sh) => sh.id !== shopId),
          services: s.services.filter((sv) => sv.shopId !== shopId),
          orders: s.orders.filter((o) => o.shopId !== shopId),
          conversations: s.conversations.filter((c) => c.shopId !== shopId),
          staff: s.staff.filter((st) => st.shopId !== shopId),
          reviews: s.reviews.filter(
            (r) => r.shopId !== shopId && !orderIds.has(r.orderId)
          ),
          users: s.users.map((u) =>
            u.shopId === shopId ? { ...u, shopId: undefined } : u
          )
        }));

        if (shop.ownerId) {
          get().addNotification({
            title: "Shop removed",
            body: `${shop.name} was removed from BundleHub by an administrator.`,
            kind: "system",
            forUserId: shop.ownerId
          });
        }

        return { ok: true };
      },

      addNotification: (n) => {
        const item: NotificationItem = {
          ...n,
          id: createId("notif"),
          at: new Date().toISOString(),
          read: false
        };
        set((s) => ({ notifications: [item, ...s.notifications].slice(0, 50) }));
      },

      addService: (shopId, service) => {
        const shop = get().shops.find((s) => s.id === shopId);
        const listing: ServiceListing = {
          ...service,
          id: createId("svc"),
          shopId,
          rating: 0,
          trustScore: shop?.trustScore ?? 50
        };
        set((s) => ({ services: [...s.services, listing] }));
      },

      topUpWallet: (userId, amountGhs) => {
        const tx: WalletTransaction = {
          id: createId("tx"),
          userId,
          type: "credit",
          amountGhs,
          label: "Wallet top-up",
          at: new Date().toISOString()
        };
        set((s) => ({
          users: s.users.map((u) =>
            u.id === userId
              ? { ...u, walletBalanceGhs: u.walletBalanceGhs + amountGhs }
              : u
          ),
          walletTransactions: [tx, ...s.walletTransactions]
        }));
      },

      placeOrder: (input) => {
        get().initialize();
        const customer = get().getCurrentUser();
        if (!customer || customer.role !== "customer") {
          return { ok: false, error: "Please sign in as a customer to place orders." };
        }

        const service = get().services.find((s) => s.id === input.serviceId);
        if (!service || !service.inStock) {
          return { ok: false, error: "Service is unavailable." };
        }

        const shop = get().shops.find((s) => s.id === service.shopId);
        if (!shop || shop.status !== "active") {
          return { ok: false, error: "This shop is not accepting orders." };
        }

        const ref = input.momoReceipt.reference?.trim();
        const screenshot = input.momoReceipt.screenshotDataUrl;
        if (!ref && !screenshot) {
          return {
            ok: false,
            error: "Provide a MoMo reference or upload a screenshot of your payment."
          };
        }

        const amount = service.priceGhs;
        if (customer.walletBalanceGhs < amount) {
          return {
            ok: false,
            error: `Insufficient balance. You need ${amount.toFixed(2)} GHS — top up your wallet.`
          };
        }

        const now = new Date().toISOString();
        const orderId = createId("ord");
        const commission = Math.round(amount * 0.03 * 100) / 100;

        const orderMessage = formatOrderMessage(service.name, input.details);
        const existingConvo = get().conversations.find(
          (c) => c.customerId === customer.id && c.shopId === shop.id
        );

        const newMessage = {
          id: createId("msg"),
          from: "customer" as const,
          body: `🛒 New order ${orderId}\n${service.name} — ${amount.toFixed(2)} GHS\n${orderMessage}`,
          at: now,
          read: false
        };

        const momoReceipt: MomoReceipt = {
          provider: input.momoReceipt.provider,
          reference: ref || undefined,
          screenshotDataUrl: screenshot,
          screenshotName: input.momoReceipt.screenshotName,
          amountGhs: amount,
          paidAt: now
        };

        const momoMessage = {
          id: createId("msg"),
          from: "customer" as const,
          body: formatMomoReceiptBody(momoReceipt, orderId),
          at: now,
          read: false,
          attachment: {
            kind: "momo_receipt" as const,
            provider: momoReceipt.provider,
            reference: momoReceipt.reference,
            amountGhs: momoReceipt.amountGhs,
            paidAt: momoReceipt.paidAt,
            screenshotDataUrl: momoReceipt.screenshotDataUrl,
            screenshotName: momoReceipt.screenshotName
          }
        };

        let conversationId: string;
        let conversations: Conversation[];

        const systemMsgShop = {
          id: createId("msg"),
          from: "system" as const,
          body: "✅ Buyer marked payment as done. Seller: check MoMo proof above, then tap Verify payment.",
          at: now,
          read: false
        };

        const systemMsgBuyer = {
          id: createId("msg"),
          from: "system" as const,
          body: "📤 Your payment proof was sent. The seller will verify shortly.",
          at: now,
          read: false
        };

        if (existingConvo) {
          conversationId = existingConvo.id;
          conversations = get().conversations.map((c) =>
            c.id === existingConvo.id
              ? {
                  ...c,
                  orderId,
                  lastMessageAt: now,
                  messages: [
                    ...c.messages,
                    newMessage,
                    momoMessage,
                    systemMsgBuyer,
                    systemMsgShop
                  ]
                }
              : c
          );
        } else {
          conversationId = createId("convo");
          conversations = [
            {
              id: conversationId,
              customerId: customer.id,
              shopId: shop.id,
              orderId,
              lastMessageAt: now,
              messages: [newMessage, momoMessage, systemMsgBuyer, systemMsgShop]
            },
            ...get().conversations
          ];
        }

        const order: Order = {
          id: orderId,
          customerId: customer.id,
          shopId: shop.id,
          serviceId: service.id,
          conversationId,
          createdAt: now,
          amountGhs: amount,
          platformCommissionGhs: commission,
          status: "pending",
          timeline: [{ status: "pending", at: now }],
          details: input.details,
          momoReceipt
        };

        const debitTx: WalletTransaction = {
          id: createId("tx"),
          userId: customer.id,
          type: "debit",
          amountGhs: amount,
          label: `${service.name} — ${shop.name}`,
          orderId,
          at: now
        };

        set((s) => ({
          users: s.users.map((u) =>
            u.id === customer.id
              ? { ...u, walletBalanceGhs: u.walletBalanceGhs - amount }
              : u
          ),
          orders: [order, ...s.orders],
          conversations,
          walletTransactions: [debitTx, ...s.walletTransactions]
        }));

        const chatHref = (r: "customer" | "shop_owner") =>
          `/app/${r}/messages?c=${conversationId}`;

        if (shop.ownerId) {
          get().addNotification({
            title: "MoMo proof received — check now",
            body: `${customer.name} sent payment proof for ${service.name} (${amount.toFixed(2)} GHS). Open chat to verify.`,
            kind: "order",
            forUserId: shop.ownerId,
            href: chatHref("shop_owner")
          });
        }

        get().addNotification({
          title: "Payment proof sent",
          body: `Your proof was delivered to ${shop.name}. You'll be notified when they verify.`,
          kind: "order",
          forUserId: customer.id,
          href: chatHref("customer")
        });

        return { ok: true, orderId, conversationId };
      },

      updateOrderStatus: (orderId, status) => {
        const user = get().getCurrentUser();
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return { ok: false, error: "Order not found." };

        const shop = get().shops.find((s) => s.id === order.shopId);
        const service = get().services.find((s) => s.id === order.serviceId);
        const customer = get().users.find((u) => u.id === order.customerId);

        if (user?.role === "shop_owner" && user.shopId !== order.shopId) {
          return { ok: false, error: "Not your order." };
        }

        const now = new Date().toISOString();
        const transitions: Record<string, OrderStatus[]> = {
          pending: ["accepted", "cancelled"],
          accepted: ["processing", "cancelled"],
          processing: ["completed", "cancelled"],
          completed: [],
          cancelled: [],
          disputed: []
        };

        const allowed = transitions[order.status] ?? [];
        if (!allowed.includes(status)) {
          return { ok: false, error: `Cannot move from ${order.status} to ${status}.` };
        }

        const updatedOrder: Order = {
          ...order,
          status,
          timeline: [...order.timeline, { status, at: now }]
        };

        let users = get().users;
        let walletTransactions = get().walletTransactions;

        if (status === "cancelled") {
          users = users.map((u) =>
            u.id === order.customerId
              ? { ...u, walletBalanceGhs: u.walletBalanceGhs + order.amountGhs }
              : u
          );
          walletTransactions = [
            {
              id: createId("tx"),
              userId: order.customerId,
              type: "credit",
              amountGhs: order.amountGhs,
              label: `Refund — ${service?.name ?? "order"}`,
              orderId,
              at: now
            },
            ...walletTransactions
          ];
        }

        if (status === "completed" && shop) {
          const payout = order.amountGhs - order.platformCommissionGhs;
          users = users.map((u) =>
            u.id === shop.ownerId
              ? { ...u, walletBalanceGhs: u.walletBalanceGhs + payout }
              : u
          );
          walletTransactions = [
            {
              id: createId("tx"),
              userId: shop.ownerId,
              type: "credit",
              amountGhs: payout,
              label: `Order payout — ${service?.name ?? orderId}`,
              orderId,
              at: now
            },
            ...walletTransactions
          ];
        }

        const statusMessages: Partial<Record<OrderStatus, string>> = {
          accepted: "✅ Payment verified — seller is fulfilling your order.",
          processing: "⚙️ Seller is processing your order now.",
          completed: "🎉 Order delivered! Your service is complete.",
          cancelled: "❌ Order cancelled. Refund issued to buyer wallet."
        };

        const msgBody = statusMessages[status];
        let conversations = get().conversations;
        if (msgBody && order.conversationId) {
          const systemMsg = {
            id: createId("msg"),
            from: "system" as const,
            body: msgBody,
            at: now,
            read: false
          };
          conversations = get().conversations.map((c) =>
            c.id === order.conversationId
              ? { ...c, lastMessageAt: now, messages: [...c.messages, systemMsg] }
              : c
          );
        }

        const convoHref = order.conversationId
          ? (r: "customer" | "shop_owner") =>
              `/app/${r}/messages?c=${order.conversationId}`
          : null;

        set({
          orders: get().orders.map((o) => (o.id === orderId ? updatedOrder : o)),
          users,
          walletTransactions,
          conversations,
          pendingReviewOrderId: status === "completed" ? orderId : get().pendingReviewOrderId
        });

        if (customer && shop) {
          const customerNotes: Partial<Record<OrderStatus, { title: string; body: string }>> = {
            accepted: {
              title: "Payment verified",
              body: `${shop.name} confirmed your MoMo payment. Your order is being prepared.`
            },
            processing: {
              title: "Order in progress",
              body: `${shop.name} is fulfilling ${service?.name ?? "your order"} now.`
            },
            completed: {
              title: "Order delivered!",
              body: `${shop.name} completed your order. ${service?.name ?? "Service"} has been delivered — open chat to confirm.`
            },
            cancelled: {
              title: "Order cancelled",
              body: `Your order was cancelled. ${order.amountGhs.toFixed(2)} GHS refunded to your wallet.`
            }
          };

          const shopNotes: Partial<Record<OrderStatus, { title: string; body: string }>> = {
            cancelled: {
              title: "Order cancelled",
              body: `Order ${orderId} cancelled — buyer refunded.`
            }
          };

          const cn = customerNotes[status];
          if (cn && convoHref) {
            get().addNotification({
              ...cn,
              kind: "order",
              forUserId: customer.id,
              href: convoHref("customer")
            });
          }

          const sn = shopNotes[status];
          if (sn && convoHref && shop.ownerId) {
            get().addNotification({
              ...sn,
              kind: "order",
              forUserId: shop.ownerId,
              href: convoHref("shop_owner")
            });
          }
        }

        return { ok: true };
      },

      sendMessage: (conversationId, body, from) => {
        const user = get().getCurrentUser();
        if (!user || !body.trim()) return;

        const now = new Date().toISOString();
        const msg = {
          id: createId("msg"),
          from,
          body: body.trim(),
          at: now,
          read: false
        };

        const convo = get().conversations.find((c) => c.id === conversationId);
        if (!convo) return;

        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessageAt: now, messages: [...c.messages, msg] }
              : c
          )
        }));

        const shop = get().shops.find((s) => s.id === convo.shopId);
        const recipientId =
          from === "customer" ? shop?.ownerId : convo.customerId;

        if (recipientId) {
          const recipientRole =
            from === "customer" ? "shop_owner" : "customer";
          get().addNotification({
            title: "New chat message",
            body: body.trim().slice(0, 80),
            kind: "message",
            forUserId: recipientId,
            href: `/app/${recipientRole}/messages?c=${conversationId}`
          });
        }
      },

      submitReview: (orderId, rating, title = "", body = "") => {
        const customer = get().getCurrentUser();
        const order = get().orders.find((o) => o.id === orderId);
        if (!customer || customer.role !== "customer") {
          return { ok: false, error: "Sign in as a customer to leave a review." };
        }
        if (!order || order.customerId !== customer.id) {
          return { ok: false, error: "Order not found." };
        }
        if (order.status !== "completed") {
          return { ok: false, error: "You can only review completed orders." };
        }
        if (order.reviewSubmitted || get().reviews.some((r) => r.orderId === orderId)) {
          return { ok: false, error: "You already reviewed this order." };
        }
        if (rating < 1 || rating > 5) {
          return { ok: false, error: "Rating must be between 1 and 5." };
        }

        const shop = get().shops.find((s) => s.id === order.shopId);
        const review: Review = {
          id: createId("rev"),
          orderId,
          customerId: customer.id,
          shopId: order.shopId,
          serviceId: order.serviceId,
          rating,
          title: title || (rating >= 4 ? "Great service" : "Feedback"),
          body: body || `Rated ${rating} stars.`,
          createdAt: new Date().toISOString()
        };

        const reviews = [review, ...get().reviews];
        const { shops, services } = applyReviewAverages(
          get().shops,
          get().services,
          reviews
        );

        set({
          reviews,
          shops,
          services,
          orders: get().orders.map((o) =>
            o.id === orderId ? { ...o, reviewSubmitted: true } : o
          ),
          pendingReviewOrderId:
            get().pendingReviewOrderId === orderId ? null : get().pendingReviewOrderId
        });

        if (shop?.ownerId) {
          get().addNotification({
            title: "New review",
            body: `${customer.name} rated ${shop.name} ${rating}★`,
            kind: "system",
            forUserId: shop.ownerId
          });
        }

        return { ok: true };
      },

      clearPendingReview: () => set({ pendingReviewOrderId: null }),

      promptReview: (orderId) => set({ pendingReviewOrderId: orderId })
    }),
    {
      name: "bundlehub-platform",
      partialize: (s) => ({
        initialized: s.initialized,
        seedVersion: s.seedVersion,
        users: s.users,
        session: s.session,
        shops: s.shops,
        services: s.services,
        orders: s.orders,
        reviews: s.reviews,
        conversations: s.conversations,
        staff: s.staff,
        analytics: s.analytics,
        notifications: s.notifications,
        walletTransactions: s.walletTransactions
      })
    }
  )
);

function formatMomoReceiptBody(receipt: MomoReceipt, orderId: string) {
  const paid = new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(receipt.paidAt));
  const lines = [
    "📱 MoMo payment — please verify",
    `Provider: ${receipt.provider}`,
    `Amount: GHS ${receipt.amountGhs.toFixed(2)}`,
    `Paid: ${paid}`,
    `Order ref: ${orderId}`
  ];
  if (receipt.reference) {
    lines.splice(2, 0, `Reference: ${receipt.reference}`);
  }
  if (receipt.screenshotDataUrl) {
    lines.push("📷 Payment screenshot attached below");
  }
  return lines.join("\n");
}

function formatOrderMessage(serviceName: string, details: OrderDetails) {
  const parts: string[] = [];
  if (details.phoneNumber) parts.push(`Phone: ${details.phoneNumber}`);
  if (details.network) parts.push(`Network: ${details.network}`);
  if (details.meterNumber) parts.push(`Meter: ${details.meterNumber}`);
  if (details.accountNumber) parts.push(`Account: ${details.accountNumber}`);
  if (details.smartCardNumber) parts.push(`Smart card: ${details.smartCardNumber}`);
  if (details.packageName) parts.push(`Package: ${details.packageName}`);
  if (details.quantity) parts.push(`Qty: ${details.quantity}`);
  if (details.notes) parts.push(`Notes: ${details.notes}`);
  return parts.length ? parts.join("\n") : serviceName;
}
