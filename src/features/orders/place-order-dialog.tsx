"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { formatGhs } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { OrderDetails, ServiceListing, Shop } from "@/types/marketplace";

const networks = ["MTN", "Telecel", "AirtelTigo"] as const;
const momoProviders = ["MTN MoMo", "Telecel Cash", "AirtelTigo Money"] as const;
const MAX_SCREENSHOT_BYTES = 1_500_000;

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? "");
  const [network, setNetwork] = useState<string>("MTN");
  const [meterNumber, setMeterNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [momoProvider, setMomoProvider] = useState<string>("MTN MoMo");
  const [momoReference, setMomoReference] = useState("");
  const [screenshot, setScreenshot] = useState<{
    dataUrl: string;
    name: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const buildDetails = (): OrderDetails => {
    const base: OrderDetails = {
      phoneNumber: phoneNumber.trim() || undefined,
      notes: notes.trim() || undefined
    };
    switch (service.category) {
      case "Data Bundles":
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

  const handleScreenshot = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image (screenshot or photo of your payment).");
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      toast.error("Image is too large. Please use a screenshot under 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setScreenshot({ dataUrl: reader.result, name: file.name });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    if (!momoReference.trim() && !screenshot) {
      toast.error("Add your MoMo reference or upload a payment screenshot.");
      return;
    }

    setSubmitting(true);
    const result = placeOrder({
      serviceId: service.id,
      details: buildDetails(),
      momoReceipt: {
        provider: momoProvider,
        reference: momoReference.trim() || undefined,
        screenshotDataUrl: screenshot?.dataUrl,
        screenshotName: screenshot?.name
      }
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    onOpenChange(false);
    toast.success("Payment sent — opening chat…");
    router.push(`/app/customer/messages?c=${result.conversationId}`);
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
          <p className="mt-2 font-display text-2xl font-bold text-mtn">
            {formatGhs(service.priceGhs)}
          </p>
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
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone number</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0241234567"
                required
              />
            </div>

            {(service.category === "Data Bundles" || service.category === "Airtime") && (
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

            <div className="space-y-3 rounded-2xl border border-mtn/30 bg-mtn/5 p-4">
              <div>
                <p className="text-sm font-medium">I have paid (MoMo proof)</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  After paying, share your MoMo reference or payment screenshot.
                  You&apos;ll be taken to chat while the seller verifies.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">MoMo provider</label>
                <div className="flex flex-wrap gap-2">
                  {momoProviders.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      size="sm"
                      variant={momoProvider === p ? "brand" : "outline"}
                      onClick={() => setMomoProvider(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">MoMo reference</label>
                <Input
                  value={momoReference}
                  onChange={(e) => setMomoReference(e.target.value)}
                  placeholder="Reference from MoMo SMS or app"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Payment screenshot</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleScreenshot(e.target.files?.[0])}
                />
                {screenshot ? (
                  <div className="relative overflow-hidden rounded-xl border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshot.dataUrl}
                      alt="MoMo payment proof"
                      className="max-h-48 w-full object-contain bg-black/5"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 top-2 h-8 w-8 rounded-full"
                      onClick={() => setScreenshot(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Upload screenshot
                  </Button>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="brand"
              className="w-full"
              disabled={submitting || user.walletBalanceGhs < service.priceGhs}
            >
              {user.walletBalanceGhs < service.priceGhs
                ? "Insufficient balance"
                : `I have paid — open chat`}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
