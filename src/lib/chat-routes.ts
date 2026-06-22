/** Customer chat URL after wallet payment — opens thread + MoMo proof panel */
export function customerProofChatUrl(conversationId: string, orderId?: string) {
  const params = new URLSearchParams({ c: conversationId, proof: "1" });
  if (orderId) params.set("order", orderId);
  return `/app/customer/messages?${params.toString()}`;
}

/** Shop owner chat URL when a new paid order arrives */
export function shopOrderChatUrl(conversationId: string) {
  return `/app/shop_owner/messages?c=${conversationId}`;
}
