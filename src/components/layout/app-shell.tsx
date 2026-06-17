"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, LogOut, Menu, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NotificationCenter } from "@/components/shared/notification-center";
import { NotificationListener } from "@/components/shared/notification-listener";
import { CommandPalette } from "@/components/shared/command-palette";
import { OrderReviewDialog } from "@/components/shared/order-review-dialog";
import { useAppStore } from "@/stores/app-store";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { getNavItems, roleLabels } from "@/lib/navigation";
import type { Role } from "@/types/marketplace";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppShell({
  role,
  children
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);
  const user = useCurrentUser();
  const logout = usePlatformStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nav = getNavItems(role);

  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "BH";

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/50 md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl gradient-brand shadow-brand">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-display text-sm font-bold leading-none">BundleHub</p>
            <p className="text-[10px] text-muted-foreground">{roleLabels[role]}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "gradient-mtn text-charcoal shadow-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-card shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <span className="font-display font-bold">BundleHub</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <ChevronLeft />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <item.icon className="h-4 w-4 text-mtn" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu />
          </Button>
          <div className="flex flex-1 items-center gap-2">
            <Button
              variant="outline"
              className="hidden h-10 w-full max-w-md justify-start gap-2 rounded-2xl border-dashed text-muted-foreground sm:flex"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="h-4 w-4" />
              Search…
              <kbd className="ml-auto rounded-md border bg-muted px-1.5 text-[10px]">⌘K</kbd>
            </Button>
          </div>
          <NotificationCenter />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 rounded-full pl-1 pr-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
                  {user?.name ?? "User"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/app/${role}/settings`}>Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t bg-card/95 px-2 py-2 backdrop-blur-xl md:hidden">
          {nav.slice(0, 4).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium",
                  active ? "text-mtn" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
        <div className="h-16 md:hidden" />
      </div>
      <CommandPalette />
      <NotificationListener />
      {role === "customer" && <OrderReviewDialog />}
    </div>
  );
}
