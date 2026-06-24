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
    <Card
      className={cn(
        "overflow-hidden border-0 shadow-card dark:shadow-card-dark",
        className
      )}
    >
      {/* Compact horizontal layout on mobile */}
      <CardContent className="flex items-center gap-3 p-4 sm:block sm:p-0">
        <div
          className={cn(
            "shrink-0 rounded-2xl bg-gradient-to-br p-2.5 sm:hidden",
            accentClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <CardHeader className="hidden space-y-0 p-0 pb-2 sm:flex sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div className={cn("rounded-2xl bg-gradient-to-br p-2.5", accentClass)}>
              <Icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <p className="truncate text-xs font-medium text-muted-foreground sm:hidden">
            {title}
          </p>
          <div className="text-xl font-bold tracking-tight sm:text-2xl">{value}</div>
          {(hint || trend) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {trend && <span className="font-medium text-emerald-600">{trend} </span>}
              {hint}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
