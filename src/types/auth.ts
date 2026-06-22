export type AccountRole = "customer" | "shop_owner" | "shop_staff" | "super_admin";

export type DbUserRole =
  | "CUSTOMER"
  | "SHOP_OWNER"
  | "SHOP_STAFF"
  | "SUPER_ADMIN"
  | "SUB_ADMIN";

export type AdminTier = "PRIMARY" | "SUB";

export type LoyaltyLevel = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

/** Authenticated user from Neon (API session) */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  city: string;
  role: AccountRole;
  dbRole: DbUserRole;
  adminTier: AdminTier | null;
  avatarUrl: string | null;
  createdAt: string;
  walletBalanceGhs: number;
  loyaltyLevel: LoyaltyLevel;
  shopId?: string;
  isPrimaryAdmin: boolean;
  emailVerified: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  city: string;
  role: AccountRole;
  createdAt: string;
  walletBalanceGhs: number;
  loyaltyLevel: LoyaltyLevel;
  shopId?: string;
  employerShopId?: string;
}

export interface AuthSession {
  userId: string;
  role: AccountRole;
}

export interface RegisterCustomerInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  avatarUrl?: string;
}

export interface RegisterShopOwnerInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  shopName: string;
  shopDescription?: string;
  avatarUrl?: string;
}

export interface BootstrapAdminInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
}

export interface CreateSubAdminInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
