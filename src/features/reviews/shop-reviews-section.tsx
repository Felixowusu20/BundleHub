"use client";

import { StarRating } from "@/components/shared/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelative } from "@/lib/format";
import type { Review } from "@/types/marketplace";
import type { UserAccount } from "@/types/auth";

type Props = {
  reviews: Review[];
  users: UserAccount[];
  shopId: string;
  limit?: number;
};

export function ShopReviewsSection({ reviews, users, shopId, limit = 6 }: Props) {
  const shopReviews = reviews
    .filter((r) => r.shopId === shopId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  if (!shopReviews.length) {
    return (
      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No reviews yet — be the first to buy and rate this shop.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Customer reviews</h2>
      {shopReviews.map((r) => {
        const author = users.find((u) => u.id === r.customerId);
        return (
          <Card key={r.id} className="border-0 shadow-card dark:shadow-card-dark">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium">
                  {author?.name ?? "Customer"}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {formatRelative(r.createdAt)}
                </span>
              </div>
              <StarRating rating={r.rating} size="sm" />
            </CardHeader>
            <CardContent className="pt-0">
              {r.title && <p className="text-sm font-medium">{r.title}</p>}
              <p className="text-sm text-muted-foreground">{r.body}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
