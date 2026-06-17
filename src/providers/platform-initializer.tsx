"use client";

import { useEffect } from "react";
import { usePlatformStore } from "@/stores/platform-store";

export function PlatformInitializer() {
  const initialize = usePlatformStore((s) => s.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);
  return null;
}
