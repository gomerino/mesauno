"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = {
  status: "approved" | "rejected" | "pending" | null;
  /**
   * Solo desarrollo: tras POST OK, redirige aquí en lugar de `?welcome=1`.
   * - Aprobado + `/panel/success`: `?mockPayment=approved&celebrate=1`
   * - Rechazado + finanzas: `?mockPayment=rejected&resultado=1` → banner `pago=fallido`
   * - Pendiente + finanzas: `?mockPayment=pending&resultado=1` → `pago=pendiente`
   */
  redirectAfterMockTo?: string | null;
};

/**
 * En desarrollo, permite simular pago con `?mockPayment=approved|rejected|pending`.
 * Guarda estado mock en DB y refresca estado del panel.
 */
export function PanelMockPaymentActivator({ status, redirectAfterMockTo = null }: Props) {
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
        if (redirectAfterMockTo) {
          router.replace(redirectAfterMockTo);
        } else {
          router.replace(`${pathname}?welcome=1`);
        }
        router.refresh();
      } catch {
        /* red silenciosa: mock solo dev */
      }
    })();
  }, [status, pathname, router, redirectAfterMockTo]);

  return null;
}
