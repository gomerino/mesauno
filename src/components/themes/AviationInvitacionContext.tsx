"use client";

import { createContext, useContext, type ReactNode } from "react";

export type AviationInvitacionVariant = "soft" | "jurnex";

const Ctx = createContext<AviationInvitacionVariant>("soft");

export function AviationInvitacionProvider({
  value,
  children,
}: {
  value: AviationInvitacionVariant;
  children: ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAviationInvitacionVariant(): AviationInvitacionVariant {
  return useContext(Ctx);
}
