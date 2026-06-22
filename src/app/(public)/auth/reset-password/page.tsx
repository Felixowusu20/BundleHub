import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { PageLoader } from "@/components/shared/page-loader";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading…" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
