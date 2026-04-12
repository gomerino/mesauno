"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function useIsMobileViewport() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return mobile;
}

/**
 * Muestra instalación PWA solo en viewport móvil y cuando el navegador emite beforeinstallprompt.
 */
export function InstallButton() {
  const isMobile = useIsMobileViewport();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const onInstall = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      setDeferred(null);
    }
  }, [deferred]);

  if (!isMobile || !deferred) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={onInstall}
        className="pointer-events-auto rounded-full border border-white/15 bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-[#1e293b] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8]"
      >
        Instalar invitación <span aria-hidden>✈️</span>
      </button>
    </div>
  );
}
