import {
  DEFAULT_SITE_ORIGIN,
  JURNEX_HOME_DESCRIPTION,
  JURNEX_HOME_TITLE,
} from "@/lib/seo-jurnex-home";

type Props = {
  siteUrl?: string;
};

/** JSON-LD schema.org: Organization + WebSite + WebPage (home). */
export function LandingHomeJsonLd({ siteUrl }: Props) {
  const base = (siteUrl?.trim() || DEFAULT_SITE_ORIGIN).replace(/\/$/, "");

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "Jurnex",
        description: JURNEX_HOME_DESCRIPTION,
        url: base,
        logo: `${base}/brand/jurnex/logos/full/jurnex-logo-full.png`,
        areaServed: {
          "@type": "Country",
          name: "Chile",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: "Jurnex",
        alternateName: "Jurnex — Tu boda, tu viaje",
        description: JURNEX_HOME_DESCRIPTION,
        inLanguage: "es-CL",
        publisher: { "@id": `${base}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${base}/#webpage`,
        url: `${base}/`,
        name: JURNEX_HOME_TITLE,
        description: JURNEX_HOME_DESCRIPTION,
        isPartOf: { "@id": `${base}/#website` },
        about: { "@id": `${base}/#organization` },
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}
