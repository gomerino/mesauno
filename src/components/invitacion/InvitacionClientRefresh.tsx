"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Safari (sobre todo iOS) restaura la pestaña desde bfcache sin volver a ejecutar el servidor:
 * la fecha y el resto del RSC pueden quedar desactualizados. Un refresh al `pageshow` con
 * `persisted` fuerza datos actuales tras volver atrás o reabrir la pestaña.
 */
export function InvitacionClientRefresh() {
  const router = useRouter();

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) router.refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  return null;
}
