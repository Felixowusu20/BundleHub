import type { Role } from "@/types/marketplace";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  Headphones,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Shield,
  Store,
  Tag,
  Users,
  Wallet,
  type LucideIcon
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function getNavItems(role: Role): NavItem[] {
  const base = `/app/${role}`;
  switch (role) {
    case "customer":
      return [
        { label: "Dashboard", href: base, icon: LayoutDashboard },
        { label: "Marketplace", href: `${base}/marketplace`, icon: ShoppingBag },
        { label: "Orders", href: `${base}/orders`, icon: Package },
        { label: "Wallet", href: `${base}/wallet`, icon: Wallet },
        { label: "Messages", href: `${base}/messages`, icon: MessageSquare },
        { label: "Settings", href: `${base}/settings`, icon: Settings }
      ];
    case "shop_owner":
      return [
        { label: "Dashboard", href: base, icon: LayoutDashboard },
        { label: "My Shop", href: `${base}/shop`, icon: Store },
        { label: "Orders", href: `${base}/orders`, icon: Package },
        { label: "Services", href: `${base}/services`, icon: Tag },
        { label: "Customers", href: `${base}/customers`, icon: Users },
        { label: "Staff", href: `${base}/staff`, icon: Headphones },
        { label: "Wallet", href: `${base}/wallet`, icon: Wallet },
        { label: "Analytics", href: `${base}/analytics`, icon: BarChart3 },
        { label: "Messages", href: `${base}/messages`, icon: MessageSquare },
        { label: "Settings", href: `${base}/settings`, icon: Settings }
      ];
    case "shop_staff":
      return [
        { label: "Dashboard", href: base, icon: LayoutDashboard },
        { label: "Orders", href: `${base}/orders`, icon: Package },
        { label: "Messages", href: `${base}/messages`, icon: MessageSquare }
      ];
    case "super_admin":
      return [
        { label: "Dashboard", href: base, icon: LayoutDashboard },
        { label: "Shops", href: `${base}/shops`, icon: Store },
        { label: "Team", href: `${base}/admins`, icon: Shield },
        { label: "Customers", href: `${base}/customers`, icon: Users },
        { label: "Orders", href: `${base}/orders`, icon: Package },
        { label: "Services", href: `${base}/services`, icon: Tag },
        { label: "Commissions", href: `${base}/commissions`, icon: CreditCard },
        { label: "Analytics", href: `${base}/analytics`, icon: BarChart3 },
        { label: "Homepage CMS", href: `${base}/homepage`, icon: FileText },
        { label: "Settings", href: `${base}/settings`, icon: Settings }
      ];
  }
}

export const roleLabels: Record<Role, string> = {
  customer: "Customer",
  shop_owner: "Shop Owner",
  shop_staff: "Shop Staff",
  super_admin: "Super Admin"
};
