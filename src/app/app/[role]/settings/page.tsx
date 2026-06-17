"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";

export default function SettingsPage() {
  const user = useCurrentUser();
  const resetDemoData = usePlatformStore((s) => s.resetDemoData);
  const initialize = usePlatformStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleReset = () => {
    if (
      !confirm(
        "Reset all demo data? Your registered accounts will be cleared and seed data restored."
      )
    ) {
      return;
    }
    resetDemoData();
    toast.success("Demo data reset. Sign in with admin@bundlehub.gh / admin123");
    window.location.href = "/auth/login";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Preferences & local data</p>
      </div>

      {user && (
        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="text-muted-foreground capitalize">{user.role.replace("_", " ")}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Dark / light mode</p>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader>
          <CardTitle className="text-base">Local storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Data is stored in this browser only. Reset to clear accounts and reload lean demo
            shops.
          </p>
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleReset}>
            Reset demo data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
