export type HomepageSectionKey =
  | "why_bundlehub"
  | "services"
  | "testimonials"
  | "top_agents";

export type HomepageFeatureIcon = "bolt" | "shield" | "trending-up" | "smartphone";
export type HomepageFeatureColor = "mtn" | "telecel";

export interface HomepageSectionDto {
  key: HomepageSectionKey;
  title: string;
  subtitle: string | null;
}

export interface HomepageFeatureDto {
  id: string;
  icon: HomepageFeatureIcon;
  title: string;
  description: string;
  color: HomepageFeatureColor;
  sortOrder: number;
  published: boolean;
}

export interface HomepageServiceDto {
  id: string;
  name: string;
  emoji: string;
  brands: string;
  network: string;
  sortOrder: number;
  published: boolean;
}

export interface HomepageTestimonialDto {
  id: string;
  name: string;
  city: string;
  text: string;
  rating: number;
  sortOrder: number;
  published: boolean;
}

export interface HomepageShopDto {
  id: string;
  name: string;
  city: string;
  ownerName: string;
  trustScore: number;
  rating: number;
  featured: boolean;
}

export interface HomepageStatsDto {
  ordersProcessed: number;
  platformRevenueGhs: number;
  activeShops: number;
  avgTrustScore: number;
}

export interface HomepagePayload {
  sections: HomepageSectionDto[];
  features: HomepageFeatureDto[];
  services: HomepageServiceDto[];
  testimonials: HomepageTestimonialDto[];
  topShops: HomepageShopDto[];
  stats: HomepageStatsDto;
}

export interface HomepageCmsPayload extends HomepagePayload {
  featuresAll: HomepageFeatureDto[];
  servicesAll: HomepageServiceDto[];
  testimonialsAll: HomepageTestimonialDto[];
  statsEditable: {
    ordersProcessed: number;
    platformRevenueGhs: number;
  };
}
