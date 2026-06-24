"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LogOut, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import { isNavActive, roleLabels, type NavItem } from "@/lib/navigation";
import type { Role } from "@/types/marketplace";

type Props = {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  pathname: string;
  role: Role;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string | null;
  onLogout: () => void;
};

export function MobileMoreSheet({
  open,
  onClose,
  items,
  pathname,
  role,
  userName,
  userEmail,
  avatarUrl,
  onLogout
}: Props) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-hidden rounded-t-3xl bg-card shadow-2xl md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  email={userEmail ?? "user@bundlehub.gh"}
                  name={userName}
                  avatarUrl={avatarUrl}
                  className="h-11 w-11"
                />
                <div>
                  <p className="font-display text-sm font-bold">{userName ?? "User"}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-y-auto p-4">
              <div className="mobile-list-group">
                {items.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "mobile-list-row",
                        active && "bg-mtn/10"
                      )}
                    >
                      <span className="mobile-list-icon bg-mtn/15 text-mtn">
                        <item.icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {active && (
                        <span className="h-2 w-2 rounded-full bg-mtn" />
                      )}
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="mobile-list-group mt-4 w-full"
              >
                <span className="mobile-list-row text-destructive">
                  <span className="mobile-list-icon bg-destructive/10 text-destructive">
                    <LogOut className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1 text-sm font-medium">Sign out</span>
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}