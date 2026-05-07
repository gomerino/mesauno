import { ModoDjCliente } from "@/components/panel/ModoDjCliente";

export const dynamic = "force-dynamic";

export default function DjPublicConsolePage({
  params,
  searchParams,
}: {
  params: { eventoId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams?.dj_acceso;
  const token = typeof raw === "string" ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() ?? "" : "";

  if (!token) {
    return (
      <div className="min-h-dvh bg-zinc-950 px-4 py-10 text-center text-sm text-white/75">
        <p className="font-semibold text-white">Consola DJ</p>
        <p className="mt-2 max-w-md mx-auto">
          Falta el parámetro <span className="font-mono text-white/90">dj_acceso</span> en la URL. Pedí el enlace a los
          novios.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-lg">
        <ModoDjCliente eventoId={params.eventoId.trim()} djAccesoToken={token} />
      </div>
    </div>
  );
}
