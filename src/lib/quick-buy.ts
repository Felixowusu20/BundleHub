import type { ServiceCategory, ServiceListing } from "@/types/marketplace";
import { getServiceFromPrice } from "@/lib/pricing";

export type QuickBuyNetwork =
  | "mtn"
  | "telecel"
  | "airteltigo"
  | "airtime"
  | "bills"
  | "vouchers";

export const QUICK_BUY_NETWORKS: {
  id: QuickBuyNetwork;
  label: string;
  hint: string;
}[] = [
  { id: "mtn", label: "MTN", hint: "Data & bundles" },
  { id: "telecel", label: "Telecel", hint: "Data & bundles" },
  { id: "airteltigo", label: "AirtelTigo", hint: "Data & bundles" },
  { id: "airtime", label: "Airtime", hint: "All networks" },
  { id: "bills", label: "Bills", hint: "ECG • Water • TV" },
  { id: "vouchers", label: "Vouchers", hint: "WAEC • BECE" }
];

export const QUICK_BUY_TIPS: Record<QuickBuyNetwork, string> = {
  mtn: "Enter the correct MTN number. Recipient should not owe airtime for data bundles.",
  telecel: "Double-check the Telecel number before you pay.",
  airteltigo: "Works for AirtelTigo numbers. Confirm the recipient line is active.",
  airtime: "Airtime is sent to the phone number you provide at checkout.",
  bills: "Have your meter, account, or smart card number ready.",
  vouchers: "Vouchers are delivered after the seller confirms payment."
};

const BILL_CATEGORIES: ServiceCategory[] = [
  "Electricity",
  "Water",
  "TV Subscription"
];

const VOUCHER_CATEGORIES: ServiceCategory[] = ["WAEC Vouchers", "BECE Vouchers"];

export function inferQuickBuyNetwork(service: ServiceListing): QuickBuyNetwork {
  const name = service.name.toLowerCase();
  if (name.includes("telecel")) return "telecel";
  if (name.includes("airteltigo") || name.includes("airtel")) return "airteltigo";
  if (service.category === "Airtime") return "airtime";
  if (BILL_CATEGORIES.includes(service.category)) return "bills";
  if (VOUCHER_CATEGORIES.includes(service.category)) return "vouchers";
  return "mtn";
}

export function parseQuickBuyNetwork(value: string | null): QuickBuyNetwork | null {
  if (!value) return null;
  const id = value.toLowerCase().replace(/\s+/g, "") as QuickBuyNetwork;
  return QUICK_BUY_NETWORKS.some((n) => n.id === id) ? id : null;
}

export function filterServicesByNetwork(
  services: ServiceListing[],
  network: QuickBuyNetwork
): ServiceListing[] {
  const name = (s: ServiceListing) => s.name.toLowerCase();

  switch (network) {
    case "mtn":
      return services.filter((s) => s.network === "MTN" || name(s).includes("mtn"));
    case "telecel":
      return services.filter((s) => s.network === "Telecel" || name(s).includes("telecel"));
    case "airteltigo":
      return services.filter(
        (s) =>
          s.network === "AirtelTigo" ||
          name(s).includes("airteltigo") ||
          name(s).includes("airtel")
      );
    case "airtime":
      return services.filter((s) => s.category === "Airtime");
    case "bills":
      return services.filter((s) => BILL_CATEGORIES.includes(s.category));
    case "vouchers":
      return services.filter((s) => VOUCHER_CATEGORIES.includes(s.category));
    default:
      return services;
  }
}

export type PackageOffer = {
  name: string;
  best: ServiceListing;
  sellerCount: number;
};

/** Group identical package names and pick the cheapest listing. */
export function groupCheapestPackages(services: ServiceListing[]): PackageOffer[] {
  const map = new Map<string, ServiceListing[]>();
  for (const s of services) {
    const key = s.name.trim();
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([name, listings]) => {
      const sorted = [...listings].sort(
        (a, b) => getServiceFromPrice(a) - getServiceFromPrice(b)
      );
      return {
        name,
        best: sorted[0],
        sellerCount: sorted.length
      };
    })
    .sort((a, b) => a.best.priceGhs - b.best.priceGhs);
}
