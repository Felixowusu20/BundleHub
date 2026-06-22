import { prisma } from "@/lib/prisma";
import type {
  HomepageCmsPayload,
  HomepageFeatureDto,
  HomepagePayload,
  HomepageSectionDto,
  HomepageServiceDto,
  HomepageTestimonialDto
} from "@/types/homepage";

const DEFAULT_SECTIONS: Array<{
  key: HomepageSectionDto["key"];
  title: string;
  subtitle: string;
}> = [
  {
    key: "why_bundlehub",
    title: "Why BundleHub?",
    subtitle: "Enterprise-grade marketplace with the warmth of Ghana's top mobile apps."
  },
  {
    key: "services",
    title: "Services",
    subtitle: "Data, airtime, utilities, TV, and vouchers from verified sellers."
  },
  {
    key: "testimonials",
    title: "Loved across Ghana",
    subtitle: "Real stories from buyers and shop owners nationwide."
  },
  {
    key: "top_agents",
    title: "Top Agents",
    subtitle: "Ranked by trust score and platform activity."
  }
];

const DEFAULT_FEATURES: Omit<HomepageFeatureDto, "id">[] = [
  {
    icon: "bolt",
    title: "Instant Fulfillment",
    description:
      "Agents fulfill via MTN, Telecel & utility portals — you track every step.",
    color: "mtn",
    sortOrder: 0,
    published: true
  },
  {
    icon: "shield",
    title: "Trust Score System",
    description:
      "Ratings, disputes, response time & verification combined into 0–100 score.",
    color: "telecel",
    sortOrder: 1,
    published: true
  },
  {
    icon: "trending-up",
    title: "Best Price Engine",
    description:
      "Compare sellers side-by-side. MTN 10GB from GHS 48 to GHS 50 — pick yours.",
    color: "mtn",
    sortOrder: 2,
    published: true
  },
  {
    icon: "smartphone",
    title: "Mobile-First Design",
    description: "Built like your favourite MoMo apps — fast, familiar, and beautiful.",
    color: "telecel",
    sortOrder: 3,
    published: true
  }
];

const DEFAULT_SERVICES: Omit<HomepageServiceDto, "id">[] = [
  { name: "Data Bundles", emoji: "📶", brands: "MTN • Telecel • AT", network: "mtn", sortOrder: 0, published: true },
  { name: "Airtime", emoji: "📱", brands: "All networks", network: "airtime", sortOrder: 1, published: true },
  { name: "Electricity", emoji: "⚡", brands: "ECG • NEDCo", network: "bills", sortOrder: 2, published: true },
  { name: "Water", emoji: "💧", brands: "Ghana Water", network: "bills", sortOrder: 3, published: true },
  { name: "TV", emoji: "📺", brands: "DStv • GOtv • StarTimes", network: "bills", sortOrder: 4, published: true },
  { name: "Vouchers", emoji: "🎓", brands: "WAEC • BECE", network: "vouchers", sortOrder: 5, published: true }
];

const DEFAULT_TESTIMONIALS: Omit<HomepageTestimonialDto, "id">[] = [
  {
    name: "Ama Mensah",
    city: "Accra",
    text: "Bought MTN 10GB for GHS 48 — delivered in 5 minutes. Better than queuing at the shop!",
    rating: 5,
    sortOrder: 0,
    published: true
  },
  {
    name: "Kwame Boateng",
    city: "Kumasi",
    text: "The trust score helped me pick a reliable ECG token seller. No more failed top-ups.",
    rating: 5,
    sortOrder: 1,
    published: true
  },
  {
    name: "Akosua Darko",
    city: "Takoradi",
    text: "As a shop owner, BundleHub doubled my orders. The dashboard is so clean.",
    rating: 5,
    sortOrder: 2,
    published: true
  }
];

export async function ensureHomepageDefaults() {
  const sectionCount = await prisma.homepageSection.count();
  if (sectionCount === 0) {
    await prisma.homepageSection.createMany({
      data: DEFAULT_SECTIONS.map((s) => ({
        key: s.key,
        title: s.title,
        subtitle: s.subtitle
      }))
    });
  }

  const featureCount = await prisma.homepageFeature.count();
  if (featureCount === 0) {
    await prisma.homepageFeature.createMany({ data: DEFAULT_FEATURES });
  }

  const serviceCount = await prisma.homepageService.count();
  if (serviceCount === 0) {
    await prisma.homepageService.createMany({ data: DEFAULT_SERVICES });
  }

  const testimonialCount = await prisma.homepageTestimonial.count();
  if (testimonialCount === 0) {
    await prisma.homepageTestimonial.createMany({ data: DEFAULT_TESTIMONIALS });
  }

  await prisma.homepageStats.upsert({
    where: { id: "main" },
    create: { id: "main" },
    update: {}
  });
}

function mapFeature(row: {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  sortOrder: number;
  published: boolean;
}): HomepageFeatureDto {
  return {
    id: row.id,
    icon: row.icon as HomepageFeatureDto["icon"],
    title: row.title,
    description: row.description,
    color: row.color as HomepageFeatureDto["color"],
    sortOrder: row.sortOrder,
    published: row.published
  };
}

function mapService(row: {
  id: string;
  name: string;
  emoji: string;
  brands: string;
  network: string;
  sortOrder: number;
  published: boolean;
}): HomepageServiceDto {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    brands: row.brands,
    network: row.network,
    sortOrder: row.sortOrder,
    published: row.published
  };
}

function mapTestimonial(row: {
  id: string;
  name: string;
  city: string;
  text: string;
  rating: number;
  sortOrder: number;
  published: boolean;
}): HomepageTestimonialDto {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    text: row.text,
    rating: row.rating,
    sortOrder: row.sortOrder,
    published: row.published
  };
}

async function computeShopStats() {
  const activeShops = await prisma.shop.findMany({
    where: { status: "ACTIVE" },
    select: { trustScore: true }
  });

  const activeCount = activeShops.length;
  const avgTrustScore =
    activeCount > 0
      ? Math.round(
          activeShops.reduce((sum, s) => sum + s.trustScore, 0) / activeCount
        )
      : 0;

  return { activeCount, avgTrustScore };
}

export async function getHomepagePayload(): Promise<HomepagePayload> {
  await ensureHomepageDefaults();

  const [sections, features, services, testimonials, topShops, statsRow, shopStats] =
    await Promise.all([
      prisma.homepageSection.findMany({ orderBy: { key: "asc" } }),
      prisma.homepageFeature.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" }
      }),
      prisma.homepageService.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" }
      }),
      prisma.homepageTestimonial.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" }
      }),
      prisma.shop.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ featured: "desc" }, { trustScore: "desc" }, { rating: "desc" }],
        take: 4,
        include: { owner: { select: { name: true } } }
      }),
      prisma.homepageStats.findUnique({ where: { id: "main" } }),
      computeShopStats()
    ]);

  return {
    sections: sections.map((s) => ({
      key: s.key as HomepageSectionDto["key"],
      title: s.title,
      subtitle: s.subtitle
    })),
    features: features.map(mapFeature),
    services: services.map(mapService),
    testimonials: testimonials.map(mapTestimonial),
    topShops: topShops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      city: shop.city,
      ownerName: shop.owner.name,
      trustScore: shop.trustScore,
      rating: Number(shop.rating),
      featured: shop.featured
    })),
    stats: {
      ordersProcessed: statsRow?.ordersProcessed ?? 0,
      platformRevenueGhs: Number(statsRow?.platformRevenueGhs ?? 0),
      activeShops: shopStats.activeCount,
      avgTrustScore: shopStats.avgTrustScore
    }
  };
}

export async function getHomepageCmsPayload(): Promise<HomepageCmsPayload> {
  await ensureHomepageDefaults();

  const [publicData, featuresAll, servicesAll, testimonialsAll, statsRow] =
    await Promise.all([
      getHomepagePayload(),
      prisma.homepageFeature.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.homepageService.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.homepageTestimonial.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.homepageStats.findUnique({ where: { id: "main" } })
    ]);

  return {
    ...publicData,
    featuresAll: featuresAll.map(mapFeature),
    servicesAll: servicesAll.map(mapService),
    testimonialsAll: testimonialsAll.map(mapTestimonial),
    statsEditable: {
      ordersProcessed: statsRow?.ordersProcessed ?? 0,
      platformRevenueGhs: Number(statsRow?.platformRevenueGhs ?? 0)
    }
  };
}
