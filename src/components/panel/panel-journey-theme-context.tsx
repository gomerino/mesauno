"use client";

import type { JourneyThemeId } from "@/theme/panel-themes";
import { createContext, useContext } from "react";

export const PanelJourneyThemeContext = createContext<JourneyThemeId>("relax");

export function usePanelJourneyTheme(): JourneyThemeId {
  return useContext(PanelJourneyThemeContext);
}
