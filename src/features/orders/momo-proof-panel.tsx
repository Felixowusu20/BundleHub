"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { usePlatformStore } from "@/stores/platform-store";
import { formatGhs } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Order, Shop } from "@/types/marketplace";

const momoProviders = ["MTN MoMo", "Telecel Cash", "AirtelTigo Money"] as const;
const MAX_SCREENSHOT_BYTES = 1_500_000;

type Props = {
  order: Order;
  shop: Shop;
  highlight?: boolean;
  defaultExpanded?: boolean;
};

export function MomoProofPanel({
  order,
  shop,
  highlight,
  defaultExpanded = true
}: Props) {
  const submitMomoProof = usePlatformStore((s) => s.submitMomoProof);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const [momoProvider, setMomoProvider] = useState<string>("MTN MoMo");
  const [momoReference, setMomoReference] = useState("");
  const [screenshot, setScreenshot] = useState<{ dataUrl: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleScreenshot = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image screenshot.");
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      toast.error("Image is too large. Use a screenshot under 1.5 MB.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!momoReference.trim() && !screenshot) {
      toast.error("Add your MoMo reference or upload a payment screenshot.");
      return;
    }
    setSubmitting(true);
    const result = await submitMomoProof(order.id, {
      provider: momoProvider,
      reference: momoReference.trim() || undefined,
      screenshotDataUrl: screenshot?.dataUrl,
      screenshotName: screenshot?.name
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("MoMo proof sent to seller.");
    setMomoReference("");
    setScreenshot(null);
    setExpanded(false);
  };

  return (
    <div
      id="momo-proof-panel"
      className={cn(
        "shrink-0 border-b bg-mtn/[0.04]",
        highlight && "ring-2 ring-inset ring-mtn/30"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-mtn/5 sm:px-4"
        aria-expanded={expanded}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mtn/15">
          <Smartphone className="h-4 w-4 text-mtn" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {highlight ? "Send MoMo proof now" : "MoMo payment proof"}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {formatGhs(order.amountGhs)} paid • {shop.name} ({shop.phone})
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 border-t border-mtn/10 px-3 pb-3 pt-2.5 sm:px-4 sm:pb-4"
        >
          <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
            Upload your MoMo screenshot or paste the reference so the seller can verify and
            deliver.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {momoProviders.map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={momoProvider === p ? "brand" : "outline"}
                className="h-7 rounded-lg px-2.5 text-[11px]"
                onClick={() => setMomoProvider(p)}
              >
                {p}
              </Button>
            ))}
          </div>

          <Input
            value={momoReference}
            onChange={(e) => setMomoReference(e.target.value)}
            placeholder="MoMo reference from SMS or app"
            className="h-9 rounded-xl text-sm"
          />

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
                className="max-h-28 w-full bg-black/5 object-contain"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2 h-7 w-7 rounded-full"
                onClick={() => setScreenshot(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-2 rounded-xl text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Upload screenshot
            </Button>
          )}

          <Button
            type="submit"
            variant="brand"
            size="sm"
            className="h-9 w-full rounded-xl sm:w-auto"
            disabled={submitting}
          >
            Send proof to seller
          </Button>
        </form>
      )}
    </div>
  );
}
