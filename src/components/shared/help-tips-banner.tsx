import { Info } from "lucide-react";

type Props = {
  message: string;
  className?: string;
};

export function HelpTipsBanner({ message, className }: Props) {
  return (
    <div
      className={`flex gap-3 rounded-2xl border border-mtn/25 bg-mtn/5 px-4 py-3 text-sm text-muted-foreground ${className ?? ""}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-mtn" />
      <p>{message}</p>
    </div>
  );
}
