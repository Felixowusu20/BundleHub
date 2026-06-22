"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemLabel?: string;
  itemDetail?: string;
  warning?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
};

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  itemLabel,
  itemDetail,
  warning,
  confirmLabel = "Delete",
  loading = false,
  onConfirm
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="gradient-brand px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-left text-white">{title}</DialogTitle>
              <DialogDescription className="text-left text-white/85">
                {description}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {itemLabel && (
            <div className="rounded-2xl border bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {itemLabel}
              </p>
              {itemDetail && (
                <p className="mt-1 font-semibold leading-snug">{itemDetail}</p>
              )}
            </div>
          )}

          {warning && (
            <div
              className={cn(
                "flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"
              )}
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-amber-950 dark:text-amber-100">{warning}</p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl bg-telecel hover:bg-telecel/90"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {confirmLabel}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
