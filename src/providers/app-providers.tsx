"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import * as React from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/providers/auth-provider";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          richColors
          closeButton
          position="top-right"
          expand
          visibleToasts={4}
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
      </QueryClientProvider>
    </ThemeProvider>
  );
}

