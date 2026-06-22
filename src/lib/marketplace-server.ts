import { prisma } from "@/lib/prisma";
import { toAppRole } from "@/lib/auth";
import { calculateOrderAmount, isValidGbTier } from "@/lib/pricing";
import { customerTotalSpend } from "@/lib/order-analytics";
import { loyaltyLevelFromSpend } from "@/lib/loyalty";
import { applyReviewAverages } from "@/lib/ratings";
import {
  mapConversation,
  mapMessage,
  mapNotification,
  mapOrder,
  mapReview,
  mapService,
  mapShop,
  mapStaff,
  mapWalletTx,
  messageSenderToDb,
  orderStatusToApp,
  orderStatusToDb,
  pricingModelToDb,
  shopStatusToDb
} from "@/lib/marketplace-mappers";
import type { SessionPayload } from "@/lib/auth";
import type {
  MomoReceiptInput,
  OrderDetails,
  OrderStatus,
  PlaceOrderInput,
  ServiceListing,
  UpdateServiceInput,
  UpdateShopInput
} from "@/types/marketplace";
import { Prisma } from "@/generated/prisma/client";

export type MarketplaceSyncPayload = {
  shops: ReturnType<typeof mapShop>[];
  services: ReturnType<typeof mapService>[];
  orders: ReturnType<typeof mapOrder>[];
  reviews: ReturnType<typeof mapReview>[];
  conversations: ReturnType<typeof mapConversation>[];
  staff: ReturnType<typeof mapStaff>[];
  walletTransactions: ReturnType<typeof mapWalletTx>[];
  notifications: ReturnType<typeof mapNotification>[];
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

function isAdmin(role: string) {
  return role === "SUPER_ADMIN" || role === "SUB_ADMIN";
}

async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  kind: string;
  href?: string;
}) {
  return prisma.appNotification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      kind: input.kind,
      href: input.href
    }
  });
}

export async function getMarketplaceSync(
  session: SessionPayload | null
): Promise<MarketplaceSyncPayload> {
  const isLoggedIn = Boolean(session);
  const admin = session && isAdmin(session.role);

  const shopWhere = admin ? {} : { status: "ACTIVE" as const };

  const [shopsRaw, servicesRaw] = await Promise.all([
    prisma.shop.findMany({
      where: shopWhere,
      include: { owner: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.service.findMany({
      where: admin
        ? {}
        : { shop: { status: "ACTIVE" }, inStock: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  let ordersRaw: Awaited<ReturnType<typeof prisma.order.findMany>> = [];
  let reviewsRaw: Awaited<ReturnType<typeof prisma.review.findMany>> = [];
  let convosRaw: Prisma.ConversationGetPayload<{
    include: { messages: true };
  }>[] = [];
  let staffRaw: Awaited<ReturnType<typeof prisma.staffMember.findMany>> = [];
  let walletRaw: Awaited<ReturnType<typeof prisma.walletTransaction.findMany>> = [];
  let notifRaw: Awaited<ReturnType<typeof prisma.appNotification.findMany>> = [];
  let usersRaw: Prisma.UserGetPayload<{
    include: { shop: { select: { id: true } } };
  }>[] = [];

  if (admin) {
    [ordersRaw, reviewsRaw, convosRaw, staffRaw, walletRaw, notifRaw, usersRaw] =
      await Promise.all([
        prisma.order.findMany({
          include: { timeline: { orderBy: { at: "asc" } }, conversation: true },
          orderBy: { createdAt: "desc" }
        }),
        prisma.review.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.conversation.findMany({
          include: { messages: { orderBy: { at: "asc" } } },
          orderBy: { lastMessageAt: "desc" }
        }),
        prisma.staffMember.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.walletTransaction.findMany({ orderBy: { at: "desc" }, take: 500 }),
        prisma.appNotification.findMany({ orderBy: { at: "desc" }, take: 200 }),
        prisma.user.findMany({
          include: { shop: { select: { id: true } } },
          orderBy: { createdAt: "desc" }
        })
      ]);
  } else if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { shop: true }
    });
    const appRole = toAppRole(session.role);

    if (appRole === "customer") {
      [ordersRaw, reviewsRaw, convosRaw, walletRaw, notifRaw] = await Promise.all([
        prisma.order.findMany({
          where: { customerId: session.userId },
          include: { timeline: { orderBy: { at: "asc" } }, conversation: true },
          orderBy: { createdAt: "desc" }
        }),
        prisma.review.findMany({
          where: { customerId: session.userId },
          orderBy: { createdAt: "desc" }
        }),
        prisma.conversation.findMany({
          where: { customerId: session.userId },
          include: { messages: { orderBy: { at: "asc" } } },
          orderBy: { lastMessageAt: "desc" }
        }),
        prisma.walletTransaction.findMany({
          where: { userId: session.userId },
          orderBy: { at: "desc" },
          take: 100
        }),
        prisma.appNotification.findMany({
          where: { userId: session.userId },
          orderBy: { at: "desc" },
          take: 50
        })
      ]);
    } else if (appRole === "shop_owner" && user?.shop) {
      const shopId = user.shop.id;
      [ordersRaw, reviewsRaw, convosRaw, staffRaw, walletRaw, notifRaw] =
        await Promise.all([
          prisma.order.findMany({
            where: { shopId },
            include: { timeline: { orderBy: { at: "asc" } }, conversation: true },
            orderBy: { createdAt: "desc" }
          }),
          prisma.review.findMany({ where: { shopId }, orderBy: { createdAt: "desc" } }),
          prisma.conversation.findMany({
            where: { shopId },
            include: { messages: { orderBy: { at: "asc" } } },
            orderBy: { lastMessageAt: "desc" }
          }),
          prisma.staffMember.findMany({ where: { shopId }, orderBy: { createdAt: "desc" } }),
          prisma.walletTransaction.findMany({
            where: { userId: session.userId },
            orderBy: { at: "desc" },
            take: 100
          }),
          prisma.appNotification.findMany({
            where: { userId: session.userId },
            orderBy: { at: "desc" },
            take: 50
          })
        ]);
    }
  }

  return {
    shops: shopsRaw.map(mapShop),
    services: servicesRaw.map(mapService),
    orders: ordersRaw.map(mapOrder),
    reviews: reviewsRaw.map(mapReview),
    conversations: convosRaw.map(mapConversation),
    staff: staffRaw.map(mapStaff),
    walletTransactions: walletRaw.map(mapWalletTx),
    notifications: notifRaw.map(mapNotification),
    users: usersRaw.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      city: u.city ?? "",
      role: toAppRole(u.role),
      walletBalanceGhs: Number(u.walletBalance),
      loyaltyLevel: u.loyaltyLevel,
      shopId: u.shop?.id,
      createdAt: u.createdAt.toISOString()
    }))
  };
}

export async function approveShop(shopId: string) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error("Shop not found.");

  const badges = Array.isArray(shop.badges) ? [...(shop.badges as string[])] : [];
  if (!badges.includes("Verified Seller")) badges.push("Verified Seller");

  await prisma.shop.update({
    where: { id: shopId },
    data: { status: "ACTIVE", badges }
  });

  await createNotification({
    userId: shop.ownerId,
    title: "Shop approved",
    body: `${shop.name} is now live on BundleHub.`,
    kind: "system"
  });
}

export async function updateShopStatus(
  shopId: string,
  status: "active" | "suspended" | "pending"
) {
  await prisma.shop.update({
    where: { id: shopId },
    data: { status: shopStatusToDb(status) }
  });
}

export async function featureShop(shopId: string, featured: boolean) {
  await prisma.shop.update({ where: { id: shopId }, data: { featured } });
}

export async function patchShop(shopId: string, input: UpdateShopInput) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error("Shop not found.");

  const data: Prisma.ShopUpdateInput = {
    ...(input.name ? { name: input.name.trim() } : {}),
    ...(input.phone ? { phone: input.phone.trim() } : {}),
    ...(input.city ? { city: input.city.trim() } : {}),
    ...(input.description !== undefined
      ? { description: input.description.trim() || null }
      : {}),
    ...(input.status ? { status: shopStatusToDb(input.status) } : {}),
    ...(input.featured !== undefined ? { featured: input.featured } : {}),
    ...(input.trustScore !== undefined ? { trustScore: input.trustScore } : {})
  };

  await prisma.$transaction(async (tx) => {
    await tx.shop.update({ where: { id: shopId }, data });
    if (input.ownerName || input.phone || input.city) {
      await tx.user.update({
        where: { id: shop.ownerId },
        data: {
          ...(input.ownerName ? { name: input.ownerName.trim() } : {}),
          ...(input.phone ? { phone: input.phone.trim() } : {}),
          ...(input.city ? { city: input.city.trim() } : {})
        }
      });
    }
  });

  if (input.ownerName || input.phone || input.city) {
    await createNotification({
      userId: shop.ownerId,
      title: "Shop profile updated",
      body: `${input.name?.trim() || shop.name} was updated.`,
      kind: "system"
    });
  }
}

export async function deleteShop(shopId: string) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error("Shop not found.");
  await prisma.shop.delete({ where: { id: shopId } });
  await createNotification({
    userId: shop.ownerId,
    title: "Shop removed",
    body: `${shop.name} was removed from BundleHub.`,
    kind: "system"
  });
}

export async function createService(
  shopId: string,
  service: Omit<ServiceListing, "id" | "shopId" | "rating" | "trustScore">
) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error("Shop not found.");

  const row = await prisma.service.create({
    data: {
      shopId,
      category: service.category,
      name: service.name,
      description: service.description,
      priceGhs: service.priceGhs,
      pricingModel: pricingModelToDb(service.pricingModel),
      pricePerGb: service.pricePerGb,
      minGb: service.minGb,
      maxGb: service.maxGb,
      gbTiers: service.gbTiers ?? [],
      network: service.network,
      inStock: service.inStock,
      trustScore: shop.trustScore,
      deliverySpeedMins: service.deliverySpeedMins
    }
  });
  return mapService(row);
}

export async function patchService(serviceId: string, input: UpdateServiceInput) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new Error("Listing not found.");

  const pricingModel = input.pricingModel ?? (service.pricingModel === "PER_GB" ? "per_gb" : "fixed");
  const isPerGb = pricingModel === "per_gb";
  let priceGhs = input.priceGhs ?? Number(service.priceGhs);
  if (isPerGb) {
    const pricePerGb = input.pricePerGb ?? Number(service.pricePerGb ?? 0);
    const minGb = input.minGb ?? service.minGb ?? 1;
    priceGhs = Math.round(minGb * pricePerGb * 100) / 100;
  }

  const row = await prisma.service.update({
    where: { id: serviceId },
    data: {
      ...(input.category ? { category: input.category } : {}),
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      priceGhs,
      pricingModel: pricingModelToDb(isPerGb ? "per_gb" : "fixed"),
      pricePerGb: isPerGb ? input.pricePerGb ?? Number(service.pricePerGb) : null,
      minGb: isPerGb ? input.minGb ?? service.minGb : null,
      maxGb: isPerGb ? input.maxGb ?? service.maxGb : null,
      gbTiers: isPerGb
        ? ((input.gbTiers ??
            (Array.isArray(service.gbTiers) ? service.gbTiers : [])) as Prisma.InputJsonValue)
        : Prisma.DbNull,
      network: isPerGb ? input.network ?? service.network : null,
      ...(input.inStock !== undefined ? { inStock: input.inStock } : {}),
      ...(input.deliverySpeedMins !== undefined
        ? { deliverySpeedMins: input.deliverySpeedMins }
        : {})
    }
  });
  return mapService(row);
}

export async function removeService(serviceId: string) {
  const active = await prisma.order.count({
    where: {
      serviceId,
      status: { in: ["PENDING", "ACCEPTED", "PROCESSING"] }
    }
  });
  if (active > 0) {
    throw new Error("Cannot remove a listing with active orders.");
  }
  await prisma.service.delete({ where: { id: serviceId } });
}

function formatOrderMessage(serviceName: string, details: OrderDetails) {
  const parts: string[] = [];
  if (details.phoneNumber) parts.push(`Phone: ${details.phoneNumber}`);
  if (details.network) parts.push(`Network: ${details.network}`);
  if (details.meterNumber) parts.push(`Meter: ${details.meterNumber}`);
  if (details.accountNumber) parts.push(`Account: ${details.accountNumber}`);
  if (details.smartCardNumber) parts.push(`Smart card: ${details.smartCardNumber}`);
  if (details.packageName) parts.push(`Package: ${details.packageName}`);
  if (details.quantityGb) parts.push(`Data: ${details.quantityGb} GB`);
  if (details.quantity) parts.push(`Qty: ${details.quantity}`);
  if (details.notes) parts.push(`Notes: ${details.notes}`);
  return parts.length ? parts.join("\n") : serviceName;
}

export async function placeOrder(customerId: string, input: PlaceOrderInput) {
  const customer = await prisma.user.findUnique({ where: { id: customerId } });
  if (!customer || customer.role !== "CUSTOMER") {
    throw new Error("Please sign in as a customer to place orders.");
  }

  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
    include: { shop: { include: { owner: true } } }
  });
  if (!service || !service.inStock) throw new Error("Service is unavailable.");

  const shop = service.shop;
  if (shop.status !== "ACTIVE") throw new Error("This shop is not accepting orders.");

  const mappedService = mapService(service);
  if (mappedService.pricingModel === "per_gb") {
    const gb = input.details.quantityGb;
    if (gb == null || !isValidGbTier(mappedService, gb)) {
      throw new Error("Choose a valid data size for this package.");
    }
  }

  const amount = calculateOrderAmount(mappedService, input.details);
  if (amount <= 0) throw new Error("Invalid order amount.");

  const balance = Number(customer.walletBalance);
  if (balance < amount) {
    throw new Error(`Insufficient balance. You need ${amount.toFixed(2)} GHS.`);
  }

  const commission = Math.round(amount * 0.03 * 100) / 100;
  const now = new Date();
  const orderMessage = formatOrderMessage(service.name, input.details);

  const result = await prisma.$transaction(async (tx) => {
    const existingConvo = await tx.conversation.findFirst({
      where: { customerId, shopId: shop.id }
    });

    let conversationId: string;
    if (existingConvo) {
      conversationId = existingConvo.id;
    } else {
      const convo = await tx.conversation.create({
        data: { customerId, shopId: shop.id, lastMessageAt: now }
      });
      conversationId = convo.id;
    }

    const order = await tx.order.create({
      data: {
        customerId,
        shopId: shop.id,
        serviceId: service.id,
        amountGhs: amount,
        platformCommissionGhs: commission,
        status: "PENDING",
        details: { ...input.details, amount },
        timeline: { create: { status: "PENDING", at: now } }
      },
      include: { timeline: true, conversation: true }
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { orderId: order.id, lastMessageAt: now }
    });

    const messages = [
      {
        conversationId,
        from: "CUSTOMER" as const,
        body: `🛒 New order ${order.id}\n${service.name} — ${amount.toFixed(2)} GHS\n${orderMessage}`,
        at: now
      },
      {
        conversationId,
        from: "SYSTEM" as const,
        body: `✅ Payment of ${amount.toFixed(2)} GHS complete. Send your MoMo screenshot below if you paid ${shop.name} directly, then wait for delivery.`,
        at: now
      },
      {
        conversationId,
        from: "SYSTEM" as const,
        body: `💰 Payment received (${amount.toFixed(2)} GHS). Fulfill the order — buyer may send MoMo proof in chat.`,
        at: now
      }
    ];
    await tx.message.createMany({ data: messages });

    await tx.user.update({
      where: { id: customerId },
      data: { walletBalance: { decrement: amount } }
    });

    await tx.walletTransaction.create({
      data: {
        userId: customerId,
        type: "DEBIT",
        amountGhs: amount,
        label: `${service.name} — ${shop.name}`,
        orderId: order.id
      }
    });

    await tx.appNotification.createMany({
      data: [
        {
          userId: shop.ownerId,
          title: "New paid order",
          body: `${customer.name} paid ${amount.toFixed(2)} GHS for ${service.name}.`,
          kind: "order",
          href: `/app/shop_owner/messages?c=${conversationId}`
        },
        {
          userId: customerId,
          title: "Payment successful",
          body: `You paid ${amount.toFixed(2)} GHS to ${shop.name}. Send MoMo proof in chat now.`,
          kind: "order",
          href: `/app/customer/messages?c=${conversationId}&proof=1&order=${order.id}`
        }
      ]
    });

    return { order, conversationId };
  });

  return {
    orderId: result.order.id,
    conversationId: result.conversationId
  };
}

export async function submitMomoProof(
  customerId: string,
  orderId: string,
  input: MomoReceiptInput
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { service: true, shop: true, conversation: true }
  });
  if (!order || order.customerId !== customerId) throw new Error("Order not found.");
  if (order.momoReceipt) throw new Error("Payment proof was already sent.");
  if (!["PENDING", "ACCEPTED"].includes(order.status)) {
    throw new Error("This order no longer accepts payment proof.");
  }

  const ref = input.reference?.trim();
  if (!ref && !input.screenshotDataUrl) {
    throw new Error("Add a MoMo reference or upload a payment screenshot.");
  }

  const now = new Date();
  const momoReceipt = {
    provider: input.provider,
    reference: ref || undefined,
    screenshotDataUrl: input.screenshotDataUrl,
    screenshotName: input.screenshotName,
    amountGhs: Number(order.amountGhs),
    paidAt: now.toISOString()
  };

  const conversationId = order.conversation?.id;
  if (!conversationId) throw new Error("No chat linked to this order.");

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { momoReceipt }
    });

    await tx.message.createMany({
      data: [
        {
          conversationId,
          from: "CUSTOMER",
          body: `📱 MoMo payment — please verify\nProvider: ${momoReceipt.provider}\nAmount: GHS ${momoReceipt.amountGhs.toFixed(2)}`,
          attachment: {
            kind: "momo_receipt",
            ...momoReceipt
          },
          at: now
        },
        {
          conversationId,
          from: "SYSTEM",
          body: "📤 Buyer sent MoMo proof — verify and confirm payment.",
          at: now
        }
      ]
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now }
    });

    const customer = await tx.user.findUnique({ where: { id: customerId } });
    await tx.appNotification.create({
      data: {
        userId: order.shop.ownerId,
        title: "MoMo proof received",
        body: `${customer?.name ?? "Buyer"} sent payment proof for ${order.service.name}.`,
        kind: "order",
        href: `/app/shop_owner/messages?c=${conversationId}`
      }
    });
  });
}

export async function updateOrderStatus(
  actorId: string,
  actorRole: string,
  orderId: string,
  status: OrderStatus
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      service: true,
      shop: true,
      customer: true,
      timeline: true,
      conversation: true
    }
  });
  if (!order) throw new Error("Order not found.");

  const user = await prisma.user.findUnique({
    where: { id: actorId },
    include: { shop: true }
  });
  if (!user) throw new Error("Unauthorized.");

  const isAdminUser = isAdmin(actorRole);
  if (user.role === "SHOP_OWNER" && user.shop?.id !== order.shopId) {
    throw new Error("Not your order.");
  }

  const current = orderStatusToApp(order.status);
  const transitions: Record<string, OrderStatus[]> = isAdminUser
    ? {
        pending: ["accepted", "processing", "completed", "cancelled"],
        accepted: ["processing", "completed", "cancelled"],
        processing: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
        disputed: ["processing", "completed", "cancelled"]
      }
    : {
        pending: ["accepted", "cancelled"],
        accepted: ["processing", "cancelled"],
        processing: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
        disputed: []
      };

  if (!(transitions[current] ?? []).includes(status)) {
    throw new Error(`Cannot move from ${current} to ${status}.`);
  }

  const now = new Date();
  const dbStatus = orderStatusToDb(status);

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: dbStatus },
    });
    await tx.orderStatusEvent.create({
      data: { orderId, status: dbStatus, at: now }
    });

    if (status === "cancelled") {
      await tx.user.update({
        where: { id: order.customerId },
        data: { walletBalance: { increment: order.amountGhs } }
      });
      await tx.walletTransaction.create({
        data: {
          userId: order.customerId,
          type: "CREDIT",
          amountGhs: order.amountGhs,
          label: `Refund — ${order.service.name}`,
          orderId
        }
      });
    }

    if (status === "completed") {
      const payout = Number(order.amountGhs) - Number(order.platformCommissionGhs);
      await tx.user.update({
        where: { id: order.shop.ownerId },
        data: { walletBalance: { increment: payout } }
      });
      await tx.walletTransaction.create({
        data: {
          userId: order.shop.ownerId,
          type: "CREDIT",
          amountGhs: payout,
          label: `Order payout — ${order.service.name}`,
          orderId
        }
      });

      const allOrders = await tx.order.findMany({ where: { customerId: order.customerId } });
      const mapped = allOrders.map((o) =>
        mapOrder({
          ...o,
          timeline: o.id === orderId ? [...order.timeline, { status: dbStatus, at: now, id: "", orderId }] : []
        })
      );
      const spend = customerTotalSpend(mapped, order.customerId);
      await tx.user.update({
        where: { id: order.customerId },
        data: { loyaltyLevel: loyaltyLevelFromSpend(spend) }
      });
    }

    const statusMessages: Partial<Record<OrderStatus, string>> = {
      accepted: "✅ Payment verified — seller is fulfilling your order.",
      processing: "⚙️ Seller is processing your order now.",
      completed: "🎉 Order delivered! Your service is complete.",
      cancelled: "❌ Order cancelled. Refund issued to buyer wallet."
    };
    const msgBody = statusMessages[status];
    if (msgBody && order.conversation) {
      await tx.message.create({
        data: {
          conversationId: order.conversation.id,
          from: "SYSTEM",
          body: msgBody,
          at: now
        }
      });
      await tx.conversation.update({
        where: { id: order.conversation.id },
        data: { lastMessageAt: now }
      });
    }
  });
}

export async function sendChatMessage(
  actorId: string,
  conversationId: string,
  body: string,
  from: "customer" | "shop"
) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { shop: true }
  });
  if (!convo || !body.trim()) throw new Error("Conversation not found.");

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.message.create({
      data: {
        conversationId,
        from: messageSenderToDb(from),
        body: body.trim(),
        at: now
      }
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now }
    });

    const recipientId = from === "customer" ? convo.shop.ownerId : convo.customerId;
    const recipientRole = from === "customer" ? "shop_owner" : "customer";
    await tx.appNotification.create({
      data: {
        userId: recipientId,
        title: "New chat message",
        body: body.trim().slice(0, 80),
        kind: "message",
        href: `/app/${recipientRole}/messages?c=${conversationId}`
      }
    });
  });
}

export async function topUpWallet(userId: string, amountGhs: number) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amountGhs } }
    }),
    prisma.walletTransaction.create({
      data: {
        userId,
        type: "CREDIT",
        amountGhs,
        label: "Wallet top-up"
      }
    })
  ]);
}

export async function withdrawWallet(userId: string, amountGhs: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Sign in required.");
  if (amountGhs < 10) throw new Error("Minimum withdrawal is GHS 10.");
  if (Number(user.walletBalance) < amountGhs) throw new Error("Insufficient balance.");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: amountGhs } }
    }),
    prisma.walletTransaction.create({
      data: {
        userId,
        type: "DEBIT",
        amountGhs,
        label: "Withdrawal to MoMo"
      }
    })
  ]);
}

export async function submitReview(
  customerId: string,
  orderId: string,
  rating: number,
  title = "",
  body = ""
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.customerId !== customerId) throw new Error("Order not found.");
  if (order.status !== "COMPLETED") throw new Error("You can only review completed orders.");
  if (order.reviewSubmitted) throw new Error("You already reviewed this order.");

  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        orderId,
        customerId,
        shopId: order.shopId,
        serviceId: order.serviceId,
        rating,
        title: title || (rating >= 4 ? "Great service" : "Feedback"),
        body: body || `Rated ${rating} stars.`
      }
    });
    await tx.order.update({ where: { id: orderId }, data: { reviewSubmitted: true } });

    const reviews = await tx.review.findMany({ where: { shopId: order.shopId } });
    const shops = await tx.shop.findMany({ where: { id: order.shopId } });
    const services = await tx.service.findMany({ where: { shopId: order.shopId } });
    const { shops: updatedShops, services: updatedServices } = applyReviewAverages(
      shops.map(mapShop),
      services.map(mapService),
      reviews.map(mapReview)
    );
    const shopUpdate = updatedShops[0];
    const serviceUpdates = updatedServices.filter((s) => s.shopId === order.shopId);
    if (shopUpdate) {
      await tx.shop.update({
        where: { id: order.shopId },
        data: { rating: shopUpdate.rating }
      });
    }
    for (const svc of serviceUpdates) {
      await tx.service.update({
        where: { id: svc.id },
        data: { rating: svc.rating }
      });
    }
  });
}

export async function addStaffMember(input: {
  shopId: string;
  name: string;
  roleTitle: "Support" | "Fulfillment" | "Manager";
  phone: string;
  performanceScore: number;
}) {
  const row = await prisma.staffMember.create({
    data: {
      shopId: input.shopId,
      name: input.name.trim(),
      roleTitle: input.roleTitle,
      phone: input.phone.trim(),
      performanceScore: input.performanceScore
    }
  });
  return mapStaff(row);
}

export async function openDispute(customerId: string, orderId: string, reason: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shop: true, conversation: true }
  });
  if (!order || order.customerId !== customerId) throw new Error("Order not found.");
  if (!["PENDING", "ACCEPTED", "PROCESSING", "COMPLETED"].includes(order.status)) {
    throw new Error("This order cannot be disputed.");
  }
  if (!reason.trim()) throw new Error("Describe the issue.");

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: "DISPUTED" } });
    await tx.orderStatusEvent.create({
      data: { orderId, status: "DISPUTED", at: now }
    });
    if (order.conversation) {
      await tx.message.create({
        data: {
          conversationId: order.conversation.id,
          from: "SYSTEM",
          body: `⚠️ Dispute opened: ${reason.trim()}`,
          at: now
        }
      });
      await tx.conversation.update({
        where: { id: order.conversation.id },
        data: { lastMessageAt: now }
      });
    }
    const customer = await tx.user.findUnique({ where: { id: customerId } });
    await tx.appNotification.create({
      data: {
        userId: order.shop.ownerId,
        title: "Dispute opened",
        body: `${customer?.name ?? "Buyer"} disputed order ${orderId}.`,
        kind: "order",
        href: `/app/shop_owner/orders`
      }
    });
  });
}

export async function deleteOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found.");

  const refundable = ["PENDING", "ACCEPTED", "PROCESSING", "DISPUTED"].includes(order.status);
  await prisma.$transaction(async (tx) => {
    if (refundable) {
      await tx.user.update({
        where: { id: order.customerId },
        data: { walletBalance: { increment: order.amountGhs } }
      });
      await tx.walletTransaction.create({
        data: {
          userId: order.customerId,
          type: "CREDIT",
          amountGhs: order.amountGhs,
          label: `Admin refund — order removed`,
          orderId
        }
      });
    }
    await tx.order.delete({ where: { id: orderId } });
  });
}

export async function removeStaffMember(staffId: string) {
  await prisma.staffMember.delete({ where: { id: staffId } });
}
