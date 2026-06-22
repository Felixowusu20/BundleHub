import type { MobileNetwork, ServiceCategory, ServiceListing } from "@/types/marketplace";
import { STANDARD_GB_TIERS } from "@/lib/pricing";

export type ServiceFormState = {
  name: string;
  category: ServiceCategory;
  pricingModel: "fixed" | "per_gb";
  priceGhs: string;
  pricePerGb: string;
  minGb: string;
  maxGb: string;
  gbTiers: number[];
  network: MobileNetwork;
  description: string;
  inStock: boolean;
};

export const emptyServiceForm = (): ServiceFormState => ({
  name: "",
  category: "Data Bundles",
  pricingModel: "per_gb",
  priceGhs: "",
  pricePerGb: "",
  minGb: "1",
  maxGb: "50",
  gbTiers: [...STANDARD_GB_TIERS],
  network: "MTN",
  description: "",
  inStock: true
});

export function serviceToForm(service: ServiceListing): ServiceFormState {
  const perGb = service.pricingModel === "per_gb";
  return {
    name: service.name,
    category: service.category,
    pricingModel: perGb ? "per_gb" : "fixed",
    priceGhs: perGb ? "" : String(service.priceGhs),
    pricePerGb: perGb ? String(service.pricePerGb ?? "") : "",
    minGb: String(service.minGb ?? 1),
    maxGb: String(service.maxGb ?? 50),
    gbTiers: service.gbTiers?.length ? [...service.gbTiers] : [...STANDARD_GB_TIERS],
    network: service.network ?? "MTN",
    description: service.description,
    inStock: service.inStock
  };
}

export function validateServiceForm(form: ServiceFormState): string | null {
  if (!form.name.trim()) return "Service name is required.";

  const isData = form.category === "Data Bundles";
  const perGb = isData && form.pricingModel === "per_gb";

  if (perGb) {
    const pricePerGb = Number(form.pricePerGb);
    const minGb = Number(form.minGb) || 1;
    const maxGb = Number(form.maxGb) || 50;
    if (!pricePerGb || pricePerGb <= 0) return "Enter a valid price per GB.";
    if (minGb > maxGb) return "Min GB cannot be greater than max GB.";
    const tiers = form.gbTiers.filter((g) => g >= minGb && g <= maxGb);
    if (!tiers.length) return "Select at least one GB size to sell.";
  } else if (!Number(form.priceGhs) || Number(form.priceGhs) <= 0) {
    return "Enter a valid price.";
  }

  return null;
}

export function buildServicePayload(form: ServiceFormState) {
  const isData = form.category === "Data Bundles";
  const perGb = isData && form.pricingModel === "per_gb";
  const pricePerGb = Number(form.pricePerGb);
  const minGb = Number(form.minGb) || 1;
  const maxGb = Number(form.maxGb) || 50;
  const displayPrice = perGb
    ? Math.round(minGb * pricePerGb * 100) / 100
    : Number(form.priceGhs);
  const gbTiers = form.gbTiers.filter((g) => g >= minGb && g <= maxGb);

  return {
    category: form.category,
    name: form.name.trim(),
    description:
      form.description.trim() ||
      (perGb
        ? `${form.network} data — ${pricePerGb} GHS/GB`
        : `${form.name.trim()} — fulfilled manually`),
    priceGhs: displayPrice,
    pricingModel: perGb ? ("per_gb" as const) : ("fixed" as const),
    pricePerGb: perGb ? pricePerGb : undefined,
    minGb: perGb ? minGb : undefined,
    maxGb: perGb ? maxGb : undefined,
    gbTiers: perGb ? gbTiers : undefined,
    network: perGb ? form.network : undefined,
    inStock: form.inStock,
    deliverySpeedMins: 15
  };
}
