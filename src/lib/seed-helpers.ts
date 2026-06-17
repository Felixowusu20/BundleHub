/** IDs from the numeric seed generator (shop_1, svc_12, ord_3) */
export function isNumericSeedId(id: string, prefix: string) {
  return new RegExp(`^${prefix}_\\d+$`).test(id);
}

export function partitionUserRecords<T extends { id: string }>(
  items: T[],
  prefix: string
) {
  const seed: T[] = [];
  const user: T[] = [];
  for (const item of items) {
    if (isNumericSeedId(item.id, prefix)) seed.push(item);
    else user.push(item);
  }
  return { seed, user };
}
