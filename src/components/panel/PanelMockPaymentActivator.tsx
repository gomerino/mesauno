"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = {
  status: "approved" | "rejected" | "pending" | null;
};

/**
 * En desarrollo, permite simular pago con `?mockPayment=approved|rejected|pending`.
 * Guarda estado mock en DB y refresca estado del panel.
 */
export function PanelMockPaymentActivator({ status }: Props) {
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
      } finally {
        router.replace(`${pathname}?welcome=1`);
        router.refresh();
      }
    })();
  }, [status, pathname, router]);

  return null;
}
