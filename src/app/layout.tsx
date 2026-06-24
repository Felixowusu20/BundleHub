import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { PlatformInitializer } from "@/providers/platform-initializer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "BundleHub — Multi‑Vendor Digital Services Marketplace",
  description:
    "Ghana's premium marketplace for data bundles, airtime, utilities & digital vouchers.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BundleHub"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFCC00" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans`}>
        <AppProviders>
          <PlatformInitializer />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
