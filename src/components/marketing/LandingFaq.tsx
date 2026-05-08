import { FAQ_ITEMS_MARKUP_IDS } from "@/components/marketing/landing-faq-data";

export function LandingFaq() {
  return (
    <section
      className="border-b border-jurnex-border bg-jurnex-bg px-4 py-16 sm:py-20"
      aria-labelledby="landing-faq-title"
    >
      <div className="mx-auto max-w-3xl">
        <h2 id="landing-faq-title" className="text-center font-display text-2xl font-bold text-jurnex-text-primary sm:text-3xl">
          Preguntas frecuentes
        </h2>
        <div className="mt-10 space-y-8">
          {FAQ_ITEMS_MARKUP_IDS.map((item) => (
            <div key={item.q}>
              <h3 className="font-semibold text-jurnex-text-primary">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-jurnex-text-primary/82">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
