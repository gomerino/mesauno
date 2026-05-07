type Props = {
  siteUrl: string;
};

/** Datos estructurados para la home — Organization + WebSite (schema.org). */
export function LandingHomeJsonLd({ siteUrl }: Props) {
  const base = siteUrl.replace(/\/$/, "");
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "Jurnex",
        url: base,
        logo: `${base}/brand/jurnex/logos/full/jurnex-logo-full.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: "Jurnex",
        description: "Invitaciones, invitados y experiencia en un solo lugar para tu matrimonio.",
        inLanguage: "es-CL",
        publisher: { "@id": `${base}/#organization` },
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}
