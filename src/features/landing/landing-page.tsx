"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bolt,
  Shield,
  Smartphone,
  Star,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlatformStore } from "@/stores/platform-store";
import { useActiveShops } from "@/hooks/use-platform";
import { formatGhs, formatNumber } from "@/lib/format";
import { TrustScore } from "@/components/shared/trust-score";
import { StarRating } from "@/components/shared/star-rating";
import { ShopBrowserSection } from "@/features/marketplace/shop-browser-section";
import { PageLoader } from "@/components/shared/page-loader";
import type { HomepagePayload } from "@/types/homepage";

const featureIcons: Record<string, LucideIcon> = {
  bolt: Bolt,
  shield: Shield,
  "trending-up": TrendingUp,
  smartphone: Smartphone
};

const steps = [
  { step: "01", title: "Browse & Compare", desc: "Search data, airtime, ECG, water, TV & vouchers." },
  { step: "02", title: "Choose Your Agent", desc: "Pick by price, trust score, or platform recommendation." },
  { step: "03", title: "Pay & Track", desc: "Order timeline from pending to completed in real-time." },
  { step: "04", title: "Rate & Earn", desc: "Leave reviews, earn loyalty points, refer friends." }
];

const plans = [
  {
    name: "Free",
    price: "GHS 0",
    features: ["Basic listings", "50 orders/month", "Standard support"],
    cta: "Start free",
    highlight: false
  },
  {
    name: "Pro",
    price: "GHS 99",
    features: ["Unlimited orders", "Priority listing", "Advanced analytics"],
    cta: "Go Pro",
    highlight: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["Multi-branch", "Staff management", "Dedicated support"],
    cta: "Contact us",
    highlight: false
  }
];

function sectionTitle(data: HomepagePayload | null, key: string, fallback: string) {
  return data?.sections.find((s) => s.key === key)?.title ?? fallback;
}

function sectionSubtitle(data: HomepagePayload | null, key: string, fallback: string) {
  return data?.sections.find((s) => s.key === key)?.subtitle ?? fallback;
}

export function LandingPage() {
  const initialize = usePlatformStore((s) => s.initialize);
  const allServices = usePlatformStore((s) => s.services);
  const activeShops = useActiveShops();
  const [homepage, setHomepage] = useState<HomepagePayload | null>(null);
  const [loadingHomepage, setLoadingHomepage] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: HomepagePayload | null) => setHomepage(data))
      .finally(() => setLoadingHomepage(false));
  }, []);

  const activeShopIds = useMemo(
    () => new Set(activeShops.map((s) => s.id)),
    [activeShops]
  );
  const marketplaceServices = useMemo(
    () => allServices.filter((s) => activeShopIds.has(s.shopId)),
    [allServices, activeShopIds]
  );

  const stats = homepage?.stats;
  const topShops = homepage?.topShops ?? [];
  const features = homepage?.features ?? [];
  const services = homepage?.services ?? [];
  const testimonials = homepage?.testimonials ?? [];

  if (loadingHomepage) {
    return <PageLoader label="Loading homepage…" />;
  }

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="hero-glow relative">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge className="mb-6 border-mtn/30 bg-mtn/10 text-foreground">
              🇬🇭 Affordable data & digital services for Ghana
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Buy data, airtime & bills{" "}
              <span className="gradient-brand-text">in a few taps</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Choose your network, compare prices from verified sellers, pay safely, and track
              delivery — simple like your favourite data shop, powered by BundleHub.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button variant="brand" size="lg" asChild>
                <Link href="/marketplace">
                  Buy Services <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/auth/register?type=shop">Start Selling</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/register">Create account</Link>
              </Button>
            </div>
          </motion.div>

          {topShops.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="relative mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {topShops.slice(0, 3).map((shop, i) => (
                <motion.div
                  key={shop.id}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3 + i, ease: "easeInOut" }}
                >
                  <Card className="glass-card border-0">
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {shop.name}
                        </span>
                        <Badge variant="outline" className="border-mtn/40 text-xs">
                          Trust {shop.trustScore}
                        </Badge>
                      </div>
                      <p className="font-display text-lg font-bold">{shop.city}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{shop.ownerName}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Browse shops */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <ShopBrowserSection compact services={marketplaceServices} />
          <div className="mt-6 text-center">
            <Button variant="brand" asChild>
              <Link href="/marketplace">View all shops</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30 py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {[
            {
              label: "Orders processed",
              value: formatNumber(stats?.ordersProcessed ?? 0)
            },
            {
              label: "Platform revenue",
              value: formatGhs(stats?.platformRevenueGhs ?? 0)
            },
            {
              label: "Active shops",
              value: String(stats?.activeShops ?? 0)
            },
            {
              label: "Avg trust score",
              value: stats?.avgTrustScore ? `${stats.avgTrustScore}/100` : "—"
            }
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-2xl font-bold md:text-3xl gradient-brand-text">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why BundleHub */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              {sectionTitle(homepage, "why_bundlehub", "Why BundleHub?")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {sectionSubtitle(
                homepage,
                "why_bundlehub",
                "Enterprise-grade marketplace with the warmth of Ghana's top mobile apps."
              )}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = featureIcons[f.icon] ?? Bolt;
              return (
                <Card
                  key={f.id}
                  className="group border-0 shadow-card transition-all hover:shadow-brand dark:shadow-card-dark"
                >
                  <CardContent className="p-6">
                    <div
                      className={`mb-4 inline-flex rounded-2xl p-3 ${
                        f.color === "mtn"
                          ? "bg-mtn/15 text-mtn"
                          : "bg-telecel/15 text-telecel"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mesh-bg py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">
            How it works
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="relative rounded-3xl bg-card p-6 shadow-card dark:shadow-card-dark">
                <span className="font-display text-4xl font-bold text-mtn/30">{s.step}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              {sectionTitle(homepage, "services", "Services")}
            </h2>
            {sectionSubtitle(homepage, "services", "") && (
              <p className="mt-3 text-muted-foreground">
                {sectionSubtitle(homepage, "services", "")}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {services.map((s) => (
              <Link key={s.id} href={`/marketplace?network=${s.network}`}>
                <Card className="cursor-pointer border-0 text-center shadow-card transition-transform hover:-translate-y-1 hover:shadow-brand dark:shadow-card-dark">
                  <CardContent className="p-5">
                    <span className="text-3xl">{s.emoji}</span>
                    <p className="mt-2 text-sm font-semibold">{s.name}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{s.brands}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top agents */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold">
                {sectionTitle(homepage, "top_agents", "Top Agents")}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {sectionSubtitle(
                  homepage,
                  "top_agents",
                  "Ranked by trust score and platform activity"
                )}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/marketplace">View all</Link>
            </Button>
          </div>
          {topShops.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Active shops will appear here once sellers are approved.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {topShops.map((shop, i) => (
                <Card key={shop.id} className="border-0 shadow-card dark:shadow-card-dark">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-brand text-sm font-bold text-white">
                        #{i + 1}
                      </div>
                      {shop.featured && (
                        <Badge className="gradient-mtn text-[10px] text-charcoal">Featured</Badge>
                      )}
                    </div>
                    <h3 className="mt-3 font-semibold">{shop.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {shop.city} • {shop.ownerName}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <StarRating rating={shop.rating} size="sm" />
                      <TrustScore score={shop.trustScore} size="sm" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              {sectionTitle(homepage, "testimonials", "Loved across Ghana")}
            </h2>
            {sectionSubtitle(homepage, "testimonials", "") && (
              <p className="mt-3 text-muted-foreground">
                {sectionSubtitle(homepage, "testimonials", "")}
              </p>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.id} className="border-0 shadow-card dark:shadow-card-dark">
                <CardContent className="p-6">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-mtn text-mtn" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-mtn/30 to-telecel/30 text-xs font-bold">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.city}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mesh-bg py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-4 text-center font-display text-3xl font-bold">Pricing</h2>
          <p className="mb-12 text-center text-muted-foreground">
            Plans for every seller — from solo agents to enterprise shops.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <Card
                key={p.name}
                className={`border-0 ${
                  p.highlight
                    ? "ring-2 ring-mtn shadow-brand"
                    : "shadow-card dark:shadow-card-dark"
                }`}
              >
                <CardContent className="p-8">
                  {p.highlight && (
                    <Badge className="mb-4 gradient-mtn text-charcoal">Most popular</Badge>
                  )}
                  <h3 className="font-display text-xl font-bold">{p.name}</h3>
                  <p className="mt-2 font-display text-3xl font-bold">{p.price}</p>
                  <ul className="mt-6 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <BadgeCheck className="h-4 w-4 text-mtn" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full"
                    variant={p.highlight ? "brand" : "outline"}
                    asChild
                  >
                    <Link href="/app/shop_owner">{p.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-muted-foreground">
            Join Ghanaians buying and selling digital services on BundleHub.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button variant="brand" size="lg" asChild>
              <Link href="/marketplace">
                <Zap className="mr-1" /> Buy Services
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/app/shop_owner">
                <Users className="mr-1" /> Start Selling
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
