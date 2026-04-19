import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  labelCategoria,
  labelRegion,
  obtenerProveedorPropio,
  parseMotivoSuspension,
  MOTIVOS_SUSPENSION,
} from "@/lib/proveedores";
import type { ProveedorMedio } from "@/types/database";

export default async function PanelProveedorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/proveedor");
  }

  const proveedor = await obtenerProveedorPropio(supabase, user.id);

  if (!proveedor) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-2xl font-bold">
          Todavía no tienes un perfil de proveedor
        </h1>
        <p className="mt-4 text-slate-400">
          Regístrate en menos de 5 minutos para aparecer en el marketplace.
        </p>
        <Link
          href="/para-proveedores/registro"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-200"
        >
          Comenzar registro
        </Link>
      </div>
    );
  }

  const { data: mediosRaw } = await supabase
    .from("proveedor_medios")
    .select("*")
    .eq("proveedor_id", proveedor.id)
    .order("orden", { ascending: true });
  const medios = (mediosRaw ?? []) as ProveedorMedio[];

  return (
    <div className="space-y-6">
      <BannerEstado
        estado={proveedor.estado}
        motivoStored={proveedor.motivo_suspension}
        slug={proveedor.slug}
      />

      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-amber-200">
            {labelCategoria(proveedor.categoria_principal)} · {labelRegion(proveedor.region)}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
            {proveedor.nombre_negocio}
          </h1>
          {proveedor.eslogan && (
            <p className="mt-1 text-slate-300">{proveedor.eslogan}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/para-proveedores"
            className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-300 hover:border-white/30 hover:text-white"
          >
            Ver landing pública
          </Link>
          {proveedor.estado === "aprobado" && (
            <Link
              href={`/marketplace/${proveedor.slug}`}
              className="rounded-full bg-amber-300 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-200"
            >
              Ver mi perfil público →
            </Link>
          )}
        </div>
      </header>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-8">
        <h2 className="font-display text-lg font-semibold">Datos del perfil</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <Item label="Email" value={proveedor.email} />
          <Item label="WhatsApp" value={proveedor.whatsapp} />
          <Item
            label="Instagram"
            value={proveedor.instagram ? `@${proveedor.instagram}` : null}
          />
          <Item label="Sitio web" value={proveedor.sitio_web} />
          <Item label="Ciudad" value={proveedor.ciudad} />
          <Item
            label="Slug público"
            value={`/marketplace/${proveedor.slug}`}
          />
          <Item
            label="Plan"
            value={
              proveedor.plan === "premium" ? "Premium ✨" : "Free"
            }
          />
          <Item label="Solicitudes este mes" value={String(proveedor.solicitudes_mes)} />
        </dl>
        {proveedor.biografia && (
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tu historia
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
              {proveedor.biografia}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            Fotos ({medios.length})
          </h2>
          <p className="text-xs text-slate-500">
            {proveedor.plan === "free" ? "Plan free: hasta 6" : "Sin límite"}
          </p>
        </div>
        {medios.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
            Todavía no has subido fotos. Podrás hacerlo desde el panel completo (disponible en M03).
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {medios.map((m, idx) => (
              <div
                key={m.id}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url_publica}
                  alt={m.alt ?? proveedor.nombre_negocio}
                  className="h-full w-full object-cover"
                />
                {idx === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-semibold text-slate-950">
                    PORTADA
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-amber-300/20 bg-amber-300/5 p-6 text-sm text-slate-200 md:p-8">
        <p className="font-semibold text-amber-200">Próximamente (M03)</p>
        <p className="mt-2">
          El panel editable completo (fotos con drag & drop, servicios con
          precios, reordenar portafolio, ver solicitudes recibidas) está en
          desarrollo. Si necesitas ajustar algo ahora, responde al correo de
          bienvenida y lo hacemos manualmente.
        </p>
      </section>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-slate-100">{value || "—"}</dd>
    </div>
  );
}

function BannerEstado({
  estado,
  motivoStored,
  slug,
}: {
  estado: "pendiente" | "aprobado" | "suspendido";
  motivoStored: string | null;
  slug: string;
}) {
  if (estado === "pendiente") {
    return (
      <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-5">
        <p className="flex items-center gap-2 font-display text-lg font-semibold text-amber-100">
          <span>✈️</span> Estamos revisando tu perfil
        </p>
        <p className="mt-1 text-sm text-amber-100/80">
          Todavía no es visible en el marketplace. Te avisamos por correo en
          máximo 48 horas.
        </p>
      </div>
    );
  }

  if (estado === "aprobado") {
    return (
      <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-5">
        <p className="flex items-center gap-2 font-display text-lg font-semibold text-emerald-100">
          <span>🎉</span> Tu perfil está visible
        </p>
        <p className="mt-1 text-sm text-emerald-100/80">
          Las parejas ya pueden descubrirte en el marketplace.{" "}
          <Link
            href={`/marketplace/${slug}`}
            className="underline hover:text-white"
          >
            Ver cómo te ven
          </Link>
          .
        </p>
      </div>
    );
  }

  const { motivo, detalle } = parseMotivoSuspension(motivoStored);
  const motivoLabel =
    motivo && MOTIVOS_SUSPENSION.find((m) => m.value === motivo)?.label;

  return (
    <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5">
      <p className="flex items-center gap-2 font-display text-lg font-semibold text-rose-100">
        <span>🔒</span> Necesitamos más información para activarte
      </p>
      <p className="mt-1 text-sm text-rose-100/80">
        {motivoLabel ?? "Tu perfil está en pausa."}
        {detalle ? ` · ${detalle}` : ""}
      </p>
      <p className="mt-2 text-xs text-rose-200/70">
        Escríbenos a{" "}
        <a href="mailto:hola@jurnex.cl" className="underline">
          hola@jurnex.cl
        </a>{" "}
        con los ajustes y lo revisamos nuevamente.
      </p>
    </div>
  );
}
