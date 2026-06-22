"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GbSizeGrid } from "@/components/shared/gb-size-grid";
import { ServiceBrandPanel } from "@/components/shared/service-brand-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { formatGhs } from "@/lib/format";
import { getServiceBrand } from "@/lib/service-brand";
import {
  calculateOrderAmount,
  getAvailableGbTiers,
  isPerGbService,
  isValidGbTier
} from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { customerProofChatUrl } from "@/lib/chat-routes";
import type { ServiceListing, Shop } from "@/types/marketplace";

type Props = {
  service: ServiceListing;
  shop: Shop;
  className?: string;
  defaultSelected?: boolean;
};

export function ServiceBuyCard({ service, shop, className, defaultSelected }: Props) {
  const router = useRouter();
  const user = useCurrentUser();
  const placeOrder = usePlatformStore((s) => s.placeOrder);

  const perGb = isPerGbService(service);
  const tiers = useMemo(() => getAvailableGbTiers(service), [service]);
  const [selectedGb, setSelectedGb] = useState(tiers[0] ?? 1);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);

  const brand = getServiceBrand(service);
  const network = service.network;

  const orderAmount = useMemo(
    () =>
      calculateOrderAmount(service, {
        quantityGb: perGb ? selectedGb : undefined
      }),
    [service, perGb, selectedGb]
  );

  const handleBuy = async () => {
    if (!user) {
      toast.message("Sign in to buy");
      router.push("/auth/login");
      return;
    }
    if (user.role !== "customer") {
      toast.error("Use a customer account to buy.");
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error("Enter the beneficiary phone number.");
      return;
    }
    if (perGb && !isValidGbTier(service, selectedGb)) {
      toast.error("Pick a valid data size.");
      return;
    }

    setSubmitting(true);
    const result = await placeOrder({
      serviceId: service.id,
      details: {
        phoneNumber: phoneNumber.trim(),
        network: network ?? brand.title,
        packageName: service.name,
        quantityGb: perGb ? selectedGb : undefined
      }
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`Paid ${formatGhs(orderAmount)} — send MoMo proof to ${shop.name}`);
    router.replace(customerProofChatUrl(result.conversationId, result.orderId));
  };

  if (!perGb) return null;

  return (
    <div
      id={`service-${service.id}`}
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-card dark:shadow-card-dark",
        defaultSelected && "ring-2 ring-mtn/40",
        className
      )}
    >
      <div className="grid md:grid-cols-[minmax(140px,180px)_1fr]">
        <ServiceBrandPanel
          brandKey={brand.key}
          imageSrc={brand.imageSrc}
          alt={brand.title}
          className={brand.panelClass}
        />

        <div className="space-y-4 p-4 sm:p-6">
          <div>
            <h3 className="font-display text-2xl font-bold">{brand.title}</h3>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatGhs(orderAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedGb} GB × {formatGhs(service.pricePerGb ?? 0)}/GB
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {service.name} • {shop.name} • {shop.city}
            </p>
          </div>

          <GbSizeGrid
            service={service}
            tiers={tiers}
            selectedGb={selectedGb}
            onSelect={setSelectedGb}
            showPrice={brand.key !== "telecel"}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Beneficiary phone number <span className="text-telecel">*</span>
            </label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter number here"
            />
          </div>

          {user?.role === "customer" && (
            <p className="text-xs text-muted-foreground">
              Wallet: {formatGhs(user.walletBalanceGhs)} • Total: {formatGhs(orderAmount)}
            </p>
          )}

          {!user ? (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Total for {selectedGb} GB:{" "}
                <span className="font-semibold text-foreground">
                  {formatGhs(orderAmount)}
                </span>
              </p>
              <Button variant="brand" className="h-12 w-full text-base font-bold uppercase" asChild>
                <Link href="/auth/login">Sign in to buy</Link>
              </Button>
            </>
          ) : user.role !== "customer" ? (
            <p className="text-sm text-muted-foreground">Switch to a customer account to buy.</p>
          ) : (
            <Button
              type="button"
              className={cn(
                "h-12 w-full text-base font-bold uppercase",
                user.walletBalanceGhs < orderAmount
                  ? "bg-muted text-muted-foreground"
                  : "bg-neutral-600 text-white hover:bg-neutral-700"
              )}
              disabled={submitting || user.walletBalanceGhs < orderAmount}
              onClick={handleBuy}
            >
              {user.walletBalanceGhs < orderAmount
                ? "Insufficient balance"
                : "Buy"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
