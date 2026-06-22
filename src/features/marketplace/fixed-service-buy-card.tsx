"use client";

import { ServiceBrandPanel } from "@/components/shared/service-brand-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServiceBrand } from "@/lib/service-brand";
import { formatServiceFromLabel } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { ServiceListing } from "@/types/marketplace";

type Props = {
  service: ServiceListing;
  onBuy: () => void;
  className?: string;
};

export function FixedServiceBuyCard({ service, onBuy, className }: Props) {
  const brand = getServiceBrand(service);

  return (
    <div
      id={`service-${service.id}`}
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-card dark:shadow-card-dark",
        className
      )}
    >
      <div className="grid md:grid-cols-[minmax(120px,160px)_1fr]">
        <ServiceBrandPanel
          brandKey={brand.key}
          imageSrc={brand.imageSrc}
          alt={brand.title}
          className={brand.panelClass}
        />

        <div className="flex flex-col justify-between gap-4 p-4 sm:p-5">
          <div>
            <Badge variant="outline" className="text-[10px]">
              {service.category}
            </Badge>
            <h3 className="mt-2 font-display text-lg font-bold">{brand.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{service.name}</p>
            <p className="mt-3 font-display text-xl font-bold text-mtn">
              {formatServiceFromLabel(service)}
            </p>
          </div>
          <Button variant="brand" size="sm" className="w-full uppercase" onClick={onBuy}>
            Buy
          </Button>
        </div>
      </div>
    </div>
  );
}
