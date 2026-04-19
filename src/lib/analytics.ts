"use client";

type Props = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: string, props: Props = {}): void {
  if (typeof window === "undefined") return;
  const payload = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined));

  try {
    const w = window as Window & {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: unknown[];
    };
    if (typeof w.gtag === "function") {
      w.gtag("event", name, payload);
    }
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: name, ...payload });
    }
    window.dispatchEvent(new CustomEvent("jurnex:analytics", { detail: { name, ...payload } }));
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", name, payload);
    }
  } catch {
    // no-op
  }
}
