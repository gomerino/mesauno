import { JourneyHome } from "@/components/panel/JourneyHome";

export const dynamic = "force-dynamic";

/** Inicio del panel: un solo entry point (`JourneyHome`). Sin dashboard paralelo. */
export default function PanelHomePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const welcome = searchParams?.welcome;
  const forceFresh =
    welcome === "1" || welcome === "true" || (Array.isArray(welcome) && welcome.includes("1"));
  return <JourneyHome forceFresh={forceFresh} />;
}
