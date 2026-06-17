"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePlatformStore } from "@/stores/platform-store";
import { formatGhs } from "@/lib/format";

export default function CustomersPage() {
  const users = usePlatformStore((s) => s.users);
  const customers = users.filter((u) => u.role === "customer");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">
          {customers.length} registered customer{customers.length !== 1 ? "s" : ""} (local accounts)
        </p>
      </div>
      <div className="grid gap-3">
        {customers.length === 0 ? (
          <Card className="border-0 p-8 text-center text-muted-foreground">
            No customers registered yet.
          </Card>
        ) : (
          customers.map((c) => (
            <Card key={c.id} className="border-0 shadow-card dark:shadow-card-dark">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.email} • {c.phone} • {c.city}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{c.loyaltyLevel}</Badge>
                <p className="text-sm font-semibold text-mtn">{formatGhs(c.walletBalanceGhs)}</p>
                <Button variant="outline" size="sm">
                  View history
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
