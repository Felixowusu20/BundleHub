import { Suspense } from "react";
import { MessengerView } from "@/features/messaging/messenger-view";

export default function Page() {
  return (
    <Suspense>
      <MessengerView />
    </Suspense>
  );
}
