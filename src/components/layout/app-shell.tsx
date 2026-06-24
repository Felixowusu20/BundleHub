"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NotificationCenter } from "@/components/shared/notification-center";
import { NotificationListener } from "@/components/shared/notification-listener";
import { CommandPalette } from "@/components/shared/command-palette";
import { OrderReviewDialog } from "@/components/shared/order-review-dialog";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileMoreSheet } from "@/components/layout/mobile-more-sheet";
import { useAppStore } from "@/stores/app-store";
import { usePlatformStore } from "@/stores/platform-store";
import { useAuthUser, useCurrentUser } from "@/hooks/use-platform";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAuthSession } from "@/providers/auth-provider";
import {
  getNavItems,
  getMobileTabItems,
  getMoreNavItems,
  getPageTitle,
  isNavActive,
  roleLabels
} from "@/lib/navigation";
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
  const authUser = useAuthUser();
  const { setUser } = useAuthSession();
  const logout = usePlatformStore((s) => s.logout);
  const [moreOpen, setMoreOpen] = useState(false);
  const nav = getNavItems(role);
  const mobileTabs = getMobileTabItems(role);
  const moreItems = getMoreNavItems(role);
  const pageTitle = getPageTitle(pathname, role);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
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
            const active = isNavActive(pathname, item.href);
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

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl pt-safe">
          <div className="flex h-14 items-center gap-2 px-3 md:h-16 md:gap-3 md:px-4">
            {/* Mobile: logo + page title */}
            <div className="flex min-w-0 flex-1 items-center gap-2.5 md:hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl gradient-brand shadow-brand">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold leading-tight">
                  {pageTitle}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {roleLabels[role]}
                </p>
              </div>
            </div>

            {/* Desktop search */}
            <div className="hidden flex-1 items-center gap-2 md:flex">
              <Button
                variant="outline"
                className="h-10 w-full max-w-md justify-start gap-2 rounded-2xl border-dashed text-muted-foreground"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="h-4 w-4" />
                Search…
                <kbd className="ml-auto rounded-md border bg-muted px-1.5 text-[10px]">⌘K</kbd>
              </Button>
            </div>

            <div className="flex items-center gap-0.5 md:gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full md:hidden"
                onClick={() => setCommandOpen(true)}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
              <NotificationCenter />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 rounded-full pl-1 pr-2 md:pr-3">
                    <UserAvatar
                      email={authUser?.email ?? user?.email ?? "user@bundlehub.gh"}
                      name={authUser?.name ?? user?.name}
                      avatarUrl={authUser?.avatarUrl}
                      className="h-8 w-8"
                    />
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
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 py-4 pb-tab-bar md:p-6 md:pb-6">{children}</main>

        <MobileBottomNav
          tabs={mobileTabs}
          moreItems={moreItems}
          pathname={pathname}
          onMoreOpen={() => setMoreOpen(true)}
          moreOpen={moreOpen}
        />

        <MobileMoreSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          items={moreItems}
          pathname={pathname}
          role={role}
          userName={user?.name}
          userEmail={authUser?.email ?? user?.email}
          avatarUrl={authUser?.avatarUrl}
          onLogout={handleLogout}
        />
      </div>

      <CommandPalette />
      <NotificationListener />
      {role === "customer" && <OrderReviewDialog />}
    </div>
  );
}
