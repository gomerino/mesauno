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
  const focus = searchParams?.focus;

  const forceFreshFromWelcome =
    welcome === "1" || welcome === "true" || (Array.isArray(welcome) && welcome.includes("1"));
  const rawMockPayment =
    typeof mockPayment === "string" ? mockPayment : Array.isArray(mockPayment) ? mockPayment[0] : undefined;
  const mockPaymentStatus = isMockPaymentStatus(rawMockPayment) ? rawMockPayment : null;
  const focusTarget = typeof focus === "string" ? focus : Array.isArray(focus) ? focus[0] : null;
  const forceFresh = forceFreshFromWelcome || Boolean(mockPaymentStatus);
  const optimisticPlanActive = process.env.NODE_ENV === "development" && mockPaymentStatus === "approved";
  const optimisticPaymentStatus = process.env.NODE_ENV === "development" ? mockPaymentStatus : null;

  const celebrateRaw =
    typeof celebrate === "string" ? celebrate : Array.isArray(celebrate) ? celebrate[0] : undefined;
  const celebrateToSuccess =
    process.env.NODE_ENV === "development" &&
    mockPaymentStatus === "approved" &&
    (celebrateRaw === "1" || celebrateRaw === "true");

  return (
    <>
      <PanelMockPaymentActivator
        status={process.env.NODE_ENV === "development" ? mockPaymentStatus : null}
        redirectAfterApprovedTo={celebrateToSuccess ? "/panel/success" : null}
      />
      <PanelWelcomeCleanup enabled={forceFreshFromWelcome} />
      <JourneyHome
        forceFresh={forceFresh}
        showSuccessHero={forceFreshFromWelcome}
        optimisticPlanActive={optimisticPlanActive}
        optimisticPaymentStatus={optimisticPaymentStatus}
        focusTarget={focusTarget}
      />
    </>
  );
}
