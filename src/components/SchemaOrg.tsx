export default function SchemaOrg() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.jurnex.cl/#website",
        url: "https://www.jurnex.cl",
        name: "Jurnex",
        description: "Plataforma de invitaciones digitales para matrimonios en Chile y LATAM",
        inLanguage: "es-CL",
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.jurnex.cl/#app",
        name: "Jurnex",
        url: "https://www.jurnex.cl",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          priceCurrency: "CLP",
          availability: "https://schema.org/InStock",
        },
        description:
          "Crea invitaciones de matrimonio estilo boarding pass, gestiona invitados, RSVP, programa y música en un solo lugar.",
        inLanguage: "es-CL",
        areaServed: {
          "@type": "GeoCircle",
          geoMidpoint: {
            "@type": "GeoCoordinates",
            latitude: -33.4569,
            longitude: -70.6483,
          },
          geoRadius: "5000000",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://www.jurnex.cl/#organization",
        name: "Jurnex",
        url: "https://www.jurnex.cl",
        logo: {
          "@type": "ImageObject",
          url: "https://www.jurnex.cl/brand/jurnex/logos/full/jurnex-logo-full.png",
        },
        areaServed: "CL",
        foundingLocation: {
          "@type": "Place",
          name: "Chile",
        },
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}
