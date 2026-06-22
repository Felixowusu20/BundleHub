import { cn } from "@/lib/utils";
import { formatGhs } from "@/lib/format";
import { priceForGb } from "@/lib/pricing";
import type { ServiceListing } from "@/types/marketplace";

type Props = {
  service: ServiceListing;
  selectedGb: number;
  onSelect: (gb: number) => void;
  tiers: number[];
  showPrice?: boolean;
  className?: string;
};

export function GbSizeGrid({
  service,
  selectedGb,
  onSelect,
  tiers,
  showPrice = true,
  className
}: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Data size
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {tiers.map((gb) => {
          const active = selectedGb === gb;
          const price = priceForGb(service, gb);
          return (
            <button
              key={gb}
              type="button"
              onClick={() => onSelect(gb)}
              className={cn(
                "rounded-lg border px-1 py-2 text-center transition-colors",
                active
                  ? "border-mtn bg-mtn/15 ring-1 ring-mtn"
                  : "border-border bg-background hover:border-mtn/40 hover:bg-muted/50"
              )}
            >
              <span className="block text-sm font-semibold">{gb}GB</span>
              {showPrice && (
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {formatGhs(price)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
