export type Role = "customer" | "shop_owner" | "shop_staff" | "super_admin";

export type ServiceCategory =
  | "Data Bundles"
  | "Airtime"
  | "Electricity"
  | "Water"
  | "TV Subscription"
  | "WAEC Vouchers"
  | "BECE Vouchers"
  | "Digital Services";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "processing"
  | "completed"
  | "cancelled"
  | "disputed";

export interface OrderDetails {
  phoneNumber?: string;
  meterNumber?: string;
  accountNumber?: string;
  smartCardNumber?: string;
  network?: string;
  packageName?: string;
  quantity?: number;
  amount?: number;
  notes?: string;
}

export interface MomoReceipt {
  provider: string;
  reference?: string;
  screenshotDataUrl?: string;
  screenshotName?: string;
  amountGhs: number;
  paidAt: string;
}

export type MomoReceiptInput = {
  provider: string;
  reference?: string;
  screenshotDataUrl?: string;
  screenshotName?: string;
};

export type VerificationFlag =
  | "identity_verified"
  | "business_verified"
  | "phone_verified"
  | "email_verified";

export type BadgeType =
  | "New Seller"
  | "Verified Seller"
  | "Trusted Seller"
  | "Top Seller"
  | "Elite Seller";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string;
  createdAt: string;
  loyaltyLevel: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
  walletBalanceGhs: number;
}

export interface Shop {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  phone: string;
  city: string;
  description?: string;
  rating: number;
  trustScore: number;
  badges: BadgeType[];
  verification: VerificationFlag[];
  status: "active" | "pending" | "suspended";
  featured: boolean;
  createdAt: string;
}

export type UpdateShopInput = {
  name?: string;
  ownerName?: string;
  phone?: string;
  city?: string;
  description?: string;
  status?: Shop["status"];
  featured?: boolean;
  trustScore?: number;
};

export interface StaffMember {
  id: string;
  shopId: string;
  name: string;
  roleTitle: "Support" | "Fulfillment" | "Manager";
  phone: string;
  performanceScore: number;
}

export interface ServiceListing {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  shopId: string;
  priceGhs: number;
  inStock: boolean;
  rating: number;
  trustScore: number;
  deliverySpeedMins: number;
}

export interface Order {
  id: string;
  customerId: string;
  shopId: string;
  serviceId: string;
  conversationId?: string;
  createdAt: string;
  amountGhs: number;
  platformCommissionGhs: number;
  status: OrderStatus;
  timeline: Array<{ status: OrderStatus; at: string }>;
  details?: OrderDetails;
  momoReceipt?: MomoReceipt;
  reviewSubmitted?: boolean;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "debit" | "credit";
  amountGhs: number;
  label: string;
  orderId?: string;
  at: string;
}

export interface PlaceOrderInput {
  serviceId: string;
  details: OrderDetails;
  momoReceipt: MomoReceiptInput;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  shopId: string;
  serviceId?: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  shopId: string;
  orderId?: string;
  lastMessageAt: string;
  messages: ChatMessage[];
}

export type MessageAttachment =
  | { kind: "image"; name: string; dataUrl?: string }
  | {
      kind: "momo_receipt";
      provider: string;
      reference?: string;
      amountGhs: number;
      paidAt: string;
      screenshotDataUrl?: string;
      screenshotName?: string;
    };

export interface ChatMessage {
  id: string;
  from: "customer" | "shop" | "system";
  body: string;
  at: string;
  read: boolean;
  attachment?: MessageAttachment;
}

export interface AnalyticsPoint {
  month: string; // e.g. "2026-01"
  revenueGhs: number;
  orders: number;
  commissionGhs: number;
  newCustomers: number;
}

