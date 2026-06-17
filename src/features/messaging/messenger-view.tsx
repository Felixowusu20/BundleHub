"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, ImageIcon, Send, Smartphone } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderTradePanel } from "@/features/messaging/order-trade-panel";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { formatGhs, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MessageAttachment, Role } from "@/types/marketplace";

function MomoReceiptCard({ attachment }: { attachment: Extract<MessageAttachment, { kind: "momo_receipt" }> }) {
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-white/20 bg-black/10 p-3 text-xs">
      <div className="flex items-center gap-2 font-semibold">
        <Smartphone className="h-4 w-4" />
        MoMo payment proof
      </div>
      <p>Provider: {attachment.provider}</p>
      {attachment.reference && (
        <p>
          Reference: <span className="font-mono">{attachment.reference}</span>
        </p>
      )}
      <p>Amount: {formatGhs(attachment.amountGhs)}</p>
      {attachment.screenshotDataUrl && (
        <div className="overflow-hidden rounded-lg border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.screenshotDataUrl}
            alt={attachment.screenshotName ?? "MoMo payment screenshot"}
            className="max-h-56 w-full object-contain bg-black/20"
          />
        </div>
      )}
    </div>
  );
}

export function MessengerView() {
  const params = useParams<{ role: string }>();
  const role = params.role as Role;
  const searchParams = useSearchParams();
  const user = useCurrentUser();

  const initialize = usePlatformStore((s) => s.initialize);
  const allConversations = usePlatformStore((s) => s.conversations);
  const orders = usePlatformStore((s) => s.orders);
  const services = usePlatformStore((s) => s.services);
  const shops = usePlatformStore((s) => s.shops);
  const users = usePlatformStore((s) => s.users);
  const sendMessage = usePlatformStore((s) => s.sendMessage);

  const [activeId, setActiveId] = useState<string | undefined>();
  const [mobileChat, setMobileChat] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    initialize();
  }, [initialize]);

  const conversations = useMemo(() => {
    if (!user) return [];
    let list = allConversations;
    if (role === "customer") {
      list = allConversations.filter((c) => c.customerId === user.id);
    } else if (role === "shop_owner" && user.shopId) {
      list = allConversations.filter((c) => c.shopId === user.shopId);
    }
    return [...list].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }, [allConversations, user, role]);

  useEffect(() => {
    const fromUrl = searchParams.get("c");
    if (fromUrl && conversations.some((c) => c.id === fromUrl)) {
      setActiveId(fromUrl);
      setMobileChat(true);
      return;
    }
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [conversations, activeId, searchParams]);

  const active = conversations.find((c) => c.id === activeId);
  const activeOrder = orders.find((o) => o.id === active?.orderId);
  const activeService = services.find((s) => s.id === activeOrder?.serviceId);
  const customerUser = users.find((u) => u.id === active?.customerId);
  const shop = shops.find((s) => s.id === active?.shopId);

  const displayName =
    role === "customer" ? (shop?.name ?? "Shop") : (customerUser?.name ?? "Customer");

  const messageFrom = role === "customer" ? "customer" : "shop";

  const selectConvo = (id: string) => {
    setActiveId(id);
    setMobileChat(true);
  };

  const handleSend = () => {
    if (!active || !draft.trim()) return;
    sendMessage(active.id, draft, messageFrom);
    setDraft("");
  };

  const getOrderForConvo = (orderId?: string) => {
    if (!orderId) return undefined;
    return orders.find((o) => o.id === orderId);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Order chat</h1>
        <p className="text-sm text-muted-foreground">
          Verify payment, fulfill orders, and get notified at each step
        </p>
      </div>

      <div className="grid h-[min(75dvh,680px)] min-h-[420px] grid-cols-1 overflow-hidden rounded-2xl border bg-card shadow-card dark:shadow-card-dark md:grid-cols-[minmax(0,280px)_1fr] md:rounded-3xl">
        <div
          className={cn(
            "flex min-h-0 flex-col overflow-hidden border-b md:border-b-0 md:border-r",
            mobileChat ? "hidden md:flex" : "flex"
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {conversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {role === "shop_owner"
                  ? "No chats yet. New buyer payments open a conversation here."
                  : "No chats yet. Buy a service and mark as paid to open a conversation."}
              </p>
            ) : (
              conversations.map((c) => {
                const cust = users.find((x) => x.id === c.customerId);
                const sh = shops.find((x) => x.id === c.shopId);
                const last = c.messages[c.messages.length - 1];
                const title = role === "customer" ? sh?.name : cust?.name;
                const order = getOrderForConvo(c.orderId);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectConvo(c.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b p-3 text-left transition-colors hover:bg-muted/50 sm:p-4",
                      activeId === c.id && "bg-mtn/10"
                    )}
                  >
                    <Avatar className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">
                      <AvatarFallback className="text-xs">
                        {(title ?? "?")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="truncate text-sm font-medium">{title}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatRelative(c.lastMessageAt)}
                        </span>
                      </div>
                      {order && (
                        <Badge variant="outline" className="mt-1 text-[9px] capitalize">
                          {order.status}
                        </Badge>
                      )}
                      <p className="mt-1 truncate text-xs text-muted-foreground">{last?.body}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex min-h-0 flex-col overflow-hidden",
            !mobileChat ? "hidden md:flex" : "flex"
          )}
        >
          <div className="flex shrink-0 items-center gap-3 border-b p-3 sm:p-4">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={() => setMobileChat(false)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">
                {displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{displayName}</p>
              {active?.orderId && (
                <p className="truncate text-xs text-muted-foreground">Order {active.orderId}</p>
              )}
            </div>
          </div>

          {activeOrder && activeService && (role === "customer" || role === "shop_owner") && (
            <OrderTradePanel
              order={activeOrder}
              serviceName={activeService.name}
              role={role}
            />
          )}

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
            {!active ? (
              <p className="text-center text-sm text-muted-foreground">
                Select a conversation to open chat
              </p>
            ) : (
              active.messages.map((m) => {
                if (m.from === "system") {
                  return (
                    <div key={m.id} className="flex justify-center px-2">
                      <p className="max-w-[90%] rounded-full bg-muted px-4 py-1.5 text-center text-xs text-muted-foreground">
                        {m.body}
                      </p>
                    </div>
                  );
                }
                const isMine =
                  (role === "customer" && m.from === "customer") ||
                  (role === "shop_owner" && m.from === "shop");
                return (
                  <div
                    key={m.id}
                    className={cn("flex", isMine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm sm:max-w-[75%] sm:px-4 sm:py-2.5",
                        isMine ? "gradient-brand text-white" : "bg-muted"
                      )}
                    >
                      {m.body}
                      {m.attachment?.kind === "momo_receipt" && (
                        <MomoReceiptCard attachment={m.attachment} />
                      )}
                      {m.attachment?.kind === "image" && (
                        <div className="mt-2 flex items-center gap-2 rounded-xl bg-black/10 p-2 text-xs">
                          <ImageIcon className="h-4 w-4" />
                          {m.attachment.name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex shrink-0 gap-2 border-t p-3 sm:p-4">
            <Input
              placeholder="Type a message…"
              className="min-w-0 rounded-2xl"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
              }
              disabled={!active}
            />
            <Button
              variant="brand"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={handleSend}
              disabled={!active || !draft.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
