"use client";

import JurnexTabs from "@/components/ui/JurnexTabs";
import { useEventoCentroTab } from "@/components/panel/evento/EventoCentroTabContext";

export function EventoTabs() {
  const ctx = useEventoCentroTab();
  if (!ctx) return null;
  return <JurnexTabs active={ctx.tab} onChange={ctx.setTab} />;
}
