export type AccountRole = "customer" | "shop_owner" | "shop_staff" | "super_admin";

export type LoyaltyLevel = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

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
}

export interface RegisterShopOwnerInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  shopName: string;
  shopDescription?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const SUPER_ADMIN_EMAIL = "admin@bundlehub.gh";
export const SUPER_ADMIN_PASSWORD = "admin123";
