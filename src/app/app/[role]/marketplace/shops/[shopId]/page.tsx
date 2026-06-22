import { Suspense } from "react";
import { ShopDetailView } from "@/features/marketplace/shop-detail-view";

type Props = {
  params: Promise<{ shopId: string; role: string }>;
};

export default async function Page({ params }: Props) {
  const { shopId, role } = await params;
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ShopDetailView
        shopId={shopId}
        marketplaceHref={`/app/${role}/marketplace`}
      />
    </Suspense>
  );
}
