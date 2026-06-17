"use client";

import { useParams } from "next/navigation";
import { CustomerDashboard } from "@/features/dashboard/customer-dashboard";
import { ShopOwnerDashboard } from "@/features/dashboard/shop-owner-dashboard";
import { ShopStaffDashboard } from "@/features/dashboard/shop-staff-dashboard";
import { AdminDashboard } from "@/features/dashboard/admin-dashboard";
import type { Role } from "@/types/marketplace";

export default function RoleDashboardPage() {
  const params = useParams<{ role: string }>();
  const role = params.role as Role;

  switch (role) {
    case "customer":
      return <CustomerDashboard />;
    case "shop_owner":
      return <ShopOwnerDashboard />;
    case "shop_staff":
      return <ShopStaffDashboard />;
    case "super_admin":
      return <AdminDashboard />;
    default:
      return null;
  }
}
