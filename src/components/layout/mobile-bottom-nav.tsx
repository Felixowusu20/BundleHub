"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavActive, type NavItem } from "@/lib/navigation";

type Props = {
  tabs: NavItem[];
  moreItems: NavItem[];
  pathname: string;
  onMoreOpen: () => void;
  moreOpen: boolean;
};

export function MobileBottomNav({
  tabs,
  moreItems,
  pathname,
  onMoreOpen,
  moreOpen
}: Props) {
  const showMore = moreItems.length > 0;
  const moreActive = moreItems.some((item) => isNavActive(pathname, item.href));

  return (
    <nav className="mobile-tab-bar md:hidden">
      <div className="flex items-stretch px-1">
        {tabs.map((item) => {
          const active = isNavActive(pathname, item.href);
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
        {showMore && (
          <button
            type="button"
            onClick={onMoreOpen}
            className={cn(
              "mobile-tab-item",
              moreOpen || moreActive
                ? "mobile-tab-item--active"
                : "mobile-tab-item--inactive"
            )}
          >
            <span className="mobile-tab-icon-wrap">
              <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={moreOpen || moreActive ? 2.5 : 2} />
            </span>
            <span>More</span>
          </button>
        )}
      </div>
    </nav>
  );
}
