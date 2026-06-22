import Link from "next/link";
import { Zap } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold">BundleHub</span>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ghana&apos;s premium multi-vendor marketplace for data bundles, airtime,
            utilities, TV, and digital vouchers — powered by trusted agents.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/marketplace" className="hover:text-foreground">Marketplace</Link></li>
            <li><Link href="/app" className="hover:text-foreground">Dashboard</Link></li>
            <li><Link href="/landing#pricing" className="hover:text-foreground">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/help" className="hover:text-foreground">Help centre</Link></li>
            <li><Link href="/auth/register" className="hover:text-foreground">Become a seller</Link></li>
            <li><Link href="/auth/login" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BundleHub. All rights reserved.
      </div>
    </footer>
  );
}
