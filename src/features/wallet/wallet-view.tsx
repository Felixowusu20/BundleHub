"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { formatGhs, formatRelative } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

export function WalletView() {
  const params = useParams<{ role: string }>();
  const role = params.role === "shop_owner" ? "shop_owner" : "customer";
  const user = useCurrentUser();
  const topUpWallet = usePlatformStore((s) => s.topUpWallet);
  const allTransactions = usePlatformStore((s) => s.walletTransactions);
  const orders = usePlatformStore((s) => s.orders);

  const transactions = useMemo(
    () => (user ? allTransactions.filter((t) => t.userId === user.id) : []),
    [allTransactions, user]
  );

  const pending = useMemo(() => {
    if (!user || role !== "shop_owner" || !user.shopId) return 0;
    return orders
      .filter(
        (o) =>
          o.shopId === user.shopId &&
          (o.status === "pending" || o.status === "accepted" || o.status === "processing")
      )
      .reduce((sum, o) => sum + (o.amountGhs - o.platformCommissionGhs), 0);
  }, [orders, user, role]);

  if (!user) return null;

  const balance = user.walletBalanceGhs;

  const handleTopUp = () => {
    topUpWallet(user.id, 100);
    toast.success("GHS 100 added to your wallet (mock)");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Wallet</h1>
        <p className="text-sm text-muted-foreground">
          {user.name} • Mock payments — no real gateway
        </p>
      </div>

      <Card className="overflow-hidden border-0 shadow-brand">
        <div className="gradient-brand p-8 text-white">
          <div className="flex items-center gap-2 text-white/80">
            <Wallet className="h-5 w-5" />
            Available balance
          </div>
          <p className="mt-2 font-display text-4xl font-bold">{formatGhs(balance)}</p>
          {pending > 0 && (
            <p className="mt-2 text-sm text-white/80">
              Pending from active orders: {formatGhs(pending)}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" size="sm" disabled>
              Withdraw
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={handleTopUp}
            >
              Top up GHS 100
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No transactions yet. Place an order or top up your wallet.
            </p>
          ) : (
            transactions.slice(0, 20).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-2xl bg-muted/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${
                      t.type === "credit" ? "bg-emerald-500/15" : "bg-telecel/15"
                    }`}
                  >
                    {t.type === "credit" ? (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-telecel" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(t.at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      t.type === "credit" ? "text-emerald-600" : "text-foreground"
                    }`}
                  >
                    {t.type === "credit" ? "+" : "-"}
                    {formatGhs(t.amountGhs)}
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {t.type}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
