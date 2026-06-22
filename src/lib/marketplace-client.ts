import type {
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

export type MarketplaceSyncPayload = {
  shops: Shop[];
  services: ServiceListing[];
  orders: Order[];
  reviews: Review[];
  conversations: Conversation[];
  staff: StaffMember[];
  walletTransactions: WalletTransaction[];
  notifications: NotificationItem[];
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    role: string;
    walletBalanceGhs: number;
    loyaltyLevel: string;
    shopId?: string;
    createdAt: string;
  }>;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "include"
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export async function fetchMarketplaceSync(): Promise<MarketplaceSyncPayload> {
  return api<MarketplaceSyncPayload>("/api/marketplace/sync");
}

export async function apiApproveShop(shopId: string) {
  await api("/api/shops/" + shopId, {
    method: "PATCH",
    body: JSON.stringify({ action: "approve" })
  });
}

export async function apiSuspendShop(shopId: string) {
  await api("/api/shops/" + shopId, {
    method: "PATCH",
    body: JSON.stringify({ action: "suspend" })
  });
}

export async function apiActivateShop(shopId: string) {
  await api("/api/shops/" + shopId, {
    method: "PATCH",
    body: JSON.stringify({ action: "activate" })
  });
}

export async function apiFeatureShop(shopId: string, featured: boolean) {
  await api("/api/shops/" + shopId, {
    method: "PATCH",
    body: JSON.stringify({ action: "feature", featured })
  });
}

export async function apiUpdateShop(shopId: string, input: UpdateShopInput) {
  await api("/api/shops/" + shopId, {
    method: "PATCH",
    body: JSON.stringify({ action: "update", ...input })
  });
}

export async function apiDeleteShop(shopId: string) {
  await api("/api/shops/" + shopId, {
    method: "PATCH",
    body: JSON.stringify({ action: "delete" })
  });
}

export async function apiCreateService(
  shopId: string,
  service: Omit<ServiceListing, "id" | "shopId" | "rating" | "trustScore">
) {
  await api("/api/services", {
    method: "POST",
    body: JSON.stringify({ shopId, service })
  });
}

export async function apiUpdateService(serviceId: string, input: UpdateServiceInput) {
  await api("/api/services/" + serviceId, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function apiDeleteService(serviceId: string) {
  await api("/api/services/" + serviceId, { method: "DELETE" });
}

export async function apiPlaceOrder(input: PlaceOrderInput) {
  return api<{ orderId: string; conversationId: string }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function apiUpdateOrderStatus(orderId: string, status: OrderStatus) {
  await api("/api/orders/" + orderId, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export async function apiSubmitMomoProof(orderId: string, input: MomoReceiptInput) {
  await api("/api/orders/" + orderId + "/momo-proof", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function apiSendMessage(
  conversationId: string,
  body: string,
  from: "customer" | "shop"
) {
  await api("/api/conversations/" + conversationId + "/messages", {
    method: "POST",
    body: JSON.stringify({ body, from })
  });
}

export async function apiSubmitReview(
  orderId: string,
  rating: number,
  title?: string,
  body?: string
) {
  await api("/api/reviews", {
    method: "POST",
    body: JSON.stringify({ orderId, rating, title, body })
  });
}

export async function apiTopUpWallet(amountGhs: number) {
  await api("/api/wallet", {
    method: "POST",
    body: JSON.stringify({ action: "topup", amountGhs })
  });
}

export async function apiWithdrawWallet(amountGhs: number) {
  await api("/api/wallet", {
    method: "POST",
    body: JSON.stringify({ action: "withdraw", amountGhs })
  });
}

export async function apiAddStaff(input: Omit<StaffMember, "id">) {
  await api("/api/staff", { method: "POST", body: JSON.stringify(input) });
}

export async function apiRemoveStaff(staffId: string) {
  await api("/api/staff/" + staffId, { method: "DELETE" });
}

export function mapSyncNotifications(
  items: MarketplaceSyncPayload["notifications"]
): NotificationItem[] {
  return items.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    kind: n.kind,
    href: n.href,
    forUserId: n.forUserId,
    at: n.at,
    read: n.read
  }));
}
