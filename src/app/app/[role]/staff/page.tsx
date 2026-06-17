"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlatformStore } from "@/stores/platform-store";
import { Plus } from "lucide-react";

export default function StaffPage() {
  const staffMembers = usePlatformStore((s) => s.staff);
  const shops = usePlatformStore((s) => s.shops);
  const shopMap = new Map(shops.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Staff</h1>
          <p className="text-sm text-muted-foreground">Manage team & assign orders</p>
        </div>
        <Button variant="brand"><Plus className="h-4 w-4" /> Add staff</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {staffMembers.map((s) => (
          <Card key={s.id} className="border-0 shadow-card dark:shadow-card-dark">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {shopMap.get(s.shopId)?.name} • {s.roleTitle}
                  </p>
                </div>
                <Badge className="gradient-mtn text-charcoal">{s.performanceScore}%</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{s.phone}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="outline" size="sm">Assign orders</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
