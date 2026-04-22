import type { ReactNode } from "react";
import { PanelLayout } from "@/components/panel/ds/PanelLayout";

type Props = {
  children: ReactNode;
  /** Permite overridear clases en el contenedor exterior. */
  className?: string;
  /** Contenido más estrecho (max-w-4xl), útil para formularios. */
  narrow?: boolean;
};

/**
 * Contenedor de página del panel: base oscura Jurnex, ancho máximo y padding coherentes con Invitados.
 * Preferí `@/components/panel/ds` (`PanelLayout`) si necesitás importación explícita del design system.
 */
export function PanelPageContainer({ children, className = "", narrow = false }: Props) {
  return (
    <PanelLayout narrow={narrow} className={className}>
      {children}
    </PanelLayout>
  );
}
