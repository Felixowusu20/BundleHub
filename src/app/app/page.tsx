"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppEntryPage() {
  const router = useRouter();
  const initialize = usePlatformStore((s) => s.initialize);
  const session = usePlatformStore((s) => s.session);
  const user = useCurrentUser();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize();
    setReady(true);
  }, [initialize]);

  useEffect(() => {
    if (!ready) return;
    if (session && user) {
      router.replace(`/app/${user.role}`);
    } else {
      router.replace("/auth/login");
    }
  }, [ready, session, user, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Skeleton className="h-32 w-64" />
    </div>
  );
}
