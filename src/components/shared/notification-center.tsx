"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  MessageSquare,
  Package,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { usePlatformStore } from "@/stores/platform-store";
import { useUserNotifications } from "@/hooks/use-platform";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/stores/app-store";

function NotificationIcon({ kind }: { kind: NotificationItem["kind"] }) {
  const className = "h-4 w-4 shrink-0";
  switch (kind) {
    case "order":
      return <Package className={cn(className, "text-mtn")} />;
    case "message":
      return <MessageSquare className={cn(className, "text-secondary")} />;
    case "dispute":
      return <AlertTriangle className={cn(className, "text-telecel")} />;
    default:
      return <Sparkles className={cn(className, "text-muted-foreground")} />;
  }
}

function notificationAccent(kind: NotificationItem["kind"]) {
  switch (kind) {
    case "order":
      return "border-l-mtn bg-mtn/5";
    case "message":
      return "border-l-secondary bg-secondary/5";
    case "dispute":
      return "border-l-telecel bg-telecel/5";
    default:
      return "border-l-muted-foreground/30 bg-muted/30";
  }
}

export function NotificationCenter() {
  const router = useRouter();
  const userId = usePlatformStore((s) => s.session?.userId);
  const notifications = useUserNotifications();

  const markAllRead = () => {
    if (!userId) return;
    usePlatformStore.setState((state) => ({
      notifications: state.notifications.map((n) =>
        n.forUserId === userId ? { ...n, read: true } : n
      )
    }));
  };

  const handleClick = (id: string, href?: string) => {
    if (!userId) return;
    usePlatformStore.setState((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id && n.forUserId === userId ? { ...n, read: true } : n
      )
    }));
    if (href) router.push(href);
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-telecel px-1 text-[10px] font-bold text-white shadow-md">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(92vw,360px)] overflow-hidden rounded-2xl p-0 shadow-xl"
      >
        <div className="gradient-brand px-4 py-3 text-white">
          <div className="flex items-center justify-between gap-2">
            <DropdownMenuLabel className="p-0 text-base font-semibold text-white">
              Notifications
            </DropdownMenuLabel>
            {unread > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">
                {unread} new
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="mt-1 flex items-center gap-1 text-xs text-white/90 hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">You&apos;re all caught up</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n.id, n.href)}
                className={cn(
                  "mb-2 flex w-full cursor-pointer flex-col gap-1 rounded-xl border-l-4 p-3 text-left transition-all hover:shadow-sm",
                  notificationAccent(n.kind),
                  !n.read && "ring-1 ring-mtn/15"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background/80 shadow-sm">
                    <NotificationIcon kind={n.kind} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "text-sm leading-snug",
                          !n.read ? "font-semibold" : "font-medium text-muted-foreground"
                        )}
                      >
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-mtn" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      {formatRelative(n.at)}
                      {n.href ? " • Tap to open" : ""}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
