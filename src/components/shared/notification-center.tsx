"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { usePlatformStore } from "@/stores/platform-store";
import { useUserNotifications } from "@/hooks/use-platform";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

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
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-telecel text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-medium text-secondary hover:underline"
          >
            Mark all read
          </button>
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex cursor-pointer flex-col items-start gap-1 rounded-xl p-3"
              onClick={() => handleClick(n.id, n.href)}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className={cn("text-sm font-medium", !n.read && "text-foreground")}>
                  {n.title}
                </span>
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-mtn" />}
              </div>
              <span className="text-xs text-muted-foreground">{n.body}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatRelative(n.at)}
                {n.href ? " • Tap to open chat" : ""}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
