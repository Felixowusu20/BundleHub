"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/types/marketplace";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  kind: "order" | "message" | "dispute" | "system";
  forUserId?: string;
  href?: string;
};

type AppState = {
  role: Role;
  setRole: (role: Role) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  notifications: NotificationItem[];
  markAllRead: () => void;
  markRead: (id: string) => void;
};

const defaultNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "New order received",
    body: "MTN 10GB Bundle — GHS 48.00 from Ama Mensah",
    at: new Date(Date.now() - 5 * 60_000).toISOString(),
    read: false,
    kind: "order"
  },
  {
    id: "n2",
    title: "Order completed",
    body: "ECG Electricity Token fulfilled successfully",
    at: new Date(Date.now() - 45 * 60_000).toISOString(),
    read: false,
    kind: "order"
  },
  {
    id: "n3",
    title: "New message",
    body: "Kofi Owusu: Please confirm when it's done.",
    at: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    read: true,
    kind: "message"
  },
  {
    id: "n4",
    title: "Dispute opened",
    body: "Order #ord_142 — customer requested review",
    at: new Date(Date.now() - 6 * 60 * 60_000).toISOString(),
    read: false,
    kind: "dispute"
  }
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      role: "customer",
      setRole: (role) => set({ role }),
      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      notificationsOpen: false,
      setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
      notifications: defaultNotifications,
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true }))
        })),
      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
        }))
    }),
    { name: "bundlehub-app", partialize: (s) => ({ role: s.role }) }
  )
);
