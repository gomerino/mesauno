import type { BoardingPassProps } from "@/components/invitacion/BoardingPass";

/** Datos de ejemplo para marketing (mismo componente que la invitación). */
export const landingBoardingPassDemo: Pick<
  BoardingPassProps,
  "nombres" | "fecha" | "hora" | "lugar" | "codigo" | "grupo"
> = {
  nombres: "Claudia & Gonzalo",
  fecha: "19 ABR 26",
  hora: "12:00",
  lugar: "Italia",
  codigo: "MI-101",
  grupo: "Primera Clase",
};
