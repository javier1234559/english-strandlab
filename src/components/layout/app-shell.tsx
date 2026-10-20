"use client";

import type { ReactNode } from "react";
import { FootnoteFloatingActions } from "@/feature/footnote/components/FootnoteFloatingActions";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <FootnoteFloatingActions />
    </>
  );
}
