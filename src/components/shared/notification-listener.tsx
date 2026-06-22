"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  MessageSquare,
  Package
} from "lucide-react";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import type { NotificationItem } from "@/stores/app-store";

function toastForNotification(
  n: NotificationItem,
  openHref: () => void
) {
  const action = n.href
    ? {
        label: n.kind === "message" ? "Open chat" : "View",
        onClick: openHref
      }
    : undefined;

  const icon =
    n.kind === "order" ? (
      <Package className="h-4 w-4 text-mtn" />
    ) : n.kind === "message" ? (
      <MessageSquare className="h-4 w-4 text-secondary" />
    ) : n.kind === "dispute" ? (
      <AlertTriangle className="h-4 w-4 text-telecel" />
    ) : undefined;

  const className =
    n.kind === "order"
      ? "!border-mtn/30 !bg-mtn/5"
      : n.kind === "message"
        ? "!border-secondary/30 !bg-secondary/5"
        : n.kind === "dispute"
          ? "!border-telecel/30 !bg-telecel/5"
          : undefined;

  if (n.kind === "order") {
    toast.success(n.title, {
      description: n.body,
      action,
      duration: 8000,
      icon,
      className
    });
    return;
  }

  if (n.kind === "message") {
    toast.message(n.title, {
      description: n.body,
      action,
      duration: 6500,
      icon,
      className
    });
    return;
  }

  if (n.kind === "dispute") {
    toast.error(n.title, {
      description: n.body,
      action,
      duration: 9000,
      icon,
      className
    });
    return;
  }

  toast(n.title, { description: n.body, duration: 5000, icon, className });
}

/**
 * Shows a styled toast when a new notification arrives for the logged-in user.
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

      toastForNotification(n, () => {
        if (n.href) router.push(n.href);
      });
    }
  }, [notifications, user?.id, router]);

  return null;
}
