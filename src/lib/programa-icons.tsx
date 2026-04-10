import type { LucideIcon } from "lucide-react";
import { Beer, Church, Music, Utensils } from "lucide-react";

export const PROGRAMA_ICONOS = ["Church", "Beer", "Utensils", "Music"] as const;
export type ProgramaIconoId = (typeof PROGRAMA_ICONOS)[number];

const MAP: Record<ProgramaIconoId, LucideIcon> = {
  Church,
  Beer,
  Utensils,
  Music,
};

export function ProgramaIconoLucide({
  nombre,
  className,
}: {
  nombre: string;
  className?: string;
}) {
  const key = (PROGRAMA_ICONOS as readonly string[]).includes(nombre)
    ? (nombre as ProgramaIconoId)
    : "Music";
  const Icon = MAP[key];
  return <Icon className={className} aria-hidden />;
}

export function programaIconoLabel(id: ProgramaIconoId): string {
  switch (id) {
    case "Church":
      return "Ceremonia / Iglesia";
    case "Beer":
      return "Coctel / Bar";
    case "Utensils":
      return "Banquete";
    case "Music":
      return "Música / Fiesta";
    default:
      return id;
  }
}
