import type { ServiceCategory, ServiceListing, MobileNetwork } from "@/types/marketplace";

/** Brand artwork sourced from freedatagh.com service tiles (bundled locally in /public/brands). */
export const BRAND_ASSETS = {
  mtn: "/brands/mtn.jpg",
  telecel: "/brands/telecel.jpg",
  airteltigo: "/brands/airteltigo.jpg",
  airteltigoBigtime: "/brands/airteltigo-bigtime.jpg",
  airtime: "/brands/airtime.jpg",
  resultsChecker: "/brands/results-checker.jpg"
} as const;

export type ServiceBrandKey =
  | "mtn"
  | "telecel"
  | "airteltigo"
  | "airtime"
  | "electricity"
  | "water"
  | "tv"
  | "waec"
  | "bece"
  | "digital";

export type ServiceBrandStyle = {
  key: ServiceBrandKey;
  title: string;
  panelClass: string;
  imageSrc?: string;
};

const CATEGORY_BRAND: Record<ServiceCategory, ServiceBrandKey> = {
  "Data Bundles": "mtn",
  Airtime: "airtime",
  Electricity: "electricity",
  Water: "water",
  "TV Subscription": "tv",
  "WAEC Vouchers": "waec",
  "BECE Vouchers": "bece",
  "Digital Services": "digital"
};

const NETWORK_TITLE: Record<MobileNetwork, string> = {
  MTN: "MTN",
  Telecel: "Telecel",
  AirtelTigo: "AirtelTigo"
};

const NETWORK_KEY: Record<MobileNetwork, ServiceBrandKey> = {
  MTN: "mtn",
  Telecel: "telecel",
  AirtelTigo: "airteltigo"
};

const PANEL_CLASS: Record<ServiceBrandKey, string> = {
  mtn: "bg-[#FFCC00]",
  telecel: "bg-[#E60000]",
  airteltigo: "bg-[#ED1C24]",
  airtime: "bg-neutral-100",
  electricity: "bg-gradient-to-br from-amber-400 to-orange-600",
  water: "bg-gradient-to-br from-sky-400 to-blue-700",
  tv: "bg-gradient-to-br from-indigo-600 to-violet-900",
  waec: "bg-neutral-100",
  bece: "bg-neutral-100",
  digital: "bg-gradient-to-br from-mtn/80 to-telecel/80"
};

const BRAND_IMAGE: Partial<Record<ServiceBrandKey, string>> = {
  mtn: BRAND_ASSETS.mtn,
  telecel: BRAND_ASSETS.telecel,
  airteltigo: BRAND_ASSETS.airteltigo,
  airtime: BRAND_ASSETS.airtime,
  waec: BRAND_ASSETS.resultsChecker,
  bece: BRAND_ASSETS.resultsChecker
};

function brandFromName(name: string): ServiceBrandKey | null {
  const n = name.toLowerCase();
  if (n.includes("telecel")) return "telecel";
  if (n.includes("airteltigo") || n.includes("airtel")) return "airteltigo";
  if (n.includes("mtn")) return "mtn";
  if (n.includes("ecg") || n.includes("electric") || n.includes("nedco")) return "electricity";
  if (n.includes("water") || n.includes("gwcl")) return "water";
  if (n.includes("dstv") || n.includes("gotv") || n.includes("startimes") || n.includes("tv"))
    return "tv";
  if (n.includes("waec")) return "waec";
  if (n.includes("bece")) return "bece";
  return null;
}

function resolveBrandImage(key: ServiceBrandKey, serviceName: string): string | undefined {
  if (key === "airteltigo") {
    return serviceName.toLowerCase().includes("bigtime")
      ? BRAND_ASSETS.airteltigoBigtime
      : BRAND_ASSETS.airteltigo;
  }
  return BRAND_IMAGE[key];
}

function buildBrand(key: ServiceBrandKey, title: string, serviceName: string): ServiceBrandStyle {
  return {
    key,
    title,
    panelClass: PANEL_CLASS[key],
    imageSrc: resolveBrandImage(key, serviceName)
  };
}

export function getServiceBrand(service: ServiceListing): ServiceBrandStyle {
  if (service.network) {
    return buildBrand(
      NETWORK_KEY[service.network],
      NETWORK_TITLE[service.network],
      service.name
    );
  }

  const fromName = brandFromName(service.name);
  if (fromName) {
    return buildBrand(fromName, service.name.split(" ")[0] ?? service.name, service.name);
  }

  const categoryKey = CATEGORY_BRAND[service.category];
  return buildBrand(categoryKey, service.name, service.name);
}
