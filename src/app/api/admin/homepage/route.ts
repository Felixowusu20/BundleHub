import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHomepageCmsPayload, ensureHomepageDefaults } from "@/lib/homepage";

async function requireAdmin() {
  const session = await getSessionFromCookies();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "SUB_ADMIN")) {
    return null;
  }
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const data = await getHomepageCmsPayload();
    return NextResponse.json(data);
  } catch (e) {
    console.error("admin homepage GET", e);
    return NextResponse.json({ error: "Could not load homepage CMS." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      sections,
      features,
      services,
      testimonials,
      stats
    } = body as {
      sections?: Array<{ key: string; title: string; subtitle?: string | null }>;
      features?: Array<{
        id?: string;
        icon: string;
        title: string;
        description: string;
        color: string;
        sortOrder: number;
        published: boolean;
      }>;
      services?: Array<{
        id?: string;
        name: string;
        emoji: string;
        brands: string;
        network: string;
        sortOrder: number;
        published: boolean;
      }>;
      testimonials?: Array<{
        id?: string;
        name: string;
        city: string;
        text: string;
        rating: number;
        sortOrder: number;
        published: boolean;
      }>;
      stats?: { ordersProcessed?: number; platformRevenueGhs?: number };
    };

    await ensureHomepageDefaults();

    if (sections?.length) {
      for (const section of sections) {
        await prisma.homepageSection.update({
          where: { key: section.key },
          data: {
            title: section.title.trim(),
            subtitle: section.subtitle?.trim() || null
          }
        });
      }
    }

    if (features) {
      const incomingIds = new Set(features.filter((f) => f.id).map((f) => f.id!));
      const existing = await prisma.homepageFeature.findMany({ select: { id: true } });
      const toDelete = existing.filter((e) => !incomingIds.has(e.id)).map((e) => e.id);

      if (toDelete.length) {
        await prisma.homepageFeature.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const feature of features) {
        const data = {
          icon: feature.icon,
          title: feature.title.trim(),
          description: feature.description.trim(),
          color: feature.color,
          sortOrder: feature.sortOrder,
          published: feature.published
        };

        const existing = feature.id
          ? await prisma.homepageFeature.findUnique({ where: { id: feature.id } })
          : null;

        if (existing) {
          await prisma.homepageFeature.update({ where: { id: feature.id }, data });
        } else {
          await prisma.homepageFeature.create({ data });
        }
      }
    }

    if (services) {
      const incomingIds = new Set(services.filter((s) => s.id).map((s) => s.id!));
      const existing = await prisma.homepageService.findMany({ select: { id: true } });
      const toDelete = existing.filter((e) => !incomingIds.has(e.id)).map((e) => e.id);

      if (toDelete.length) {
        await prisma.homepageService.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const service of services) {
        const data = {
          name: service.name.trim(),
          emoji: service.emoji,
          brands: service.brands.trim(),
          network: service.network.trim(),
          sortOrder: service.sortOrder,
          published: service.published
        };

        const existing = service.id
          ? await prisma.homepageService.findUnique({ where: { id: service.id } })
          : null;

        if (existing) {
          await prisma.homepageService.update({ where: { id: service.id }, data });
        } else {
          await prisma.homepageService.create({ data });
        }
      }
    }

    if (testimonials) {
      const incomingIds = new Set(testimonials.filter((t) => t.id).map((t) => t.id!));
      const existing = await prisma.homepageTestimonial.findMany({ select: { id: true } });
      const toDelete = existing.filter((e) => !incomingIds.has(e.id)).map((e) => e.id);

      if (toDelete.length) {
        await prisma.homepageTestimonial.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const testimonial of testimonials) {
        const data = {
          name: testimonial.name.trim(),
          city: testimonial.city.trim(),
          text: testimonial.text.trim(),
          rating: Math.min(5, Math.max(1, testimonial.rating)),
          sortOrder: testimonial.sortOrder,
          published: testimonial.published
        };

        const existing = testimonial.id
          ? await prisma.homepageTestimonial.findUnique({ where: { id: testimonial.id } })
          : null;

        if (existing) {
          await prisma.homepageTestimonial.update({ where: { id: testimonial.id }, data });
        } else {
          await prisma.homepageTestimonial.create({ data });
        }
      }
    }

    if (stats) {
      await prisma.homepageStats.upsert({
        where: { id: "main" },
        create: {
          id: "main",
          ordersProcessed: stats.ordersProcessed ?? 0,
          platformRevenueGhs: stats.platformRevenueGhs ?? 0
        },
        update: {
          ordersProcessed: stats.ordersProcessed ?? 0,
          platformRevenueGhs: stats.platformRevenueGhs ?? 0
        }
      });
    }

    const data = await getHomepageCmsPayload();
    return NextResponse.json(data);
  } catch (e) {
    console.error("admin homepage PUT", e);
    return NextResponse.json({ error: "Could not save homepage CMS." }, { status: 500 });
  }
}
