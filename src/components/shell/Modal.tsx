"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ModalShell } from "./ModalShell";

const IsModalContext = createContext(false);

// Forms render inside both a real page (direct URL / refresh) and this
// modal (intercepted in-app navigation). They need to behave differently on
// success — see useFormNavigate — so this tells them which context they're in.
export function useIsModal() {
  return useContext(IsModalContext);
}

// Used from intercepting routes (@modal/(.)entity/new etc.) so the same
// /people/new URL is a real page on direct load/refresh, but appears as an
// overlay when reached by clicking within the app — one consistent
// create/edit affordance everywhere instead of some entities using a page
// and others expanding inline.
export function Modal({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <IsModalContext.Provider value={true}>
      <ModalShell onClose={() => router.back()}>{children}</ModalShell>
    </IsModalContext.Provider>
  );
}
