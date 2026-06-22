"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ImageIcon,
  MessageSquare,
  Send,
  Smartphone,
  Square,
  Trash2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { OrderTradePanel } from "@/features/messaging/order-trade-panel";
import { MomoProofPanel } from "@/features/orders/momo-proof-panel";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import { formatGhs, formatRelative, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMessage, MessageAttachment, Role } from "@/types/marketplace";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MomoReceiptCard({
  attachment,
  dark
}: {
  attachment: Extract<MessageAttachment, { kind: "momo_receipt" }>;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-2 space-y-2 rounded-xl border p-3 text-xs",
        dark ? "border-white/20 bg-black/15" : "border-border bg-background/80"
      )}
    >
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
        <div className="overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.screenshotDataUrl}
            alt={attachment.screenshotName ?? "MoMo payment screenshot"}
            className="max-h-56 w-full bg-muted object-contain"
          />
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  isMine,
  selectMode,
  selected,
  onToggleSelect,
  onDeleteOne
}: {
  message: ChatMessage;
  isMine: boolean;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onDeleteOne: () => void;
}) {
  const deletable = message.from !== "system";

  if (message.from === "system") {
    return (
      <div className="flex justify-center px-2 py-1">
        <p className="max-w-[92%] rounded-2xl bg-muted/80 px-4 py-2 text-center text-xs leading-relaxed text-muted-foreground shadow-sm">
          {message.body}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-end gap-2 py-0.5",
        isMine ? "flex-row-reverse" : "flex-row",
        selectMode && selected && "rounded-2xl bg-mtn/5 px-1"
      )}
    >
      {selectMode && deletable && (
        <button
          type="button"
          onClick={onToggleSelect}
          className={cn(
            "mb-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected
              ? "border-mtn bg-mtn text-charcoal"
              : "border-muted-foreground/40 bg-background hover:border-mtn"
          )}
          aria-label={selected ? "Deselect message" : "Select message"}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </button>
      )}

      <div
        className={cn(
          "relative max-w-[82%] sm:max-w-[70%]",
          isMine ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "relative rounded-2xl px-3.5 py-2.5 text-sm shadow-sm transition-shadow",
            isMine
              ? "rounded-br-md gradient-brand text-white"
              : "rounded-bl-md border bg-card text-foreground"
          )}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>

          {message.attachment?.kind === "momo_receipt" && (
            <MomoReceiptCard attachment={message.attachment} dark={isMine} />
          )}
          {message.attachment?.kind === "image" && (
            <div
              className={cn(
                "mt-2 flex items-center gap-2 rounded-xl p-2 text-xs",
                isMine ? "bg-black/15" : "bg-muted"
              )}
            >
              <ImageIcon className="h-4 w-4" />
              {message.attachment.name}
            </div>
          )}

          <div
            className={cn(
              "mt-1.5 flex items-center justify-end gap-1 text-[10px]",
              isMine ? "text-white/75" : "text-muted-foreground"
            )}
          >
            <span>{formatTime(message.at)}</span>
            {isMine &&
              (message.read ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              ))}
          </div>
        </div>

        {!selectMode && deletable && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute -top-1 h-7 w-7 rounded-full opacity-0 shadow-sm transition-opacity group-hover:opacity-100",
              isMine ? "-left-9" : "-right-9",
              "bg-card hover:bg-telecel/10 hover:text-telecel"
            )}
            onClick={onDeleteOne}
            aria-label="Delete message"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
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
  const deleteMessages = usePlatformStore((s) => s.deleteMessages);

  const [activeId, setActiveId] = useState<string | undefined>();
  const [mobileChat, setMobileChat] = useState(false);
  const [draft, setDraft] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [proofHighlight, setProofHighlight] = useState(false);

  const urlConvoId = searchParams.get("c");
  const showProofPanel = searchParams.get("proof") === "1";
  const urlOrderId = searchParams.get("order");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const proofPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showProofPanel) return;
    setProofHighlight(true);
    const timer = window.setTimeout(() => setProofHighlight(false), 5000);
    return () => window.clearTimeout(timer);
  }, [showProofPanel, activeId]);

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
    } else if (role === "shop_staff" && user.employerShopId) {
      list = allConversations.filter((c) => c.shopId === user.employerShopId);
    }
    return [...list].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }, [allConversations, user, role]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  const activeOrder = useMemo(() => {
    const byUrl = urlOrderId ? orders.find((o) => o.id === urlOrderId) : undefined;
    const byConvo = active?.orderId
      ? orders.find((o) => o.id === active.orderId)
      : undefined;
    return byUrl ?? byConvo;
  }, [orders, urlOrderId, active?.orderId]);

  useEffect(() => {
    if (urlConvoId) {
      if (conversations.some((c) => c.id === urlConvoId)) {
        setActiveId(urlConvoId);
        setMobileChat(true);
      }
      return;
    }
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [conversations, urlConvoId, activeId]);

  useEffect(() => {
    if (!showProofPanel || role !== "customer" || !active) return;
    const timer = window.setTimeout(() => {
      proofPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [showProofPanel, role, active]);

  const activeService = services.find((s) => s.id === activeOrder?.serviceId);
  const customerUser = users.find((u) => u.id === active?.customerId);
  const shop = shops.find((s) => s.id === active?.shopId);

  const displayName =
    role === "customer" ? (shop?.name ?? "Shop") : (customerUser?.name ?? "Customer");

  const messageFrom = role === "customer" ? "customer" : "shop";
  const canChat = role === "customer" || role === "shop_owner" || role === "shop_staff";

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end"
    });
  }, []);

  useEffect(() => {
    if (active?.messages.length) {
      scrollToBottom(false);
    }
  }, [active?.id, active?.messages.length, scrollToBottom]);

  useEffect(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, [activeId]);

  const selectConvo = (id: string) => {
    setActiveId(id);
    setMobileChat(true);
  };

  const handleSend = async () => {
    if (!active || !draft.trim() || !canChat) return;
    const text = draft;
    setDraft("");
    await sendMessage(active.id, text, messageFrom);
    setTimeout(() => scrollToBottom(), 50);
  };

  const getOrderForConvo = (orderId?: string) => {
    if (!orderId) return undefined;
    return orders.find((o) => o.id === orderId);
  };

  const deletableMessages = useMemo(
    () => active?.messages.filter((m) => m.from !== "system") ?? [],
    [active?.messages]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllDeletable = () => {
    setSelectedIds(new Set(deletableMessages.map((m) => m.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const requestDelete = (ids: string[]) => {
    if (!ids.length) return;
    setPendingDeleteIds(ids);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMessages = () => {
    if (!active || !pendingDeleteIds.length) return;
    setDeleting(true);
    const result = deleteMessages(active.id, pendingDeleteIds);
    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      result.deleted === 1
        ? "Message deleted"
        : `${result.deleted} messages deleted`
    );
    setDeleteDialogOpen(false);
    setPendingDeleteIds([]);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const deleteDialogCount = pendingDeleteIds.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Chat with shops, share MoMo proof, and manage order threads
          </p>
        </div>
        {conversations.length > 0 && (
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="grid h-[min(82dvh,780px)] min-h-[480px] grid-cols-1 overflow-hidden rounded-2xl border bg-card shadow-card dark:shadow-card-dark md:grid-cols-[minmax(0,280px)_1fr] md:rounded-3xl">
        {/* Conversation list */}
        <div
          className={cn(
            "flex min-h-0 flex-col overflow-hidden border-b bg-muted/20 md:border-b-0 md:border-r",
            mobileChat ? "hidden md:flex" : "flex"
          )}
        >
          <div className="shrink-0 border-b px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Inbox
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mtn/10">
                  <MessageSquare className="h-7 w-7 text-mtn" />
                </div>
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs text-muted-foreground">
                  {role === "customer"
                    ? "Place an order to open a chat with the seller."
                    : "New buyer orders will appear here automatically."}
                </p>
              </div>
            ) : (
              conversations.map((c) => {
                const cust = users.find((x) => x.id === c.customerId);
                const sh = shops.find((x) => x.id === c.shopId);
                const last = c.messages[c.messages.length - 1];
                const title = role === "customer" ? sh?.name : cust?.name;
                const order = getOrderForConvo(c.orderId);
                const unread = c.messages.some(
                  (m) => !m.read && m.from !== messageFrom && m.from !== "system"
                );

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectConvo(c.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b p-4 text-left transition-colors hover:bg-muted/60",
                      activeId === c.id && "bg-mtn/10 ring-1 ring-inset ring-mtn/20"
                    )}
                  >
                    <Avatar className="h-11 w-11 shrink-0 ring-2 ring-background">
                      <AvatarFallback className="bg-mtn/15 text-xs font-semibold text-mtn">
                        {initials(title ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{title}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatRelative(c.lastMessageAt)}
                        </span>
                      </div>
                      {order && (
                        <Badge variant="outline" className="mt-1.5 text-[9px] capitalize">
                          {order.status}
                        </Badge>
                      )}
                      <p
                        className={cn(
                          "mt-1.5 line-clamp-2 text-xs",
                          unread ? "font-medium text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {last?.body ?? "No messages"}
                      </p>
                    </div>
                    {unread && (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-mtn" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div
          className={cn(
            "flex min-h-0 flex-col overflow-hidden bg-gradient-to-b from-muted/10 to-background",
            !mobileChat ? "hidden md:flex" : "flex"
          )}
        >
          <div className="flex shrink-0 items-center gap-2 border-b bg-card/80 px-3 py-3 backdrop-blur-sm sm:px-4">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={() => setMobileChat(false)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-mtn/15 text-xs font-semibold text-mtn">
                {initials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{displayName}</p>
              {active?.orderId && (
                <p className="truncate text-xs text-muted-foreground">Order {active.orderId}</p>
              )}
            </div>

            {active && deletableMessages.length > 0 && (
              <div className="flex shrink-0 gap-1">
                {selectMode ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden text-xs sm:inline-flex"
                      onClick={selectAllDeletable}
                    >
                      Select all
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={clearSelection}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-xl bg-telecel hover:bg-telecel/90"
                      disabled={selectedIds.size === 0}
                      onClick={() => requestDelete([...selectedIds])}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      {selectedIds.size || ""}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => setSelectMode(true)}
                  >
                    <Square className="mr-1 h-3.5 w-3.5" />
                    Select
                  </Button>
                )}
              </div>
            )}
          </div>

          {activeOrder && activeService && (role === "customer" || role === "shop_owner") && (
            <OrderTradePanel
              order={activeOrder}
              serviceName={activeService.name}
              role={role}
              defaultExpanded={["pending", "accepted", "processing"].includes(activeOrder.status)}
            />
          )}

          {role === "customer" &&
            activeOrder &&
            shop &&
            !activeOrder.momoReceipt &&
            ["pending", "accepted"].includes(activeOrder.status) && (
              <div ref={proofPanelRef}>
                <MomoProofPanel
                  order={activeOrder}
                  shop={shop}
                  highlight={proofHighlight}
                  defaultExpanded={showProofPanel || proofHighlight}
                />
              </div>
            )}

          <div
            ref={scrollContainerRef}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4"
          >
            {!active ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Select a conversation to start</p>
              </div>
            ) : active.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm text-muted-foreground">No messages yet — say hello!</p>
              </div>
            ) : (
              active.messages.map((m) => {
                const isMine =
                  (role === "customer" && m.from === "customer") ||
                  ((role === "shop_owner" || role === "shop_staff") && m.from === "shop");

                return (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isMine={isMine}
                    selectMode={selectMode}
                    selected={selectedIds.has(m.id)}
                    onToggleSelect={() => toggleSelect(m.id)}
                    onDeleteOne={() => requestDelete([m.id])}
                  />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {selectMode && selectedIds.size > 0 && (
            <div className="shrink-0 border-t bg-muted/40 px-4 py-2 text-center text-xs text-muted-foreground">
              {selectedIds.size} message{selectedIds.size !== 1 ? "s" : ""} selected
            </div>
          )}

          <div className="shrink-0 border-t bg-card/95 p-2.5 backdrop-blur-sm sm:p-3">
            <div className="flex items-end gap-2">
              <div className="relative min-w-0 flex-1">
                <Input
                  placeholder={canChat ? "Write a message…" : "View only"}
                  className="min-h-10 rounded-2xl border-muted-foreground/20 bg-muted/30 text-sm"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
                  }
                  disabled={!active || !canChat || selectMode}
                />
              </div>
              <Button
                variant="brand"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-2xl shadow-brand"
                onClick={handleSend}
                disabled={!active || !draft.trim() || !canChat || selectMode}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setPendingDeleteIds([]);
        }}
        title={deleteDialogCount === 1 ? "Delete message?" : `Delete ${deleteDialogCount} messages?`}
        description="Removed messages disappear from this conversation for both parties."
        itemLabel={deleteDialogCount === 1 ? "Message" : "Selection"}
        itemDetail={
          deleteDialogCount === 1
            ? "This chat message will be permanently removed."
            : `${deleteDialogCount} messages will be permanently removed.`
        }
        warning="System order updates cannot be deleted. MoMo proof and payment messages you delete cannot be recovered."
        confirmLabel={deleteDialogCount === 1 ? "Delete message" : "Delete selected"}
        loading={deleting}
        onConfirm={confirmDeleteMessages}
      />
    </div>
  );
}
