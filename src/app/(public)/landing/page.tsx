import { Suspense } from "react";
import { LandingPage } from "@/features/landing/landing-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <LandingPage />
    </Suspense>
  );
}
