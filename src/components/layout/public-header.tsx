"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HelpCircle,
  Home,
  LogIn,
  Menu,
  Search,
  ShoppingBag,
  Tag,
  UserPlus,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NotificationCenter } from "@/components/shared/notification-center";
import { useAppStore } from "@/stores/app-store";
import { useAuthSession } from "@/providers/auth-provider";
import { useCurrentUser } from "@/hooks/use-platform";
import { cn } from "@/lib/utils";
import { useState } from "react";

const links = [
  { href: "/landing", label: "Home", icon: Home },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/landing#pricing", label: "Pricing", icon: Tag },
  { href: "/help", label: "Help", icon: HelpCircle }
] as const;

export function PublicHeader() {
  const pathname = usePathname();
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);
  const { user: authUser, loading } = useAuthSession();
  const user = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSignedIn = Boolean(authUser);
  const dashboardHref = user ? `/app/${user.role}` : "/auth/login";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl pt-safe">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 md:h-16 md:gap-4 md:px-4">
        <Link href="/landing" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand shadow-brand md:h-9 md:w-9 md:rounded-2xl">
            <Zap className="h-4 w-4 text-white md:h-5 md:w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight md:text-xl">
            Bundle<span className="gradient-brand-text">Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
                pathname === l.href && "bg-primary/15 text-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 md:gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setCommandOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
          {!loading && isSignedIn && <NotificationCenter />}
          <ThemeToggle />
          {!loading && isSignedIn ? (
            <Button variant="brand" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href={dashboardHref}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button variant="brand" size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <Menu />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t px-3 py-2 md:hidden">
          <div className="mobile-list-group">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "mobile-list-row",
                  pathname === l.href && "bg-mtn/10"
                )}
              >
                <span className="mobile-list-icon bg-mtn/15 text-mtn">
                  <l.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="flex-1 text-sm font-medium">{l.label}</span>
              </Link>
            ))}
            {!loading && isSignedIn ? (
              <Link
                href={dashboardHref}
                onClick={() => setMobileOpen(false)}
                className="mobile-list-row"
              >
                <span className="mobile-list-icon gradient-brand text-white">
                  <Zap className="h-[18px] w-[18px]" />
                </span>
                <span className="flex-1 text-sm font-medium text-mtn">Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="mobile-list-row"
                >
                  <span className="mobile-list-icon bg-muted text-muted-foreground">
                    <LogIn className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1 text-sm font-medium">Sign in</span>
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="mobile-list-row"
                >
                  <span className="mobile-list-icon bg-telecel/15 text-telecel">
                    <UserPlus className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1 text-sm font-medium">Register</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
