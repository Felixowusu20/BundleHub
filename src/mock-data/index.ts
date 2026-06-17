/**
 * @deprecated Import from usePlatformStore instead.
 * Kept for backwards compatibility — uses light seed only.
 */
import { generateMockData, LIGHT_SEED } from "@/mock-data/generator";

export const mockDb = generateMockData(20260617, LIGHT_SEED);

export const shops = mockDb.shops;
export const services = mockDb.services;
export const orders = mockDb.orders;
export const reviews = mockDb.reviews;
export const conversations = mockDb.conversations;
export const staffMembers = mockDb.staff;
export const analytics = mockDb.analytics;
export const customers = mockDb.customers;
