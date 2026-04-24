"use client";

import JurnexTabs from "@/components/ui/JurnexTabs";
import { useEventoCentroTab, type EventoCentroTabId } from "@/components/panel/evento/EventoCentroTabContext";

export type EventoTabCompletion = Partial<Record<EventoCentroTabId, boolean>>;

type Props = {
  /** Alineado con `bundle.steps` (tab_tripulacion, tab_invitacion, tab_experiencia). */
  tabCompletion?: EventoTabCompletion;
};

export function EventoTabs({ tabCompletion }: Props) {
  const ctx = useEventoCentroTab();
  if (!ctx) return null;
  return <JurnexTabs active={ctx.tab} onChange={ctx.setTab} tabCompletion={tabCompletion} />;
}
