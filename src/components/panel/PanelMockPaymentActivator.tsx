"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = {
  status: "approved" | "rejected" | "pending" | null;
  /**
   * Solo desarrollo: si el mock es `approved`, tras guardar en DB redirige aquí
   * en lugar de `?welcome=1`. Útil para probar la microceremonia en `/panel/success`.
   * Ej.: `/panel?mockPayment=approved&celebrate=1`
   */
  redirectAfterApprovedTo?: string | null;
};

/**
 * En desarrollo, permite simular pago con `?mockPayment=approved|rejected|pending`.
 * Guarda estado mock en DB y refresca estado del panel.
 */
export function PanelMockPaymentActivator({ status, redirectAfterApprovedTo = null }: Props) {
  const firedRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!status || firedRef.current) return;
    firedRef.current = true;

    void (async () => {
      try {
        const res = await fetch("/api/dev/mock-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) return;
        if (status === "approved" && redirectAfterApprovedTo) {
          router.replace(redirectAfterApprovedTo);
        } else {
          router.replace(`${pathname}?welcome=1`);
        }
        router.refresh();
      } catch {
        /* red silenciosa: mock solo dev */
      }
    })();
  }, [status, pathname, router, redirectAfterApprovedTo]);

  return null;
}
