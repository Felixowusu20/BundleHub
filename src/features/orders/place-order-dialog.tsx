"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { formatGhs } from "@/lib/format";
import { GbSizeGrid } from "@/components/shared/gb-size-grid";
import {
  calculateOrderAmount,
  formatServiceFromLabel,
  formatServicePriceLabel,
  getAvailableGbTiers,
  isPerGbService,
  isValidGbTier
} from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { customerProofChatUrl } from "@/lib/chat-routes";
import type { OrderDetails, ServiceListing, Shop } from "@/types/marketplace";

const networks = ["MTN", "Telecel", "AirtelTigo"] as const;

type Props = {
  service: ServiceListing;
  shop: Shop;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PlaceOrderDialog({ service, shop, open, onOpenChange }: Props) {
  const router = useRouter();
  const user = useCurrentUser();
  const placeOrder = usePlatformStore((s) => s.placeOrder);

  const perGb = isPerGbService(service);
  const tiers = useMemo(() => getAvailableGbTiers(service), [service]);

  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? "");
  const [network, setNetwork] = useState<string>(service.network ?? "MTN");
  const [selectedGb, setSelectedGb] = useState(tiers[0] ?? 1);
  const [meterNumber, setMeterNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const gbValue = selectedGb;

  const orderAmount = useMemo(
    () =>
      calculateOrderAmount(service, {
        quantityGb: perGb ? gbValue : undefined,
        quantity: Number(quantity) || 1
      }),
    [service, perGb, gbValue, quantity]
  );

  const buildDetails = (): OrderDetails => {
    const base: OrderDetails = {
      phoneNumber: phoneNumber.trim() || undefined,
      notes: notes.trim() || undefined
    };
    switch (service.category) {
      case "Data Bundles":
        return {
          ...base,
          network: perGb ? service.network ?? network : network,
          packageName: service.name,
          quantityGb: perGb ? gbValue : undefined
        };
      case "Airtime":
        return { ...base, network, packageName: service.name };
      case "Electricity":
        return { ...base, meterNumber: meterNumber.trim() || undefined };
      case "Water":
        return { ...base, accountNumber: accountNumber.trim() || undefined };
      case "TV Subscription":
        return { ...base, smartCardNumber: smartCardNumber.trim() || undefined };
      case "WAEC Vouchers":
      case "BECE Vouchers":
        return {
          ...base,
          quantity: Number(quantity) || 1,
          packageName: service.name
        };
      default:
        return { ...base, packageName: service.name };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in as a customer to place orders.");
      return;
    }
    if (user.role !== "customer") {
      toast.error("Switch to a customer account to buy services.");
      return;
    }
    if (!phoneNumber.trim() && service.category !== "Water") {
      toast.error("Phone number is required.");
      return;
    }
    if (perGb && !isValidGbTier(service, gbValue)) {
      toast.error("Pick a valid data size.");
      return;
    }

    setSubmitting(true);
    const result = await placeOrder({
      serviceId: service.id,
      details: buildDetails()
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    onOpenChange(false);
    toast.success(`Paid ${formatGhs(orderAmount)} — send MoMo proof to ${shop.name}`);
    router.replace(customerProofChatUrl(result.conversationId, result.orderId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buy from {shop.name}</DialogTitle>
        </DialogHeader>

        <div className="rounded-2xl bg-muted/50 p-4">
          <p className="font-medium">{service.name}</p>
          <p className="text-sm text-muted-foreground">{service.category}</p>
          {perGb ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatServicePriceLabel(service)}
            </p>
          ) : null}
          <p className="mt-2 font-display text-2xl font-bold text-mtn">
            {perGb ? formatGhs(orderAmount) : formatServiceFromLabel(service)}
          </p>
          {perGb && (
            <p className="text-xs text-muted-foreground">
              {gbValue} GB × {formatGhs(service.pricePerGb ?? 0)}/GB
            </p>
          )}
          {user && (
            <p className="mt-1 text-xs text-muted-foreground">
              Wallet balance: {formatGhs(user.walletBalanceGhs)}
            </p>
          )}
        </div>

        {!user ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in with a customer account to complete your purchase.
            </p>
            <Button variant="brand" asChild className="w-full">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        ) : user.role !== "customer" ? (
          <p className="text-sm text-muted-foreground">
            You are signed in as a shop owner. Log out and use a customer account to buy
            services.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {perGb && (
              <GbSizeGrid
                service={service}
                tiers={tiers}
                selectedGb={selectedGb}
                onSelect={setSelectedGb}
              />
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">Recipient phone</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0241234567"
                required={service.category !== "Water"}
              />
            </div>

            {(service.category === "Data Bundles" || service.category === "Airtime") &&
              !perGb && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Network</label>
                  <div className="flex flex-wrap gap-2">
                    {networks.map((n) => (
                      <Button
                        key={n}
                        type="button"
                        size="sm"
                        variant={network === n ? "brand" : "outline"}
                        onClick={() => setNetwork(n)}
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

            {service.category === "Electricity" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Meter number</label>
                <Input
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value)}
                  placeholder="ECG meter number"
                  required
                />
              </div>
            )}

            {service.category === "Water" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Account number</label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="GWCL account number"
                  required
                />
              </div>
            )}

            {service.category === "TV Subscription" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Smart card / IUC</label>
                <Input
                  value={smartCardNumber}
                  onChange={(e) => setSmartCardNumber(e.target.value)}
                  placeholder="DStv / GOtv IUC number"
                  required
                />
              </div>
            )}

            {(service.category === "WAEC Vouchers" ||
              service.category === "BECE Vouchers") && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Total: {formatGhs(orderAmount)}
                </p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Notes <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Pay from your wallet first. After payment, you can send MoMo proof in chat if you
              also paid {shop.name} on MoMo ({shop.phone}).
            </p>

            <Button
              type="submit"
              variant="brand"
              className="w-full"
              disabled={submitting || user.walletBalanceGhs < orderAmount}
            >
              {user.walletBalanceGhs < orderAmount
                ? `Need ${formatGhs(orderAmount - user.walletBalanceGhs)} more`
                : `Pay ${formatGhs(orderAmount)}`}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
