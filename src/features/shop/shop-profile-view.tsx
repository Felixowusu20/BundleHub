"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, MapPin, Phone, Save, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import { StarRating } from "@/components/shared/star-rating";
import { TrustScore } from "@/components/shared/trust-score";
import { usePageAction } from "@/hooks/use-page-action";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser, useUserShop } from "@/hooks/use-platform";
import { formatDate } from "@/lib/format";

const ghanaCities = [
  "Accra",
  "Kumasi",
  "Takoradi",
  "Tamale",
  "Cape Coast",
  "Tema",
  "Ho",
  "Sunyani"
];

export function ShopProfileView() {
  const user = useCurrentUser();
  const shop = useUserShop(user?.id, user?.shopId);
  const updateOwnShop = usePlatformStore((s) => s.updateOwnShop);
  const { loading, loadingLabel, error, clearError, run } = usePageAction();

  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!shop) return;
    setName(shop.name);
    setOwnerName(shop.ownerName);
    setPhone(shop.phone);
    setCity(shop.city);
    setDescription(shop.description ?? "");
  }, [shop]);

  if (!user?.shopId || !shop) {
    return (
      <Card className="border-0 p-8 text-center text-muted-foreground">
        No shop linked to this account.
      </Card>
    );
  }

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !city.trim()) {
      setFormError("Name, phone, and city are required.");
      return;
    }
    await run(
      () =>
        updateOwnShop({
          name: name.trim(),
          ownerName: ownerName.trim(),
          phone: phone.trim(),
          city,
          description: description.trim() || undefined
        }),
      { label: "Saving shop profile…" }
    );
  };

  const displayError = formError || error;

  return (
    <div className="relative space-y-6">
      <ActionLoadingOverlay active={loading} label={loadingLabel} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">My shop</h1>
          <p className="text-sm text-muted-foreground">
            Public profile shown on the marketplace
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            shop.status === "active"
              ? "border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
              : ""
          }
        >
          {shop.status}
        </Badge>
      </div>

      {displayError && (
        <Card className="border-0 border-telecel/30 bg-telecel/5">
          <CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-telecel">
            <span>{displayError}</span>
            <Button variant="ghost" size="sm" onClick={() => { clearError(); setFormError(null); }}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Shop overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <StarRating rating={shop.rating} />
            <TrustScore score={shop.trustScore} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground">
            Listed since {formatDate(shop.createdAt)}
          </p>
          <div className="flex flex-wrap gap-2">
            {shop.badges.map((b) => (
              <Badge key={b} variant="outline">
                {b}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card dark:shadow-card-dark">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Shop name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                <User className="h-3.5 w-3.5" />
                Owner display name
              </label>
              <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                <Phone className="h-3.5 w-3.5" />
                Contact phone
              </label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5" />
                City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {ghanaCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Tell buyers why they should choose your shop…"
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save profile
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
