"use client";

import { TrendChart } from "@/components/shared/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlatformStore } from "@/stores/platform-store";
import { formatGhs } from "@/lib/format";

export default function AnalyticsPage() {
  const analytics = usePlatformStore((s) => s.analytics);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Revenue, orders & growth insights</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart
          title="Revenue"
          data={analytics.map((a) => ({ label: a.month.slice(5), value: a.revenueGhs }))}
          color="mtn"
          valuePrefix="GHS "
        />
        <TrendChart
          title="Orders"
          data={analytics.map((a) => ({ label: a.month.slice(5), value: a.orders }))}
          color="telecel"
        />
      </div>
      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader>
          <CardTitle className="text-base">Commission breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl bg-muted/50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Example order</p>
                <p className="text-2xl font-bold">{formatGhs(100)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-telecel">Platform (3%)</p>
                <p className="text-xl font-bold text-telecel">{formatGhs(3)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-mtn">Shop receives</p>
                <p className="text-xl font-bold text-mtn">{formatGhs(97)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
