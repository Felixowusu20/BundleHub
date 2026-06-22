"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/use-platform";

type OwnerShop = {
  id: string;
  name: string;
  description: string | null;
  phone: string;
  city: string;
  status: "pending" | "active" | "suspended";
};

export function useOwnerShop() {
  const authUser = useAuthUser();
  const [shop, setShop] = useState<OwnerShop | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authUser?.shopId) {
      setShop(null);
      return;
    }

    setLoading(true);
    fetch("/api/shops/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { shop?: OwnerShop } | null) => setShop(d?.shop ?? null))
      .finally(() => setLoading(false));
  }, [authUser?.shopId]);

  return { shop, loading };
}
