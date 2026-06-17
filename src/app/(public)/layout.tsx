import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { CommandPalette } from "@/components/shared/command-palette";

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <div className="flex-1">{children}</div>
      <PublicFooter />
      <CommandPalette />
    </div>
  );
}
