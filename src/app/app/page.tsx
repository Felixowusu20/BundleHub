"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/shared/page-loader";
import { useAuthSession } from "@/providers/auth-provider";

export default function AppEntryPage() {
  const router = useRouter();
  const { user, loading } = useAuthSession();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(`/app/${user.role}`);
    } else {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  return <PageLoader label="Loading your workspace…" />;
}
