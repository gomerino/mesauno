"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  enabled: boolean;
};

/**
 * Limpia `?welcome=1` tras mostrar feedback post-pago
 * para que no reaparezca al refrescar.
 */
export function PanelWelcomeCleanup({ enabled }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    router.replace("/panel");
  }, [enabled, router]);

  return null;
}

