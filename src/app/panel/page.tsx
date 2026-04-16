import { JourneyHome } from "@/components/panel/JourneyHome";

export const dynamic = "force-dynamic";

/** Inicio del panel: un solo entry point (`JourneyHome`). Sin dashboard paralelo. */
export default function PanelHomePage() {
  return <JourneyHome />;
}
