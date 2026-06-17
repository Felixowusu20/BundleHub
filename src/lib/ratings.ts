import type { Review, ServiceListing, Shop } from "@/types/marketplace";

function roundRating(n: number) {
  return Math.round(n * 10) / 10;
}

export function averageRating(reviews: Review[]) {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return roundRating(sum / reviews.length);
}

export function applyReviewAverages(
  shops: Shop[],
  services: ServiceListing[],
  reviews: Review[]
) {
  const shopReviews = new Map<string, Review[]>();
  const serviceReviews = new Map<string, Review[]>();

  for (const review of reviews) {
    const shopList = shopReviews.get(review.shopId) ?? [];
    shopList.push(review);
    shopReviews.set(review.shopId, shopList);

    if (review.serviceId) {
      const svcList = serviceReviews.get(review.serviceId) ?? [];
      svcList.push(review);
      serviceReviews.set(review.serviceId, svcList);
    }
  }

  const updatedShops = shops.map((shop) => {
    const list = shopReviews.get(shop.id) ?? [];
    return { ...shop, rating: list.length ? averageRating(list) : shop.rating };
  });

  const updatedServices = services.map((svc) => {
    const list = serviceReviews.get(svc.id) ?? [];
    return { ...svc, rating: list.length ? averageRating(list) : svc.rating };
  });

  return { shops: updatedShops, services: updatedServices };
}
