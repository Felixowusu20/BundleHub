import { cn } from "@/lib/utils";

export function TrustScore({
  score,
  size = "md",
  className
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const color =
    score >= 90 ? "text-emerald-600" : score >= 75 ? "text-mtn" : "text-telecel";
  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base font-semibold"
  };
  return (
    <span className={cn("inline-flex items-center gap-1", sizes[size], className)}>
      <span className={cn("font-bold", color)}>{score}</span>
      <span className="text-muted-foreground">/100</span>
    </span>
  );
}
