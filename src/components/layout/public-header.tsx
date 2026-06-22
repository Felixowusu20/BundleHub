"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NotificationCenter } from "@/components/shared/notification-center";
import { useAppStore } from "@/stores/app-store";
import { useAuthSession } from "@/providers/auth-provider";
import { useCurrentUser } from "@/hooks/use-platform";
import { cn } from "@/lib/utils";
import { useState } from "react";

const links = [
  { href: "/landing", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/landing#pricing", label: "Pricing" }
];

export function PublicHeader() {
  const pathname = usePathname();
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);
  const { user: authUser, loading } = useAuthSession();
  const user = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSignedIn = Boolean(authUser);
  const dashboardHref = user ? `/app/${user.role}` : "/auth/login";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/landing" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl gradient-brand shadow-brand">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
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

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setCommandOpen(true)}
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
          >
            <Menu />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
          {!loading && isSignedIn ? (
            <Link
              href={dashboardHref}
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-mtn"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-secondary"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
