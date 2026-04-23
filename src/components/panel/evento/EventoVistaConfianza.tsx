import Link from "next/link";

type Props = {
  themeName: string;
  themeTagline: string;
  nombreEvento: string;
  nombresPareja: string;
  fechaTexto: string;
  vistaPreviaHref: string | null;
};

/**
 * Resumen compacto “así se ve hoy” sin editar la invitación pública.
 */
export function EventoVistaConfianza({
  themeName,
  themeTagline,
  nombreEvento,
  nombresPareja,
  fechaTexto,
  vistaPreviaHref,
}: Props) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Así se ve hoy</p>
      <p className="mt-1 text-sm font-medium text-white">{nombreEvento}</p>
      <p className="mt-0.5 text-xs text-white/65">{nombresPareja}</p>
      <p className="mt-1 text-xs text-white/50">{fechaTexto}</p>
      <div className="mt-3 border-t border-white/10 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Estilo de invitación</p>
        <p className="mt-1 text-sm text-white/85">{themeName}</p>
        <p className="mt-0.5 text-xs text-white/50">{themeTagline}</p>
      </div>
      {vistaPreviaHref ? (
        <Link
          href={vistaPreviaHref}
          className="mt-3 inline-flex text-sm font-medium text-jurnex-primary transition hover:text-teal-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver vista previa →
        </Link>
      ) : (
        <p className="mt-3 text-xs text-white/45">Añadí pasajeros en Invitados para generar una vista previa.</p>
      )}
    </div>
  );
}
