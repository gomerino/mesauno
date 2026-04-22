"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type EventoCentroTabId = "datos" | "invitacion" | "experiencia";

type Ctx = {
  tab: EventoCentroTabId;
  setTab: (t: EventoCentroTabId) => void;
};

const EventoCentroTabContext = createContext<Ctx | null>(null);

export function EventoCentroTabProvider({
  children,
  initialTab = "datos",
}: {
  children: ReactNode;
  initialTab?: EventoCentroTabId;
}) {
  const [tab, setTabState] = useState<EventoCentroTabId>(initialTab);
  const setTab = useCallback((t: EventoCentroTabId) => {
    setTabState(t);
  }, []);
  const value = useMemo(() => ({ tab, setTab }), [tab, setTab]);
  return <EventoCentroTabContext.Provider value={value}>{children}</EventoCentroTabContext.Provider>;
}

export function useEventoCentroTab(): Ctx | null {
  return useContext(EventoCentroTabContext);
}
