"use client";

import { useEffect } from "react";

/**
 * Registra el SW sin bloquear el render. No intercepta navegaciones (ver public/sw.js).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
