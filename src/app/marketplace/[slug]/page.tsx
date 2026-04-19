import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import {
  labelCategoria,
  labelRegion,
  MOTIVOS_SUSPENSION,
  obtenerProveedorPorSlug,
  parseMotivoSuspension,
} from "@/lib/proveedores";
import { MarketplaceSolicitudContacto } from "@/components/marketplace/MarketplaceSolicitudContacto";
import type { ProveedorMedio } from "@/types/database";

type Props = { params: Promise<{ slug: string }> };

function enlaceWhatsApp(telefonoE164: string | null): string | null {
  if (!telefonoE164) return null;
  const digitos = telefonoE164.replace(/\D/g, "");
  if (digitos.length < 8) return null;
  return `https://wa.me/${digitos}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const data = await obtenerProveedorPorSlug(supabase, slug, user?.id ?? null);
  if (!data) {
    return {
      title: "Proveedor no encontrado · Jurnex",
      description: "Este perfil no está disponible en el marketplace.",
    };
  }
  const { proveedor } = data;
  const desc =
    proveedor.eslogan?.trim() ||
    proveedor.biografia?.trim().slice(0, 155) ||
    `${labelCategoria(proveedor.categoria_principal)} en ${labelRegion(proveedor.region)}.`;
  return {
    title: `${proveedor.nombre_negocio} · Marketplace Jurnex`,
    description: desc,
  };
}

export default async function MarketplaceProveedorPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = await obtenerProveedorPorSlug(supabase, slug, user?.id ?? null);
  if (!data) {
    notFound();
  }

  const { proveedor, servicios, medios } = data;
  const esDueno = Boolean(user && user.id === proveedor.user_id);
  const esPublico = proveedor.estado === "aprobado";
  const wa = enlaceWhatsApp(proveedor.whatsapp);

  let textoMotivoSuspension: string | null = null;
  if (proveedor.estado === "suspendido") {
    const { motivo, detalle } = parseMotivoSuspension(proveedor.motivo_suspension);
    const motivoLabel =
      motivo && MOTIVOS_SUSPENSION.find((m) => m.value === motivo)?.label;
    textoMotivoSuspension = `${motivoLabel ?? "Tu perfil está en pausa."}${detalle ? ` · ${detalle}` : ""}`;
  }

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/marketplace" className="hover:text-white">
            Marketplace
          </Link>
          <span className="mx-2 text-slate-600">/</span>
          <span className="text-slate-300">{proveedor.nombre_negocio}</span>
        </nav>

        {esDueno && !esPublico && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-sm ${
              proveedor.estado === "suspendido"
                ? "border-red-400/40 bg-red-500/10 text-red-100"
                : "border-amber-400/40 bg-amber-400/10 text-amber-100"
            }`}
          >
            {proveedor.estado === "pendiente" && (
              <p>
                <strong className="font-semibold">Vista previa.</strong> Solo tú ves esta
                página. Cuando el equipo apruebe tu perfil, las parejas podrán encontrarte
                aquí.
              </p>
            )}
            {proveedor.estado === "suspendido" && textoMotivoSuspension && (
              <p>
                <strong className="font-semibold">Perfil no visible públicamente.</strong>{" "}
                {textoMotivoSuspension}
              </p>
            )}
            <Link
              href="/proveedor"
              className="mt-3 inline-block font-semibold text-amber-200 underline underline-offset-2 hover:text-white"
            >
              Ir al panel de proveedor
            </Link>
          </div>
        )}

        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-teal-400">
            {labelCategoria(proveedor.categoria_principal)} · {labelRegion(proveedor.region)}
            {proveedor.ciudad ? ` · ${proveedor.ciudad}` : ""}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">
            {proveedor.nombre_negocio}
          </h1>
          {proveedor.eslogan && (
            <p className="mt-2 text-lg text-slate-300">{proveedor.eslogan}</p>
          )}
          {proveedor.plan === "premium" && esPublico && (
            <p className="mt-3 inline-flex rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200">
              Premium
            </p>
          )}
        </header>

        {medios.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-lg font-semibold text-white">Galería</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {medios.map((m) => (
                <MedioCard key={m.id} medio={m} />
              ))}
            </div>
          </section>
        )}

        {proveedor.biografia && (
          <section className="mt-10">
            <h2 className="font-display text-lg font-semibold text-white">Sobre el servicio</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {proveedor.biografia}
            </p>
          </section>
        )}

        {servicios.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-lg font-semibold text-white">Servicios</h2>
            <ul className="mt-4 space-y-4">
              {servicios.map((s) => (
                <li
                  key={s.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white">{s.nombre}</h3>
                      <p className="text-xs text-slate-500">{labelCategoria(s.categoria)}</p>
                    </div>
                    {s.precio_desde_clp != null && (
                      <span className="shrink-0 font-semibold text-orange-300">
                        desde{" "}
                        {Number(s.precio_desde_clp).toLocaleString("es-CL", {
                          style: "currency",
                          currency: "CLP",
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    )}
                  </div>
                  {s.descripcion && (
                    <p className="mt-2 text-sm text-slate-400">{s.descripcion}</p>
                  )}
                  {s.duracion_min != null && (
                    <p className="mt-2 text-xs text-slate-500">Duración aprox.: {s.duracion_min} min</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 rounded-2xl border border-teal-500/30 bg-teal-950/30 p-6">
          <h2 className="font-display text-lg font-semibold text-white">Contacto</h2>
          <p className="mt-2 text-sm text-slate-400">
            Las parejas pueden comunicarse contigo por estos canales.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
              >
                WhatsApp
              </a>
            )}
            {proveedor.instagram && (
              <a
                href={`https://instagram.com/${proveedor.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:border-white/40"
              >
                Instagram
              </a>
            )}
            {proveedor.sitio_web && (
              <a
                href={
                  proveedor.sitio_web.startsWith("http")
                    ? proveedor.sitio_web
                    : `https://${proveedor.sitio_web}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:border-white/40"
              >
                Sitio web
              </a>
            )}
          </div>
          {!wa && !proveedor.instagram && !proveedor.sitio_web && (
            <p className="mt-3 text-sm text-slate-500">
              Este profesional aún no publicó canales de contacto en el perfil.
            </p>
          )}
        </section>

        <MarketplaceSolicitudContacto
          proveedorId={proveedor.id}
          slug={proveedor.slug}
          isLoggedIn={Boolean(user)}
          mostrar={esPublico && !esDueno}
        />

        <div className="mt-10 flex flex-wrap gap-4 border-t border-white/10 pt-8 text-sm">
          <Link href="/marketplace" className="text-teal-400 hover:text-teal-300">
            ← Volver al marketplace
          </Link>
          {esDueno && (
            <Link href="/proveedor" className="text-slate-400 hover:text-white">
              Panel de proveedor
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

function MedioCard({ medio }: { medio: ProveedorMedio }) {
  if (medio.tipo === "video") {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <video
          src={medio.url_publica}
          controls
          playsInline
          className="aspect-video w-full object-cover"
          preload="metadata"
        />
        {medio.alt && <p className="p-2 text-xs text-slate-500">{medio.alt}</p>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40">
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={medio.url_publica}
          alt={medio.alt ?? "Foto del proveedor"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}
