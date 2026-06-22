"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ServiceListingForm } from "@/features/services/service-listing-form";
import { AdminServicesView } from "@/features/admin/admin-services-view";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { usePageAction } from "@/hooks/use-page-action";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser, useUserShop } from "@/hooks/use-platform";
import { formatGhs } from "@/lib/format";
import { formatServiceFromLabel, isPerGbService } from "@/lib/pricing";
import type { Role } from "@/types/marketplace";
import {
  buildServicePayload,
  emptyServiceForm,
  serviceToForm,
  validateServiceForm,
  type ServiceFormState
} from "@/lib/service-listing-form";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { ServiceListing } from "@/types/marketplace";

export default function ServicesPage() {
  const params = useParams<{ role: string }>();
  const role = params.role as Role;

  if (role === "super_admin") {
    return <AdminServicesView />;
  }

  return <ShopOwnerServicesPage />;
}

function ShopOwnerServicesPage() {
  const user = useCurrentUser();
  const shop = useUserShop(user?.id, user?.shopId);
  const allServices = usePlatformStore((s) => s.services);
  const addService = usePlatformStore((s) => s.addService);
  const updateService = usePlatformStore((s) => s.updateService);
  const deleteService = usePlatformStore((s) => s.deleteService);
  const { loading, loadingLabel, error, clearError, run } = usePageAction();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ServiceFormState>(emptyServiceForm);
  const [deleteTarget, setDeleteTarget] = useState<ServiceListing | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const myServices = useMemo(
    () => (user?.shopId ? allServices.filter((s) => s.shopId === user.shopId) : []),
    [allServices, user?.shopId]
  );

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return myServices;
    return myServices.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.network?.toLowerCase().includes(q)
    );
  }, [myServices, search]);

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyServiceForm());
    setFormError(null);
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyServiceForm());
    setShowForm(true);
  };

  const openEditForm = (serviceId: string) => {
    const svc = myServices.find((s) => s.id === serviceId);
    if (!svc) return;
    setEditingId(serviceId);
    setForm(serviceToForm(svc));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.shopId || !shop) return;

    const validationError = validateServiceForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = buildServicePayload(form);

    if (editingId) {
      await run(() => updateService(editingId, payload), {
        label: "Saving listing…",
        onSuccess: closeForm
      });
      return;
    }

    await run(
      async () => {
        await addService(user.shopId!, payload);
        return { ok: true as const };
      },
      {
        label: shop.status === "active" ? "Publishing listing…" : "Saving listing…",
        onSuccess: closeForm
      }
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    await run(() => deleteService(target.id), {
      label: "Removing listing…",
      onSuccess: () => {
        if (editingId === target.id) closeForm();
        setDeleteTarget(null);
      }
    });
  };

  const displayError = formError || error;

  const formTitle = editingId ? "Edit listing" : "New listing";
  const submitLabel = editingId ? "Save changes" : "Save listing";

  return (
    <div className="relative space-y-6">
      <ActionLoadingOverlay active={loading} label={loadingLabel} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Services</h1>
          <p className="text-sm text-muted-foreground">
            {shop?.name ?? "Your shop"} — {myServices.length} listing
            {myServices.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="brand"
          onClick={() => (showForm && !editingId ? closeForm() : openAddForm())}
          disabled={loading}
        >
          <Plus className="h-4 w-4" /> Add listing
        </Button>
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

      {showForm && (
        <Card className="border-0 shadow-card dark:shadow-card-dark">
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold">{formTitle}</h2>
            <ServiceListingForm
              form={form}
              onChange={(f) => {
                setForm(f);
                setFormError(null);
              }}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              submitLabel={submitLabel}
            />
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search services…"
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredServices.length === 0 ? (
          <Card className="col-span-full border-0 p-8 text-center text-muted-foreground">
            {myServices.length === 0
              ? "No services yet. Add your first listing above."
              : "No listings match your search."}
          </Card>
        ) : (
          filteredServices.map((svc) => (
            <Card key={svc.id} className="border-0 shadow-card dark:shadow-card-dark">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {svc.category}
                  </Badge>
                  <Badge
                    className={
                      svc.inStock
                        ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {svc.inStock ? "In stock" : "Hidden"}
                  </Badge>
                </div>
                <h3 className="mt-3 font-semibold">{svc.name}</h3>
                {isPerGbService(svc) ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {svc.network} • {formatGhs(svc.pricePerGb ?? 0)}/GB •{" "}
                    {(svc.gbTiers ?? []).length || "all"} sizes
                  </p>
                ) : null}
                <p className="mt-3 font-display text-xl font-bold text-mtn">
                  {formatServiceFromLabel(svc)}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => openEditForm(svc.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-1 text-telecel hover:text-telecel"
                    onClick={() => setDeleteTarget(svc)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !loading && setDeleteTarget(null)}
        title="Remove listing?"
        description="This listing will disappear from your shop on the marketplace."
        itemLabel="Service"
        itemDetail={
          deleteTarget
            ? `${deleteTarget.name} • ${formatServiceFromLabel(deleteTarget)}`
            : undefined
        }
        warning="If this listing has pending, accepted, or processing orders, deletion is blocked. Mark it out of stock instead."
        confirmLabel="Remove listing"
        loading={loading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
