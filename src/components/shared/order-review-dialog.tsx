"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { usePlatformStore } from "@/stores/platform-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function OrderReviewDialog() {
  const pendingReviewOrderId = usePlatformStore((s) => s.pendingReviewOrderId);
  const clearPendingReview = usePlatformStore((s) => s.clearPendingReview);
  const submitReview = usePlatformStore((s) => s.submitReview);
  const orders = usePlatformStore((s) => s.orders);
  const services = usePlatformStore((s) => s.services);
  const shops = usePlatformStore((s) => s.shops);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const order = orders.find((o) => o.id === pendingReviewOrderId);
  const service = services.find((s) => s.id === order?.serviceId);
  const shop = shops.find((s) => s.id === order?.shopId);
  const open = !!order && !order.reviewSubmitted;

  const handleClose = () => {
    clearPendingReview();
    setRating(5);
    setTitle("");
    setBody("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingReviewOrderId || rating < 1) return;

    setSubmitting(true);
    const result = await submitReview(pendingReviewOrderId, rating, title.trim(), body.trim());
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Thanks for your feedback!");
    handleClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate your experience</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {service?.name} from {shop?.name} — how did it go?
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center gap-1 py-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              const active = value <= (hover || rating);
              return (
                <button
                  key={value}
                  type="button"
                  className="rounded-full p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHover(value)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(value)}
                >
                  <Star
                    className={cn(
                      "h-9 w-9",
                      active ? "fill-mtn text-mtn" : "text-muted-foreground/30"
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Headline (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quick delivery, great service…"
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Comment (optional)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Tell others about your experience"
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Later
            </Button>
            <Button type="submit" variant="brand" disabled={submitting || rating < 1}>
              Submit rating
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
