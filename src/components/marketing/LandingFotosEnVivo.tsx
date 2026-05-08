import { Card } from "@/components/jurnex-ui";
import { Camera, Images, Radio } from "lucide-react";

const cardBlock =
  "flex min-h-[200px] flex-col rounded-2xl border border-white/[0.12] bg-white/[0.07] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition duration-200 hover:border-teal-500/35 hover:shadow-jurnex-glow sm:min-h-[220px]";

const iconWrap =
  "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-teal-500/25 to-jurnex-secondary/15 text-teal-100 ring-1 ring-teal-400/25";

export function LandingFotosEnVivo() {
  return (
    <section
      id="fotos-en-vivo"
      className="border-b border-jurnex-border bg-jurnex-bg px-4 py-16 sm:py-24"
      aria-labelledby="fotos-en-vivo-title"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="fotos-en-vivo-title"
          className="text-center font-display text-2xl font-bold text-jurnex-text-primary sm:text-3xl"
        >
          Cada momento se vive y se comparte
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm font-medium leading-relaxed text-jurnex-text-primary/88 sm:text-base">
          Durante el evento, tus invitados pueden compartir fotos en tiempo real desde cada momento del programa.
        </p>

        <div className="mx-auto mt-10 max-w-lg">
          <Card
            interactive={false}
            padded={false}
            className="rounded-2xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
          >
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-jurnex-text-muted">
              Ejemplo · programa del día
            </p>
            <ul className="mt-4 space-y-3">
              <li className="rounded-xl border border-teal-500/35 bg-teal-500/[0.08] px-4 py-3 ring-1 ring-teal-400/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-jurnex-text-primary">Ceremonia</p>
                    <p className="text-[11px] text-jurnex-text-primary/70">16:30</p>
                  </div>
                  <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-100">
                    Momento en curso
                  </span>
                </div>
                <p className="mt-2 text-xs text-jurnex-text-primary/82">
                  <span className="font-semibold text-teal-100">8</span> fotos compartidas · invitados capturando
                  momentos
                </p>
              </li>
              <li className="rounded-xl border border-white/[0.08] bg-jurnex-bg/40 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-jurnex-text-primary/90">Fiesta</p>
                    <p className="text-[11px] text-jurnex-text-primary/55">20:00</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-jurnex-text-primary/60">Aún sin fotos compartidas en este momento</p>
              </li>
            </ul>
            <p className="mt-3 text-center text-[11px] text-jurnex-text-muted">
              Así se ve la energía del día: cada hito con sus recuerdos, listos para revivir el evento.
            </p>
          </Card>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3 sm:gap-5">
          <Card interactive={false} padded={false} className={cardBlock}>
            <span className={iconWrap}>
              <Camera className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-base font-semibold text-jurnex-text-primary sm:text-lg">
              Fotos en tiempo real
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-jurnex-text-primary/82 sm:text-[15px]">
              Tus invitados comparten fotos directamente desde cada momento del evento.
            </p>
          </Card>
          <Card interactive={false} padded={false} className={cardBlock}>
            <span className={iconWrap}>
              <Radio className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-base font-semibold text-jurnex-text-primary sm:text-lg">
              Participación en vivo
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-jurnex-text-primary/82 sm:text-[15px]">
              No solo asisten, interactúan con la experiencia.
            </p>
          </Card>
          <Card interactive={false} padded={false} className={cardBlock}>
            <span className={iconWrap}>
              <Images className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-base font-semibold text-jurnex-text-primary sm:text-lg">
              Recuerdos organizados
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-jurnex-text-primary/82 sm:text-[15px]">
              Cada momento guarda sus propias fotos automáticamente.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
