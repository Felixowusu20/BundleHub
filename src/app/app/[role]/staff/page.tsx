"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ActionLoadingOverlay } from "@/components/shared/action-loading-overlay";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { usePageAction } from "@/hooks/use-page-action";
import { usePlatformStore } from "@/stores/platform-store";
import { useCurrentUser } from "@/hooks/use-platform";
import type { Role, StaffMember } from "@/types/marketplace";
import { Loader2, Plus, Trash2 } from "lucide-react";

const roleTitles: StaffMember["roleTitle"][] = ["Support", "Fulfillment", "Manager"];

export default function StaffPage() {
  const params = useParams<{ role: string }>();
  const role = params.role as Role;
  const user = useCurrentUser();
  const staffMembers = usePlatformStore((s) => s.staff);
  const shops = usePlatformStore((s) => s.shops);
  const addStaffMember = usePlatformStore((s) => s.addStaffMember);
  const removeStaffMember = usePlatformStore((s) => s.removeStaffMember);

  const { loading, loadingLabel, error, clearError, run } = usePageAction();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState<StaffMember["roleTitle"]>("Support");
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const shopMap = useMemo(() => new Map(shops.map((s) => [s.id, s])), [shops]);

  const visibleStaff = useMemo(() => {
    if (role === "shop_owner" && user?.shopId) {
      return staffMembers.filter((s) => s.shopId === user.shopId);
    }
    return staffMembers;
  }, [staffMembers, role, user?.shopId]);

  const canManage = role === "shop_owner" && !!user?.shopId;

  const resetForm = () => {
    setName("");
    setPhone("");
    setRoleTitle("Support");
    setFormError(null);
  };

  const handleAdd = async () => {
    if (!user?.shopId) return;
    if (!name.trim() || !phone.trim()) {
      setFormError("Name and phone are required.");
      return;
    }

    await run(
      () =>
        addStaffMember({
          shopId: user.shopId!,
          name: name.trim(),
          phone: phone.trim(),
          roleTitle,
          performanceScore: 85
        }),
      {
        label: "Adding staff member…",
        onSuccess: () => {
          setAddOpen(false);
          resetForm();
        }
      }
    );
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    const target = removeTarget;
    await run(() => removeStaffMember(target.id), {
      label: "Removing staff member…",
      onSuccess: () => setRemoveTarget(null)
    });
  };

  const displayError = formError || error;

  return (
    <div className="relative space-y-6">
      <ActionLoadingOverlay active={loading} label={loadingLabel} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Staff</h1>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Manage your fulfillment and support team"
              : "Team members across shops"}
          </p>
        </div>
        {canManage && (
          <Button variant="brand" onClick={() => setAddOpen(true)} disabled={loading}>
            <Plus className="h-4 w-4" /> Add staff
          </Button>
        )}
      </div>

      {displayError && !addOpen && (
        <Card className="border-telecel/30 bg-telecel/5 border-0">
          <CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-telecel">
            <span>{displayError}</span>
            <Button variant="ghost" size="sm" onClick={() => { clearError(); setFormError(null); }}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {visibleStaff.length === 0 ? (
          <Card className="col-span-full border-0 p-8 text-center text-muted-foreground">
            No staff yet. Add team members to help fulfill orders.
          </Card>
        ) : (
          visibleStaff.map((s) => (
            <Card key={s.id} className="border-0 shadow-card dark:shadow-card-dark">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {shopMap.get(s.shopId)?.name} • {s.roleTitle}
                    </p>
                  </div>
                  <Badge className="gradient-mtn text-charcoal">{s.performanceScore}%</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{s.phone}</p>
                {canManage && s.shopId === user?.shopId && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-telecel hover:text-telecel"
                      disabled={loading}
                      onClick={() => setRemoveTarget(s)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          if (!loading) {
            setAddOpen(open);
            if (!open) resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add staff member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <p className="rounded-xl bg-telecel/10 px-3 py-2 text-sm text-telecel">{formError}</p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Full name</label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormError(null);
                }}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setFormError(null);
                }}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value as StaffMember["roleTitle"])}
                disabled={loading}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-50"
              >
                {roleTitles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="brand" className="w-full" onClick={handleAdd} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add to team"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && !loading && setRemoveTarget(null)}
        title="Remove staff member?"
        description="They will lose access to fulfill orders for your shop."
        itemLabel="Team member"
        itemDetail={removeTarget ? `${removeTarget.name} • ${removeTarget.roleTitle}` : undefined}
        confirmLabel="Remove"
        loading={loading}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
