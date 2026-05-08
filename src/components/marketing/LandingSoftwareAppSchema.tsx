/** JSON-LD adicional solicitado para la landing (complemento al grafo global en layout). */
export function LandingSoftwareAppSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Jurnex",
    applicationCategory: "WeddingPlanningApplication",
    operatingSystem: "Web",
    description:
      "Plataforma para crear invitaciones digitales de matrimonio con RSVP, programa y experiencia interactiva",
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}
