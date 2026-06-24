"use client";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicMobileBottomNav } from "@/components/layout/public-mobile-bottom-nav";
import { CommandPalette } from "@/components/shared/command-palette";
import { useAuthSession } from "@/providers/auth-provider";
import { useCurrentUser } from "@/hooks/use-platform";

function PublicLayoutClient({ children }: { children: React.ReactNode }) {
  const { user: authUser, loading } = useAuthSession();
  const user = useCurrentUser();
  const isSignedIn = Boolean(authUser);
  const dashboardHref = user ? `/app/${user.role}` : "/auth/login";

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <div className="flex-1 pb-tab-bar md:pb-0">{children}</div>
      <div className="hidden md:block">
        <PublicFooter />
      </div>
      {!loading && (
        <PublicMobileBottomNav isSignedIn={isSignedIn} dashboardHref={dashboardHref} />
      )}
      <CommandPalette />
    </div>
  );
}

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <PublicLayoutClient>{children}</PublicLayoutClient>;
}
