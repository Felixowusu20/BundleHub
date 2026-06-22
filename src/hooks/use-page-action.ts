"use client";

import { useCallback, useState } from "react";

const MIN_MS = 450;

type ActionResult = { ok: true } | { ok: false; error: string };

export function usePageAction() {
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Please wait…");
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(
    async (
      action: () => ActionResult | Promise<ActionResult>,
      options?: { label?: string; onSuccess?: () => void }
    ) => {
      setError(null);
      setLoadingLabel(options?.label ?? "Please wait…");
      setLoading(true);
      const started = Date.now();

      let result: ActionResult;
      try {
        result = await action();
      } catch (e) {
        result = {
          ok: false,
          error: e instanceof Error ? e.message : "Something went wrong."
        };
      }

      const elapsed = Date.now() - started;
      if (elapsed < MIN_MS) {
        await new Promise((r) => setTimeout(r, MIN_MS - elapsed));
      }

      setLoading(false);

      if (!result.ok) {
        setError(result.error);
        return false;
      }

      options?.onSuccess?.();
      return true;
    },
    []
  );

  return { loading, loadingLabel, error, clearError, run };
}
