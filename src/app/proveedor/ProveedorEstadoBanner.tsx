import Link from "next/link";
import {
  MOTIVOS_SUSPENSION,
  parseMotivoSuspension,
} from "@/lib/proveedores";

export function BannerEstado({
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
          Todavía no es visible en el marketplace. Te avisamos por correo en máximo 48 horas.
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
          <Link href={`/marketplace/${slug}`} className="underline hover:text-white">
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
