import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  rating: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
};

export function StarRating({ rating, size = "sm", showValue = true, className }: Props) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const display = rating > 0 ? rating.toFixed(1) : "—";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = rating >= i + 1;
          const half = !filled && rating > i && rating < i + 1;
          return (
            <Star
              key={i}
              className={cn(
                starSize,
                filled || half ? "fill-mtn text-mtn" : "text-muted-foreground/30"
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}>
          {display}
        </span>
      )}
    </div>
  );
}
