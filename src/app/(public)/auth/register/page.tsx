"use client";

import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/register-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
