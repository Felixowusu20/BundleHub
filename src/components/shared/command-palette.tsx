"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAppStore } from "@/stores/app-store";
import {
  LayoutDashboard,
  Search,
  ShoppingBag,
  Store,
  Users,
  Package
} from "lucide-react";

const pages = [
  { label: "Landing", href: "/landing", icon: LayoutDashboard },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { label: "Customer Dashboard", href: "/app/customer", icon: Users },
  { label: "Shop Owner Dashboard", href: "/app/shop_owner", icon: Store },
  { label: "Super Admin", href: "/app/super_admin", icon: Package }
];

export function CommandPalette() {
  const router = useRouter();
  const open = useAppStore((s) => s.commandOpen);
  const setOpen = useAppStore((s) => s.setCommandOpen);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-xl">
        <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <div className="flex items-center border-b px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder="Search pages, services, shops…"
              className="flex h-14 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded-lg border bg-muted px-2 py-0.5 text-[10px] font-medium sm:inline">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            <Command.Group heading="Navigate">
              {pages.map((p) => (
                <Command.Item
                  key={p.href}
                  value={p.label}
                  onSelect={() => {
                    setOpen(false);
                    router.push(p.href);
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm aria-selected:bg-primary/15 aria-selected:text-foreground"
                >
                  <p.icon className="h-4 w-4 text-mtn" />
                  {p.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
