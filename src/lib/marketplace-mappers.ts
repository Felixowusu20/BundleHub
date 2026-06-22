import type {
  BadgeType,
  ChatMessage,
  Conversation,
  MessageAttachment,
  Order,
  OrderDetails,
  OrderStatus,
  MomoReceipt,
  PricingModel,
  Review,
  ServiceCategory,
  ServiceListing,
  Shop,
  StaffMember,
  VerificationFlag,
  WalletTransaction
} from "@/types/marketplace";
import type {
  AppNotification,
  Conversation as DbConversation,
  Message,
  MessageSender,
  Order as DbOrder,
  OrderStatus as DbOrderStatus,
  OrderStatusEvent,
  PricingModel as DbPricingModel,
  Review as DbReview,
  Service,
  Shop as DbShop,
  ShopStatus,
  StaffMember as DbStaff,
  StaffRoleTitle,
  User,
  WalletTransaction as DbWalletTx,
  WalletTxType
} from "@/generated/prisma/client";

export function shopStatusToApp(status: ShopStatus): Shop["status"] {
  return status.toLowerCase() as Shop["status"];
}

export function shopStatusToDb(status: Shop["status"]): ShopStatus {
  return status.toUpperCase() as ShopStatus;
}

export function orderStatusToApp(status: DbOrderStatus): OrderStatus {
  return status.toLowerCase() as OrderStatus;
}

export function orderStatusToDb(status: OrderStatus): DbOrderStatus {
  return status.toUpperCase() as DbOrderStatus;
}

export function pricingModelToApp(model: DbPricingModel): PricingModel {
  return model === "PER_GB" ? "per_gb" : "fixed";
}

export function pricingModelToDb(model?: PricingModel): DbPricingModel {
  return model === "per_gb" ? "PER_GB" : "FIXED";
}

export function messageSenderToApp(from: MessageSender): ChatMessage["from"] {
  return from.toLowerCase() as ChatMessage["from"];
}

export function messageSenderToDb(from: ChatMessage["from"]): MessageSender {
  return from.toUpperCase() as MessageSender;
}

function parseJsonArray<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

export function mapShop(
  shop: DbShop & { owner?: Pick<User, "name"> | null }
): Shop {
  return {
    id: shop.id,
    name: shop.name,
    ownerId: shop.ownerId,
    ownerName: shop.owner?.name ?? "Shop owner",
    phone: shop.phone,
    city: shop.city,
    description: shop.description ?? undefined,
    rating: Number(shop.rating),
    trustScore: shop.trustScore,
    badges: parseJsonArray<BadgeType>(shop.badges, ["New Seller"]),
    verification: parseJsonArray<VerificationFlag>(shop.verification, [
      "phone_verified",
      "email_verified"
    ]),
    status: shopStatusToApp(shop.status),
    featured: shop.featured,
    createdAt: shop.createdAt.toISOString()
  };
}

export function mapService(service: Service): ServiceListing {
  return {
    id: service.id,
    category: service.category as ServiceCategory,
    name: service.name,
    description: service.description,
    shopId: service.shopId,
    priceGhs: Number(service.priceGhs),
    pricingModel: pricingModelToApp(service.pricingModel),
    pricePerGb: service.pricePerGb != null ? Number(service.pricePerGb) : undefined,
    minGb: service.minGb ?? undefined,
    maxGb: service.maxGb ?? undefined,
    gbTiers: parseJsonArray<number>(service.gbTiers),
    network: (service.network as ServiceListing["network"]) ?? undefined,
    inStock: service.inStock,
    rating: Number(service.rating),
    trustScore: service.trustScore,
    deliverySpeedMins: service.deliverySpeedMins
  };
}

export function mapOrder(
  order: DbOrder & { timeline?: OrderStatusEvent[]; conversation?: { id: string } | null }
): Order {
  return {
    id: order.id,
    customerId: order.customerId,
    shopId: order.shopId,
    serviceId: order.serviceId,
    conversationId: order.conversation?.id,
    createdAt: order.createdAt.toISOString(),
    amountGhs: Number(order.amountGhs),
    platformCommissionGhs: Number(order.platformCommissionGhs),
    status: orderStatusToApp(order.status),
    timeline: (order.timeline ?? []).map((t) => ({
      status: orderStatusToApp(t.status),
      at: t.at.toISOString()
    })),
    details: (order.details as OrderDetails | null) ?? undefined,
    momoReceipt: (order.momoReceipt as MomoReceipt | null) ?? undefined,
    reviewSubmitted: order.reviewSubmitted
  };
}

export function mapReview(review: DbReview): Review {
  return {
    id: review.id,
    orderId: review.orderId,
    customerId: review.customerId,
    shopId: review.shopId,
    serviceId: review.serviceId ?? undefined,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt.toISOString()
  };
}

export function mapMessage(message: Message): ChatMessage {
  return {
    id: message.id,
    from: messageSenderToApp(message.from),
    body: message.body,
    at: message.at.toISOString(),
    read: message.read,
    attachment: (message.attachment as MessageAttachment | null) ?? undefined
  };
}

export function mapConversation(
  convo: DbConversation & { messages: Message[] }
): Conversation {
  return {
    id: convo.id,
    customerId: convo.customerId,
    shopId: convo.shopId,
    orderId: convo.orderId ?? undefined,
    lastMessageAt: convo.lastMessageAt.toISOString(),
    messages: convo.messages.map(mapMessage)
  };
}

export function mapStaff(staff: DbStaff): StaffMember {
  return {
    id: staff.id,
    shopId: staff.shopId,
    name: staff.name,
    roleTitle: staff.roleTitle as StaffMember["roleTitle"],
    phone: staff.phone,
    performanceScore: staff.performanceScore
  };
}

export function mapWalletTx(tx: DbWalletTx): WalletTransaction {
  return {
    id: tx.id,
    userId: tx.userId,
    type: tx.type === "CREDIT" ? "credit" : "debit",
    amountGhs: Number(tx.amountGhs),
    label: tx.label,
    orderId: tx.orderId ?? undefined,
    at: tx.at.toISOString()
  };
}

export function mapNotification(n: AppNotification) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    kind: n.kind as "order" | "message" | "system",
    href: n.href ?? undefined,
    forUserId: n.userId,
    at: n.at.toISOString(),
    read: n.read
  };
}
