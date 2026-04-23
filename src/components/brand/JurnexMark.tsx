import { JURNEX_BRAND, type JurnexLogoVariant } from "@/components/brand/jurnex-assets";

type Props = {
  variant: JurnexLogoVariant;
  className?: string;
  /** Si el icono va junto a texto, podés usar alt vacío. */
  alt?: string;
};

const PNG = JURNEX_BRAND.logos.fullPng;
const defaultSize: Record<JurnexLogoVariant, { w: number; h: number }> = {
  /** Misma pieza que fullPng (raster 1024²) */
  simplified: { w: 1024, h: 1024 },
  icon: { w: 48, h: 48 },
  fullPng: { w: 1024, h: 1024 },
  mono: { w: 256, h: 256 },
};

/**
 * Marca Jurnex: círculo en PNG (`fullPng` / `simplified`), panel = `icon`, `mono` = blanco.
 */
export function JurnexMark({ variant, className, alt = "Jurnex" }: Props) {
  if (variant === "fullPng" || variant === "simplified") {
    const { w, h } = defaultSize[variant];
    return <img src={PNG} alt={alt} width={w} height={h} className={className} decoding="async" />;
  }

  const { w, h } = defaultSize[variant];
  const src = JURNEX_BRAND.logos[variant];
  return <img src={src} alt={alt} width={w} height={h} className={className} decoding="async" />;
}
