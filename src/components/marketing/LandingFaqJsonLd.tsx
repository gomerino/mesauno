import { FAQ_ITEMS_MARKUP_IDS } from "@/components/marketing/landing-faq-data";

/** JSON-LD FAQPage alineado a las mismas preguntas que `LandingFaq`. */
export function LandingFaqJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS_MARKUP_IDS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}
