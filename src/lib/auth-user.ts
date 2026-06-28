import bcrypt from "bcryptjs";
import type { AdminTier, LoyaltyLevel, UserRole } from "@/generated/prisma/client";
import type { Decimal } from "@/generated/prisma/internal/prismaNamespace";
import type { AuthUser } from "@/types/auth";
import { toAppRole } from "@/lib/auth-session";

/** Fields required to build an AuthUser — allows lean Prisma selects. */
export type DbUserForAuth = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  city: string | null;
  role: UserRole;
  adminTier: AdminTier | null;
  avatarUrl: string | null;
  createdAt: Date;
  walletBalance: Decimal | number | string;
  loyaltyLevel: LoyaltyLevel;
  emailVerifiedAt: Date | null;
  shop?: { id: string } | null;
};

/** Cost 10 balances security with faster sign-in (~50–100 ms vs ~300 ms at 12). */
const BCRYPT_ROUNDS = 10;

/** Used when no user exists so login timing does not reveal valid emails. */
const DUMMY_PASSWORD_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL07lhWy";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function verifyPasswordSafe(
  password: string,
  hash: string | null | undefined
): Promise<boolean> {
  return bcrypt.compare(password, hash ?? DUMMY_PASSWORD_HASH);
}

export function mapDbUser(user: DbUserForAuth): AuthUser {
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
