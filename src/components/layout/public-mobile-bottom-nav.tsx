"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Home, LayoutDashboard, ShoppingBag, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const publicTabs = [
  { href: "/landing", label: "Home", icon: Home },
  { href: "/marketplace", label: "Shop", icon: ShoppingBag },
  { href: "/help", label: "Help", icon: HelpCircle }
] as const;

type Props = {
  isSignedIn: boolean;
  dashboardHref: string;
};

export function PublicMobileBottomNav({ isSignedIn, dashboardHref }: Props) {
  const pathname = usePathname();

  return (
    <nav className="mobile-tab-bar md:hidden">
      <div className="flex items-stretch px-1">
        {publicTabs.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/landing" && pathname === "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mobile-tab-item",
                active ? "mobile-tab-item--active" : "mobile-tab-item--inactive"
              )}
            >
              <span className="mobile-tab-icon-wrap">
                <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        {isSignedIn ? (
          <Link
            href={dashboardHref}
            className={cn(
              "mobile-tab-item",
              pathname.startsWith("/app")
                ? "mobile-tab-item--active"
                : "mobile-tab-item--inactive"
            )}
          >
            <span className="mobile-tab-icon-wrap">
              <LayoutDashboard className="h-[18px] w-[18px]" />
            </span>
            <span>App</span>
          </Link>
        ) : (
          <Link
            href="/auth/register"
            className={cn(
              "mobile-tab-item",
              pathname.startsWith("/auth")
                ? "mobile-tab-item--active"
                : "mobile-tab-item--inactive"
            )}
          >
            <span className="mobile-tab-icon-wrap">
              <UserPlus className="h-[18px] w-[18px]" />
            </span>
            <span>Join</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
