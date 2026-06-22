import bcrypt from "bcryptjs";
import type { User } from "@/generated/prisma/client";
import type { AuthUser } from "@/types/auth";
import { toAppRole } from "@/lib/auth";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function mapDbUser(user: User & { shop?: { id: string } | null }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? "",
    city: user.city ?? "",
    role: toAppRole(user.role),
    dbRole: user.role,
    adminTier: user.adminTier,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    walletBalanceGhs: Number(user.walletBalance),
    loyaltyLevel: user.loyaltyLevel,
    shopId: user.shop?.id,
    isPrimaryAdmin: user.role === "SUPER_ADMIN" && user.adminTier === "PRIMARY",
    emailVerified: user.emailVerifiedAt != null
  };
}
