"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import * as React from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/providers/auth-provider";

const queryClient = new QueryClient();

function ResponsiveToaster() {
  const [position, setPosition] = React.useState<"top-right" | "bottom-center">("top-right");

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setPosition(mq.matches ? "bottom-center" : "top-right");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <Toaster
      richColors
      closeButton
      position={position}
      expand
      visibleToasts={3}
      offset={position === "bottom-center" ? 72 : 16}
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border shadow-lg backdrop-blur-sm font-sans",
          title: "font-semibold",
          description: "text-muted-foreground",
          actionButton: "rounded-xl bg-mtn text-charcoal font-medium",
          closeButton: "rounded-full"
        }
      }}
    />
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
        <ResponsiveToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
