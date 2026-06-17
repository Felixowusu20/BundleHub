import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  trend,
  className,
  accent = "mtn"
}: {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  accent?: "mtn" | "telecel" | "brand";
}) {
  const accentClass = {
    mtn: "from-mtn/20 to-mtn/5 text-mtn",
    telecel: "from-telecel/20 to-telecel/5 text-telecel",
    brand: "from-mtn/15 to-telecel/15 text-foreground"
  }[accent];

  return (
    <Card className={cn("overflow-hidden border-0 shadow-card dark:shadow-card-dark", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("rounded-2xl bg-gradient-to-br p-2.5", accentClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(hint || trend) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {trend && <span className="font-medium text-emerald-600">{trend} </span>}
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
