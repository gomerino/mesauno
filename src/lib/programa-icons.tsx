import type { LucideIcon } from "lucide-react";
import {
  Camera,
  Church,
  DoorOpen,
  Gift,
  GlassWater,
  Mic,
  Music,
  PlaneLanding,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

export const TIPOS_MOMENTO = [
  "llegada",
  "ceremonia",
  "recepcion",
  "comida",
  "fiesta",
  "foto",
  "mensaje",
  "momento_especial",
  "regalo",
  "cierre",
  "otro",
] as const;
export type TipoMomentoId = (typeof TIPOS_MOMENTO)[number];

export const TIPO_MOMENTO_OPCIONES_FORM: Array<{
  id: Exclude<TipoMomentoId, "otro">;
  emoji: string;
  label: string;
}> = [
  { id: "ceremonia", emoji: "⛪", label: "Ceremonia" },
  { id: "recepcion", emoji: "🥂", label: "Recepción" },
  { id: "comida", emoji: "🍽", label: "Comida" },
  { id: "fiesta", emoji: "🎵", label: "Fiesta" },
  { id: "llegada", emoji: "🛂", label: "Llegada" },
  { id: "foto", emoji: "📸", label: "Fotos" },
  { id: "mensaje", emoji: "🎤", label: "Mensaje" },
  { id: "momento_especial", emoji: "🎁", label: "Especial" },
  { id: "regalo", emoji: "🛍", label: "Regalos" },
  { id: "cierre", emoji: "🛬", label: "Cierre" },
];

export const PROGRAMA_ICONOS = [
  "DoorOpen",
  "Church",
  "GlassWater",
  "UtensilsCrossed",
  "Music",
  "Camera",
  "Mic",
  "Gift",
  "ShoppingBag",
  "PlaneLanding",
] as const;
export type ProgramaIconoId = (typeof PROGRAMA_ICONOS)[number];

const MAP: Record<ProgramaIconoId, LucideIcon> = {
  DoorOpen,
  Church,
  GlassWater,
  UtensilsCrossed,
  Music,
  Camera,
  Mic,
  Gift,
  ShoppingBag,
  PlaneLanding,
};

export function ProgramaIconoLucide({
  nombre,
  className,
}: {
  nombre: string;
  className?: string;
}) {
  const legacy =
    nombre === "Beer" ? "GlassWater" : nombre === "Utensils" ? "UtensilsCrossed" : nombre;
  const key = (PROGRAMA_ICONOS as readonly string[]).includes(legacy)
    ? (legacy as ProgramaIconoId)
    : "Music";
  const Icon = MAP[key];
  return <Icon className={className} aria-hidden />;
}

export function programaIconoLabel(id: ProgramaIconoId): string {
  switch (id) {
    case "DoorOpen":
      return "Llegada";
    case "Church":
      return "Ceremonia";
    case "GlassWater":
      return "Recepción";
    case "UtensilsCrossed":
      return "Comida";
    case "Music":
      return "Fiesta";
    case "Camera":
      return "Fotos";
    case "Mic":
      return "Mensaje";
    case "Gift":
      return "Momento especial";
    case "ShoppingBag":
      return "Regalos";
    case "PlaneLanding":
      return "Cierre";
    default:
      return id;
  }
}

export function normalizarTipoMomento(valor: string | null | undefined): TipoMomentoId {
  if (!valor) return "otro";
  return (TIPOS_MOMENTO as readonly string[]).includes(valor) ? (valor as TipoMomentoId) : "otro";
}

export function getIconoMomento(tipo_momento: string | null | undefined): ProgramaIconoId {
  switch (normalizarTipoMomento(tipo_momento)) {
    case "llegada":
      return "DoorOpen";
    case "ceremonia":
      return "Church";
    case "recepcion":
      return "GlassWater";
    case "comida":
      return "UtensilsCrossed";
    case "fiesta":
      return "Music";
    case "foto":
      return "Camera";
    case "mensaje":
      return "Mic";
    case "momento_especial":
      return "Gift";
    case "regalo":
      return "ShoppingBag";
    case "cierre":
      return "PlaneLanding";
    default:
      return "Gift";
  }
}
