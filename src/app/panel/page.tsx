import { PanelMockPaymentActivator } from "@/components/panel/PanelMockPaymentActivator";
import { PanelWelcomeCleanup } from "@/components/panel/PanelWelcomeCleanup";
import { JourneyHome } from "@/components/panel/JourneyHome";
import { isMockPaymentStatus } from "@/lib/mock-payment";

export const dynamic = "force-dynamic";

/** Inicio del panel: un solo entry point (`JourneyHome`). Sin dashboard paralelo. */
export default function PanelHomePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const welcome = searchParams?.welcome;
  const mockPayment = searchParams?.mockPayment;
  const celebrate = searchParams?.celebrate;
  const resultado = searchParams?.resultado;
  const focus = searchParams?.focus;

  const forceFreshFromWelcome =
    welcome === "1" || welcome === "true" || (Array.isArray(welcome) && welcome.includes("1"));
  const rawMockPayment =
    typeof mockPayment === "string" ? mockPayment : Array.isArray(mockPayment) ? mockPayment[0] : undefined;
  const mockPaymentStatus = isMockPaymentStatus(rawMockPayment) ? rawMockPayment : null;
  const focusTarget = typeof focus === "string" ? focus : Array.isArray(focus) ? focus[0] : null;
  const celebrateRaw =
    typeof celebrate === "string" ? celebrate : Array.isArray(celebrate) ? celebrate[0] : undefined;
  const resultadoRaw =
    typeof resultado === "string" ? resultado : Array.isArray(resultado) ? resultado[0] : undefined;
  const celebrateToSuccess =
    process.env.NODE_ENV === "development" &&
    mockPaymentStatus === "approved" &&
    (celebrateRaw === "1" || celebrateRaw === "true");
  const resultadoFinanzas =
    process.env.NODE_ENV === "development" &&
    (resultadoRaw === "1" || resultadoRaw === "true");

  let redirectAfterMockTo: string | null = null;
  if (celebrateToSuccess) {
    redirectAfterMockTo = "/panel/success";
  } else if (resultadoFinanzas && mockPaymentStatus === "rejected") {
    redirectAfterMockTo = "/panel/finanzas?pago=fallido";
  } else if (resultadoFinanzas && mockPaymentStatus === "pending") {
    redirectAfterMockTo = "/panel/finanzas?pago=pendiente";
  }

  return (
    <>
      <PanelMockPaymentActivator
        status={process.env.NODE_ENV === "development" ? mockPaymentStatus : null}
        redirectAfterMockTo={redirectAfterMockTo}
      />
      <PanelWelcomeCleanup enabled={forceFreshFromWelcome} />
      <JourneyHome focusTarget={focusTarget} />
    </>
  );
}
