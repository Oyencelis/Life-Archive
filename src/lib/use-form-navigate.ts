"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsModal } from "@/components/shell/Modal";

// Entity actions return { href } on success instead of calling redirect()
// server-side, since a server redirect from inside an intercepted modal
// route doesn't reliably reset Next's @modal slot back to default.tsx.
//
// Inside a modal, closing via router.back() is what actually resets the
// slot (forward-pushing to the new record's URL does not) — and it's also
// correct UX, since it returns you to wherever you opened the modal from,
// which revalidatePath has already refreshed. On a real standalone page
// (direct visit / refresh, no modal), there's nothing to go "back" to in a
// meaningful sense, so it forward-navigates to the saved record instead.
export function useFormNavigate(href: string | undefined) {
  const router = useRouter();
  const isModal = useIsModal();

  useEffect(() => {
    if (!href) return;
    if (isModal) {
      router.back();
    } else {
      router.push(href);
    }
  }, [href, isModal, router]);
}
