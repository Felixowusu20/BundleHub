"use client";

import { UserAvatar } from "@/components/shared/user-avatar";
import type { AuthUser } from "@/types/auth";

type Props = {
  user: AuthUser;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
  variant?: "brand" | "dark";
};

export function DashboardWelcome({
  user,
  subtitle,
  badge,
  children,
  variant = "brand"
}: Props) {
  const shell =
    variant === "brand"
      ? "gradient-brand text-white"
      : "bg-charcoal text-white dark:bg-card";

  return (
    <div className={`flex flex-wrap items-center gap-4 rounded-3xl p-6 md:p-8 ${shell}`}>
      <UserAvatar
        email={user.email}
        name={user.name}
        avatarUrl={user.avatarUrl}
        className="h-14 w-14 border-2 border-white/30 text-lg"
        fallbackClassName="bg-white/20 text-white"
      />
      <div className="min-w-0 flex-1">
        {badge && <p className="text-sm text-white/60">{badge}</p>}
        <p className="text-sm text-white/80">Welcome back,</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">{user.name}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/75">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
