import type {
  AnalyticsPoint,
  BadgeType,
  Conversation,
  Customer,
  Order,
  OrderStatus,
  Review,
  ServiceCategory,
  ServiceListing,
  Shop,
  StaffMember,
  VerificationFlag
} from "@/types/marketplace";

type RNG = {
  next: () => number; // [0,1)
  int: (min: number, max: number) => number; // inclusive
  pick: <T>(arr: readonly T[]) => T;
  chance: (p: number) => boolean;
  shuffle: <T>(arr: T[]) => T[];
};

function createRng(seed = 1337): RNG {
  // Deterministic LCG (good enough for mock data)
  let s = seed >>> 0;
  const next = () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
  const int = (min: number, max: number) =>
    Math.floor(next() * (max - min + 1)) + min;
  const pick = <T,>(arr: readonly T[]) => arr[int(0, arr.length - 1)]!;
  const chance = (p: number) => next() < p;
  const shuffle = <T,>(arr: T[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = int(0, i);
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  };
  return { next, int, pick, chance, shuffle };
}

const firstNames = [
  "Ama",
  "Kofi",
  "Kwame",
  "Akosua",
  "Yaw",
  "Yaa",
  "Kojo",
  "Adwoa",
  "Nana",
  "Afia",
  "Abena",
  "Efua",
  "Esi",
  "Kwabena",
  "Kwaku",
  "Akua",
  "Akwasi",
  "Mawuli",
  "Selorm",
  "Nii"
] as const;

const lastNames = [
  "Mensah",
  "Owusu",
  "Boateng",
  "Asare",
  "Osei",
  "Appiah",
  "Agyeman",
  "Addo",
  "Adjei",
  "Amponsah",
  "Asamoah",
  "Bonsu",
  "Darko",
  "Gyasi",
  "Kwarteng",
  "Nyarko",
  "Oppong",
  "Sarpong",
  "Tetteh",
  "Wiredu"
] as const;

const cities = [
  "Accra",
  "Kumasi",
  "Takoradi",
  "Tema",
  "Tamale",
  "Cape Coast",
  "Koforidua",
  "Sunyani",
  "Ho",
  "Bolgatanga"
] as const;

const categories: readonly ServiceCategory[] = [
  "Data Bundles",
  "Airtime",
  "Electricity",
  "Water",
  "TV Subscription",
  "WAEC Vouchers",
  "BECE Vouchers",
  "Digital Services"
] as const;

const serviceNamesByCategory: Record<ServiceCategory, readonly string[]> = {
  "Data Bundles": [
    "MTN 10GB Bundle",
    "Telecel 5GB Bundle",
    "AirtelTigo 8GB Bundle",
    "MTN Midnight Bundle",
    "Telecel Weekly Data"
  ],
  Airtime: ["MTN Airtime Top‑up", "Telecel Airtime", "AirtelTigo Airtime"],
  Electricity: ["ECG Electricity Token", "NEDCo Electricity Token"],
  Water: ["Ghana Water Bill Payment"],
  "TV Subscription": ["DStv Compact", "GOtv Max", "StarTimes Basic"],
  "WAEC Vouchers": ["WAEC Result Checker", "WAEC Registration Voucher"],
  "BECE Vouchers": ["BECE Checker Voucher"],
  "Digital Services": [
    "E‑Voucher (Generic)",
    "Mobile Money Statement PDF",
    "SIM Registration Support"
  ]
};

const reviewBodies = [
  "Fast delivery and good communication.",
  "Great price. Will order again.",
  "Smooth process. Seller was responsive.",
  "Took a bit longer than expected, but completed.",
  "Excellent service. Highly recommended."
] as const;

const reviewTitles = ["Quick delivery", "Best price", "Very responsive", "Trusted", "Good service"] as const;

function ghPhone(rng: RNG) {
  // Ghana mobile numbers often start with 0; use realistic 10-digit.
  const prefixes = ["020", "024", "026", "027", "050", "054", "055", "056", "057", "059"] as const;
  const prefix = rng.pick(prefixes);
  const rest = String(rng.int(0, 9999999)).padStart(7, "0");
  return `${prefix}${rest}`;
}

function fullName(rng: RNG) {
  return `${rng.pick(firstNames)} ${rng.pick(lastNames)}`;
}

function isoDateDaysAgo(rng: RNG, maxDaysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - rng.int(0, maxDaysAgo));
  d.setMinutes(d.getMinutes() - rng.int(0, 1200));
  return d.toISOString();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function calcBadges(trustScore: number, rating: number): BadgeType[] {
  const out: BadgeType[] = [];
  if (trustScore >= 85) out.push("Trusted Seller");
  if (trustScore >= 92) out.push("Top Seller");
  if (trustScore >= 96 && rating >= 4.6) out.push("Elite Seller");
  if (trustScore >= 75) out.push("Verified Seller");
  if (out.length === 0) out.push("New Seller");
  return Array.from(new Set(out)).slice(0, 3);
}

function calcVerification(rng: RNG, trustScore: number): VerificationFlag[] {
  const flags: VerificationFlag[] = [];
  if (rng.chance(clamp(trustScore / 110, 0.2, 0.95))) flags.push("phone_verified");
  if (rng.chance(clamp(trustScore / 120, 0.15, 0.9))) flags.push("email_verified");
  if (rng.chance(clamp((trustScore - 10) / 130, 0.05, 0.85)))
    flags.push("identity_verified");
  if (rng.chance(clamp((trustScore - 20) / 140, 0.02, 0.75)))
    flags.push("business_verified");
  return flags;
}

function orderTimeline(status: OrderStatus, createdAt: string, rng: RNG) {
  const t0 = new Date(createdAt).getTime();
  const step = (mins: number) => new Date(t0 + mins * 60_000).toISOString();
  const acceptedAt = step(rng.int(5, 120));
  const processingAt = step(rng.int(30, 360));
  const completedAt = step(rng.int(60, 720));
  const disputedAt = step(rng.int(120, 1440));

  const base = [{ status: "pending" as const, at: createdAt }];
  if (status === "pending") return base;
  if (status === "accepted") return [...base, { status: "accepted" as const, at: acceptedAt }];
  if (status === "processing")
    return [
      ...base,
      { status: "accepted" as const, at: acceptedAt },
      { status: "processing" as const, at: processingAt }
    ];
  if (status === "completed")
    return [
      ...base,
      { status: "accepted" as const, at: acceptedAt },
      { status: "processing" as const, at: processingAt },
      { status: "completed" as const, at: completedAt }
    ];
  return [
    ...base,
    { status: "accepted" as const, at: acceptedAt },
    { status: "processing" as const, at: processingAt },
    { status: "disputed" as const, at: disputedAt }
  ];
}

export type SeedConfig = {
  customers: number;
  shops: number;
  staff: number;
  services: number;
  orders: number;
  reviews: number;
  conversations: number;
  analyticsMonths: number;
};

/** Lean demo seed — real accounts come from registration */
export const LIGHT_SEED: SeedConfig = {
  customers: 0,
  shops: 8,
  staff: 4,
  services: 16,
  orders: 20,
  reviews: 10,
  conversations: 5,
  analyticsMonths: 6
};

export function generateMockData(seed = 20260617, config: SeedConfig = LIGHT_SEED) {
  const rng = createRng(seed);

  const customers: Customer[] = Array.from({ length: config.customers }).map((_, i) => {
    const loyalty = rng.pick(["Bronze", "Silver", "Gold", "Platinum", "Diamond"] as const);
    return {
      id: `cus_${i + 1}`,
      name: fullName(rng),
      phone: ghPhone(rng),
      city: rng.pick(cities),
      createdAt: isoDateDaysAgo(rng, 365),
      loyaltyLevel: loyalty,
      walletBalanceGhs: rng.int(0, 1200) + rng.next()
    };
  });

  const shops: Shop[] = Array.from({ length: config.shops }).map((_, i) => {
    const ownerName = fullName(rng);
    const rating = Math.round((3.6 + rng.next() * 1.3) * 10) / 10;
    const trustScore = clamp(Math.round(55 + rng.next() * 45), 0, 100);
    const status =
      i === 0 ? "pending" : rng.chance(0.05) ? "suspended" : "active";
    const shopId = `shop_${i + 1}`;
    return {
      id: shopId,
      name: `${rng.pick(["Bundle", "Swift", "Prime", "Metro", "Nova", "Zen", "Apex", "Kente"])} ${rng.pick(["Connect", "Digital", "Mart", "Hub", "Services", "Pay", "Store"])}`,
      ownerId: `seed_owner_${i + 1}`,
      ownerName,
      phone: ghPhone(rng),
      city: rng.pick(cities),
      rating,
      trustScore,
      badges: calcBadges(trustScore, rating),
      verification: calcVerification(rng, trustScore),
      status,
      featured: rng.chance(0.15),
      createdAt: isoDateDaysAgo(rng, 300)
    };
  });

  const staff: StaffMember[] = Array.from({ length: config.staff }).map((_, i) => {
    const shop = rng.pick(shops);
    return {
      id: `staff_${i + 1}`,
      shopId: shop.id,
      name: fullName(rng),
      roleTitle: rng.pick(["Support", "Fulfillment", "Manager"] as const),
      phone: ghPhone(rng),
      performanceScore: clamp(Math.round(60 + rng.next() * 40), 0, 100)
    };
  });

  const services: ServiceListing[] = Array.from({ length: config.services }).map((_, i) => {
    const category = rng.pick(categories);
    const name = rng.pick(serviceNamesByCategory[category]);
    const shop = rng.pick(shops);
    const rating = Math.round((3.7 + rng.next() * 1.2) * 10) / 10;
    const trustScore = clamp(
      Math.round(shop.trustScore * (0.85 + rng.next() * 0.25)),
      0,
      100
    );
    const basePrice =
      category === "Data Bundles"
        ? rng.int(12, 60)
        : category === "Airtime"
          ? rng.int(5, 200)
          : category === "Electricity"
            ? rng.int(20, 500)
            : category === "Water"
              ? rng.int(10, 250)
              : category === "TV Subscription"
                ? rng.int(80, 450)
                : category.includes("Vouchers")
                  ? rng.int(12, 40)
                  : rng.int(15, 120);

    return {
      id: `svc_${i + 1}`,
      category,
      name,
      description: `${name} • Fulfilled manually via seller portal • Instant updates via chat`,
      shopId: shop.id,
      priceGhs: basePrice + Math.round(rng.next() * 10),
      inStock: !rng.chance(0.08),
      rating,
      trustScore,
      deliverySpeedMins: rng.int(5, 180)
    };
  });

  const statusPick = (): OrderStatus => {
    const r = rng.next();
    if (r < 0.18) return "pending";
    if (r < 0.32) return "accepted";
    if (r < 0.55) return "processing";
    if (r < 0.95) return "completed";
    return "disputed";
  };

  const pickCustomerId = () =>
    customers.length > 0
      ? rng.pick(customers).id
      : `seed_cus_${rng.int(1, 12)}`;

  const orders: Order[] = Array.from({ length: config.orders }).map((_, i) => {
    const customerId = pickCustomerId();
    const service = rng.pick(services);
    const shop = shops.find((s) => s.id === service.shopId) ?? rng.pick(shops);
    const amountGhs =
      service.category === "Airtime"
        ? rng.int(5, 200)
        : service.category === "Electricity"
          ? rng.int(20, 500)
          : Math.max(service.priceGhs, rng.int(10, 380));
    const status = statusPick();
    const createdAt = isoDateDaysAgo(rng, 180);
    const commissionRate = 0.03; // 3% example
    const platformCommissionGhs = Math.round(amountGhs * commissionRate * 100) / 100;

    return {
      id: `ord_${i + 1}`,
      customerId,
      shopId: shop.id,
      serviceId: service.id,
      createdAt,
      amountGhs,
      platformCommissionGhs,
      status,
      timeline: orderTimeline(status, createdAt, rng)
    };
  });

  const reviews: Review[] = Array.from({ length: config.reviews }).map((_, i) => {
    const completed = orders.filter((o) => o.status === "completed");
    const order = completed.length ? rng.pick(completed) : rng.pick(orders);
    const rating = clamp(Math.round((3 + rng.next() * 2) * 10) / 10, 1, 5);
    return {
      id: `rev_${i + 1}`,
      orderId: order.id,
      customerId: order.customerId,
      shopId: order.shopId,
      rating,
      title: rng.pick(reviewTitles),
      body: rng.pick(reviewBodies),
      createdAt: isoDateDaysAgo(rng, 120)
    };
  });

  const conversations: Conversation[] = Array.from({ length: config.conversations }).map((_, i) => {
    const order = rng.pick(orders);
    const msgCount = rng.int(4, 18);
    const messages = Array.from({ length: msgCount }).map((__, mi) => {
      const from = mi % 2 === 0 ? ("customer" as const) : ("shop" as const);
      const hasAttachment = mi === msgCount - 3 && rng.chance(0.15);
      return {
        id: `msg_${i + 1}_${mi + 1}`,
        from,
        body:
          from === "customer"
            ? rng.pick([
                "Hi, please confirm when it’s done.",
                "I’ve sent the details. Thanks.",
                "Can you share a screenshot?",
                "Please use the same number as last time."
              ])
            : rng.pick([
                "Received. Processing now.",
                "Done. Please confirm receipt.",
                "Thanks! We’ll update you shortly.",
                "Noted — completing within 10 mins."
              ]),
        at: isoDateDaysAgo(rng, 30),
        read: rng.chance(0.85),
        attachment: hasAttachment ? { kind: "image" as const, name: "receipt.png" } : undefined
      };
    });
    messages.sort((a, b) => (a.at < b.at ? -1 : 1));
    return {
      id: `convo_${i + 1}`,
      customerId: order.customerId,
      shopId: order.shopId,
      orderId: rng.chance(0.75) ? order.id : undefined,
      lastMessageAt: messages[messages.length - 1]?.at ?? order.createdAt,
      messages
    };
  });

  const analytics: AnalyticsPoint[] = (() => {
    const now = new Date();
    const points: AnalyticsPoint[] = [];
    for (let k = config.analyticsMonths - 1; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const ordersCount = rng.int(40, 120);
      const revenueGhs = ordersCount * rng.int(18, 35) + rng.int(0, 1500);
      const commissionGhs = Math.round(revenueGhs * 0.03 * 100) / 100;
      points.push({
        month,
        revenueGhs,
        orders: ordersCount,
        commissionGhs,
        newCustomers: rng.int(8, 40)
      });
    }
    return points;
  })();

  return { customers, shops, staff, services, orders, reviews, conversations, analytics };
}

