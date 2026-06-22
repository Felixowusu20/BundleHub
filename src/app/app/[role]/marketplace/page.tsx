import { Suspense } from "react";
import { MarketplaceView } from "@/features/marketplace/marketplace-view";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <MarketplaceView />
    </Suspense>
  );
}
