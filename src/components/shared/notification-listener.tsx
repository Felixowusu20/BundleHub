"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";

/**
 * Shows a toast when a new notification arrives for the logged-in user
 * Live alerts for payment proof and order delivery.
 */
export function NotificationListener() {
  const router = useRouter();
  const user = useCurrentUser();
  const notifications = usePlatformStore((s) => s.notifications);
  const seenRef = useRef<Set<string>>(new Set());
  const readyRef = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      readyRef.current = false;
      seenRef.current = new Set();
      return;
    }

    const mine = notifications.filter((n) => n.forUserId === user.id);

    if (!readyRef.current) {
      mine.forEach((n) => seenRef.current.add(n.id));
      readyRef.current = true;
      return;
    }

    for (const n of mine) {
      if (seenRef.current.has(n.id)) continue;
      seenRef.current.add(n.id);

      const openChat = n.href
        ? {
            label: "Open chat",
            onClick: () => router.push(n.href!)
          }
        : undefined;

      if (n.kind === "order") {
        toast.success(n.title, { description: n.body, action: openChat, duration: 8000 });
      } else if (n.kind === "message") {
        toast.message(n.title, { description: n.body, action: openChat, duration: 6000 });
      } else {
        toast(n.title, { description: n.body, duration: 5000 });
      }
    }
  }, [notifications, user?.id, router]);

  return null;
}
