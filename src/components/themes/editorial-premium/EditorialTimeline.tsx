import { eventoFotoPublicUrl } from "@/lib/evento-foto-url";
import type { ProgramaHitoFotoPublic } from "@/lib/programa-con-fotos-publica";
import type { EventoProgramaHito } from "@/types/database";
import styles from "./editorial.module.css";

type Props = {
  hitos: EventoProgramaHito[];
  liveIndex: number;
  nextIndex: number;
  fotosPorHito?: Record<string, ProgramaHitoFotoPublic[]>;
};

export function EditorialTimeline({ hitos, liveIndex, nextIndex, fotosPorHito }: Props) {
  return <section aria-label="Programa del evento" className={styles.timeline}>
    <p className={styles.timelineIntro}>Cada momento, junto a ustedes</p>
    <ol>
      {hitos.map((hito, index) => <li key={hito.id} aria-current={index === liveIndex ? "step" : undefined}>
        <time dateTime={hito.hora}>{hito.hora.slice(0, 5)}</time>
        <div className={styles.timelineMoment}>
          {index === liveIndex ? <span className={styles.timelineBadge}>Ahora</span> : index === nextIndex ? <span className={styles.timelineBadge}>Próximo</span> : null}
          <h3>{hito.titulo}</h3>
          {hito.descripcion_corta && <p>{hito.descripcion_corta}</p>}
          {hito.lugar_nombre && <p className={styles.timelinePlace}>{hito.lugar_nombre}</p>}
          {hito.ubicacion_url?.trim() && <a className={styles.timelineMap} href={hito.ubicacion_url.trim()} target="_blank" rel="noopener noreferrer">Ver ubicación <span aria-hidden>↗</span></a>}
          {!!fotosPorHito?.[hito.id]?.length && <ul className={styles.timelinePhotos} aria-label="Recuerdos de este momento">
            {fotosPorHito[hito.id].map((foto, photoIndex) => <li key={foto.id}><a href={eventoFotoPublicUrl(foto.storage_path)} target="_blank" rel="noopener noreferrer" aria-label={`Abrir fotografía ${photoIndex + 1} de ${hito.titulo}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={eventoFotoPublicUrl(foto.storage_path)} alt="" width={72} height={72} loading="lazy" />
            </a></li>)}
          </ul>}
        </div>
      </li>)}
    </ol>
  </section>;
}
