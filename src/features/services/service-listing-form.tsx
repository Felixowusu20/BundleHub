"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGhs } from "@/lib/format";
import { STANDARD_GB_TIERS } from "@/lib/pricing";
import type { ServiceFormState } from "@/lib/service-listing-form";
import type { MobileNetwork, ServiceCategory } from "@/types/marketplace";

const networks: MobileNetwork[] = ["MTN", "Telecel", "AirtelTigo"];

const categories: ServiceCategory[] = [
  "Data Bundles",
  "Airtime",
  "Electricity",
  "Water",
  "TV Subscription",
  "WAEC Vouchers",
  "BECE Vouchers",
  "Digital Services"
];

type Props = {
  form: ServiceFormState;
  onChange: (form: ServiceFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
};

export function ServiceListingForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel
}: Props) {
  const set = (patch: Partial<ServiceFormState>) => onChange({ ...form, ...patch });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium">Service name</label>
        <Input
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder={form.pricingModel === "per_gb" ? "MTN Data" : "MTN 10GB Bundle"}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Category</label>
        <select
          className="flex h-10 w-full rounded-xl border bg-background px-3 text-sm"
          value={form.category}
          onChange={(e) =>
            set({
              category: e.target.value as ServiceCategory,
              pricingModel: e.target.value === "Data Bundles" ? form.pricingModel : "fixed"
            })
          }
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.inStock}
            onChange={(e) => set({ inStock: e.target.checked })}
            className="h-4 w-4 rounded border"
          />
          In stock (visible to buyers)
        </label>
      </div>

      {form.category === "Data Bundles" && (
        <>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Pricing type</label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={form.pricingModel === "per_gb" ? "brand" : "outline"}
                onClick={() => set({ pricingModel: "per_gb" })}
              >
                Per GB (calculator)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={form.pricingModel === "fixed" ? "brand" : "outline"}
                onClick={() => set({ pricingModel: "fixed" })}
              >
                Fixed package price
              </Button>
            </div>
          </div>

          {form.pricingModel === "per_gb" ? (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Network</label>
                <select
                  className="flex h-10 w-full rounded-xl border bg-background px-3 text-sm"
                  value={form.network}
                  onChange={(e) => set({ network: e.target.value as MobileNetwork })}
                >
                  {networks.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Price per GB (GHS)</label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.pricePerGb}
                  onChange={(e) => set({ pricePerGb: e.target.value })}
                  placeholder="4.50"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Min GB</label>
                <Input
                  type="number"
                  min="1"
                  value={form.minGb}
                  onChange={(e) => set({ minGb: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Max GB</label>
                <Input
                  type="number"
                  min="1"
                  value={form.maxGb}
                  onChange={(e) => set({ maxGb: e.target.value })}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Buyers pick GB at checkout. Toggle which sizes you sell:
              </p>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                {STANDARD_GB_TIERS.map((gb) => {
                  const min = Number(form.minGb) || 1;
                  const max = Number(form.maxGb) || 100;
                  const inRange = gb >= min && gb <= max;
                  const selected = form.gbTiers.includes(gb);
                  return (
                    <Button
                      key={gb}
                      type="button"
                      size="sm"
                      variant={selected && inRange ? "brand" : "outline"}
                      disabled={!inRange}
                      className="h-8 min-w-[3rem] px-2 text-xs"
                      onClick={() =>
                        set({
                          gbTiers: selected
                            ? form.gbTiers.filter((t) => t !== gb)
                            : [...form.gbTiers, gb].sort((a, b) => a - b)
                        })
                      }
                    >
                      {gb}GB
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Example: 10 GB at {form.pricePerGb || "4.5"} GHS/GB ={" "}
                {formatGhs((Number(form.pricePerGb) || 0) * 10)}
              </p>
            </>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Price (GHS)</label>
              <Input
                type="number"
                min="1"
                value={form.priceGhs}
                onChange={(e) => set({ priceGhs: e.target.value })}
                required
              />
            </div>
          )}
        </>
      )}

      {form.category !== "Data Bundles" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Price (GHS)</label>
          <Input
            type="number"
            min="1"
            value={form.priceGhs}
            onChange={(e) => set({ priceGhs: e.target.value })}
            required
          />
        </div>
      )}

      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium">Description</label>
        <Input
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" variant="brand">
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
