import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { obtenerProveedorPropio } from "@/lib/proveedores";

export const metadata: Metadata = {
  title: "Para proveedores · Jurnex",
  description:
    "Las parejas de Jurnex están organizando sus bodas. Queremos que te conozcan. Súmate al marketplace de matrimonios premium.",
};

/**
 * Landing pública de onboarding de proveedores (M02).
 * Server Component: lee sesión para ajustar CTA si ya está logueado como proveedor.
 */
export default async function LandingProveedoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const proveedor = user ? await obtenerProveedorPropio(supabase, user.id) : null;

  const ctaHref = proveedor ? "/proveedor" : "/para-proveedores/registro";
  const ctaLabel = proveedor
    ? "Ir a mi panel de proveedor"
    : "Comenzar ahora · Es gratis";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
      <HeaderNav />

      <section className="mx-auto max-w-5xl px-5 pb-16 pt-14 md:pb-24 md:pt-20">
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Marketplace premium · Chile
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
              Las parejas de Jurnex están organizando sus bodas.{" "}
              <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 bg-clip-text text-transparent">
                Queremos que te conozcan.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300 md:text-xl">
              Suma tu servicio al marketplace, recibe contactos cualificados de
              parejas que ya están buscando proveedores y convierte solicitudes
              en experiencias inolvidables.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-300/20 transition hover:bg-amber-200"
              >
                {ctaLabel}
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-slate-100 transition hover:border-white/40 hover:bg-white/5"
              >
                Ver el marketplace →
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Sin costo de inscripción · Sin comisiones · Revisión manual en 48 horas.
            </p>
          </div>

          <HeroCard />
        </div>
      </section>

      <ProofPoints />
      <BeneficiosSection />
      <PlanesSection ctaHref={ctaHref} />
      <FAQSection />
      <CtaFinal ctaHref={ctaHref} ctaLabel={ctaLabel} />

      <footer className="border-t border-white/10 px-5 py-10 text-center text-sm text-slate-500">
        <p>
          © {new Date().getFullYear()} Jurnex · Hecho en Chile para que los
          matrimonios despeguen ✈️
        </p>
      </footer>
    </main>
  );
}

function HeaderNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          Jurnex
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/marketplace"
            className="hidden text-slate-300 hover:text-white sm:inline"
          >
            Marketplace
          </Link>
          <Link
            href="/login?next=/proveedor"
            className="text-slate-300 hover:text-white"
          >
            Ya soy proveedor
          </Link>
        </nav>
      </div>
    </header>
  );
}

function HeroCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-slate-900/80 to-slate-800/40 p-6 shadow-2xl shadow-amber-300/5 md:p-8">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">
          Promedio del marketplace
        </p>
        <p className="mt-3 font-display text-5xl font-bold text-white">
          3–5
        </p>
        <p className="text-sm text-slate-300">contactos cualificados al mes por proveedor activo</p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Stat kpi="120+" label="parejas activas" />
          <Stat kpi="8" label="categorías" />
          <Stat kpi="48h" label="SLA de aprobación" />
          <Stat kpi="$0" label="inscripción" />
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Cifras conservadoras basadas en nuestra cohorte beta. No prometemos
          más de lo que podemos entregar.
        </p>
      </div>
    </div>
  );
}

function Stat({ kpi, label }: { kpi: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="font-display text-2xl font-bold text-amber-200">{kpi}</p>
      <p className="text-xs text-slate-300">{label}</p>
    </div>
  );
}

function ProofPoints() {
  const points = [
    {
      titulo: "Parejas que ya están listas",
      texto:
        "Accedes a parejas que completaron el onboarding y tienen un evento concreto en marcha. No curiosos.",
    },
    {
      titulo: "Marketplace curado",
      texto:
        "Revisamos cada perfil antes de activarlo. Calidad primero, así conviertes mejor.",
    },
    {
      titulo: "Sin intermediarios",
      texto:
        "Las solicitudes llegan directo a tu WhatsApp o correo. Jurnex no cobra comisión al cierre.",
    },
  ];
  return (
    <section className="border-y border-white/5 bg-slate-900/60">
      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-12 md:grid-cols-3 md:py-16">
        {points.map((p) => (
          <div key={p.titulo}>
            <p className="font-display text-lg font-semibold text-amber-200">
              {p.titulo}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {p.texto}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BeneficiosSection() {
  const items = [
    {
      icon: "✈️",
      titulo: "Perfil premium en minutos",
      texto:
        "Registra tu negocio en 3 pasos: cuenta, detalles y tus mejores fotos. Luego nosotros revisamos.",
    },
    {
      icon: "💬",
      titulo: "Contacto directo",
      texto:
        "Las parejas te escriben por WhatsApp o correo desde tu ficha. Siempre con contexto (fecha, región, presupuesto).",
    },
    {
      icon: "✨",
      titulo: "Destacado si subes de plan",
      texto:
        "Premium: apareces primero, sin tope mensual de contactos y con analítica de tu perfil.",
    },
    {
      icon: "📸",
      titulo: "Tu portafolio brilla",
      texto:
        "Galería de hasta 6 fotos en plan free (sin límite en premium), optimizadas para móvil.",
    },
  ];
  return (
    <section className="mx-auto max-w-5xl px-5 py-14 md:py-20">
      <h2 className="font-display text-3xl font-bold md:text-4xl">
        Cómo te ayudamos a crecer
      </h2>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {items.map((i) => (
          <div
            key={i.titulo}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-900/30 p-6"
          >
            <p className="text-3xl">{i.icon}</p>
            <p className="mt-3 font-display text-lg font-semibold">
              {i.titulo}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {i.texto}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlanesSection({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="border-t border-white/5 bg-slate-900/60 px-5 py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Elige tu plan
          </h2>
          <p className="mt-3 text-slate-300">
            Comienza gratis. Pásate a Premium cuando los contactos sobren.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <PlanCard
            nombre="Free"
            precio="$0"
            frecuencia="para siempre"
            destacado={false}
            beneficios={[
              "Perfil completo en el marketplace",
              "Hasta 6 fotos",
              "3 contactos al mes",
              "Contacto directo por WhatsApp / correo",
              "Listado por región y categoría",
            ]}
            ctaHref={ctaHref}
            ctaLabel="Comenzar gratis"
          />
          <PlanCard
            nombre="Premium"
            precio="$29.990"
            frecuencia="CLP / mes"
            destacado
            beneficios={[
              "Todo lo del plan Free",
              "Fotos sin límite",
              "Solicitudes sin límite mensual",
              "Ficha destacada (apareces primero)",
              "Analítica: vistas, clics y conversión",
              "Distintivo Premium en tu perfil",
            ]}
            ctaHref={ctaHref}
            ctaLabel="Comenzar y mejorar después"
          />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Puedes empezar en Free y pasar a Premium desde tu panel cuando quieras.
          Sin permanencia, sin letra chica.
        </p>
      </div>
    </section>
  );
}

function PlanCard({
  nombre,
  precio,
  frecuencia,
  destacado,
  beneficios,
  ctaHref,
  ctaLabel,
}: {
  nombre: string;
  precio: string;
  frecuencia: string;
  destacado: boolean;
  beneficios: string[];
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div
      className={`relative rounded-3xl border p-6 md:p-8 ${
        destacado
          ? "border-amber-300/50 bg-gradient-to-br from-amber-300/10 via-slate-900 to-slate-900 shadow-2xl shadow-amber-300/10"
          : "border-white/10 bg-slate-900/60"
      }`}
    >
      {destacado && (
        <p className="absolute -top-3 left-6 rounded-full border border-amber-300/50 bg-amber-300 px-3 py-1 text-xs font-semibold text-slate-950">
          Más elegido
        </p>
      )}
      <p className="font-display text-xl font-semibold">{nombre}</p>
      <p className="mt-4 font-display text-4xl font-bold">{precio}</p>
      <p className="text-sm text-slate-300">{frecuencia}</p>

      <ul className="mt-6 space-y-3 text-sm text-slate-200">
        {beneficios.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-300">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
          destacado
            ? "bg-amber-300 text-slate-950 hover:bg-amber-200"
            : "border border-white/20 text-white hover:border-white/40 hover:bg-white/5"
        }`}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "¿Cuánto tarda la aprobación?",
      a: "Revisamos cada perfil manualmente en menos de 48 horas hábiles. Si necesitamos info adicional, te escribimos por correo.",
    },
    {
      q: "¿Cobran comisión por reserva?",
      a: "No. Jurnex cobra solo la suscripción Premium si decides subir de plan. Las reservas y pagos con la pareja los gestionas tú, fuera de la plataforma.",
    },
    {
      q: "¿Puedo cambiar de plan o pausar?",
      a: "Sí. Desde tu panel puedes subir, bajar o pausar tu visibilidad cuando quieras. Sin permanencia.",
    },
    {
      q: "¿Qué tipo de fotos suben los proveedores?",
      a: "Recomendamos 3 a 6 fotos de trabajos reales, con buena luz. Evita marcas de agua grandes y fotos muy editadas que no representen el resultado real.",
    },
    {
      q: "¿Necesito tener sitio web?",
      a: "No. Puedes ofrecer solo Instagram o WhatsApp. Muchos proveedores comienzan así.",
    },
  ];
  return (
    <section className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <h2 className="font-display text-3xl font-bold md:text-4xl">
        Preguntas frecuentes
      </h2>
      <div className="mt-8 space-y-3">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border border-white/10 bg-slate-900/60 p-5 open:bg-slate-900/80"
          >
            <summary className="cursor-pointer list-none font-display font-semibold text-slate-100 transition group-open:text-amber-200">
              {f.q}
              <span className="float-right text-slate-400 transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CtaFinal({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section className="px-5 pb-16 md:pb-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-amber-300/40 bg-gradient-to-br from-amber-300/15 via-slate-900 to-slate-950 p-10 text-center md:p-14">
        <p className="font-display text-3xl font-bold md:text-4xl">
          ¿Listo para despegar?
        </p>
        <p className="mx-auto mt-4 max-w-xl text-slate-300">
          Te toma 5 minutos, nosotros revisamos en 48 horas y las parejas
          comienzan a conocerte. Sin riesgo y sin permanencia.
        </p>
        <Link
          href={ctaHref}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-amber-300 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-300/20 transition hover:bg-amber-200"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
