import { Suspense } from "react";
import { ShopEditView } from "@/features/admin/shop-edit-view";

type Props = {
  params: Promise<{ shopId: string }>;
};

export default async function ShopEditPage({ params }: Props) {
  const { shopId } = await params;
  return (
    <Suspense>
      <ShopEditView shopId={shopId} />
    </Suspense>
  );
}
