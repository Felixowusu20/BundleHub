import { RoleLayoutClient } from "@/app/app/[role]/role-layout-client";

export default async function RoleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  return <RoleLayoutClient role={role}>{children}</RoleLayoutClient>;
}
