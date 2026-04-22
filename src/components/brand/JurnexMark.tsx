import { JURNEX_BRAND, type JurnexLogoVariant } from "@/components/brand/jurnex-assets";

type Props = {
  variant: JurnexLogoVariant;
  className?: string;
  /** Si el icono va junto a texto, podés usar alt vacío. */
  alt?: string;
};

const defaultSize: Record<JurnexLogoVariant, { w: number; h: number }> = {
  simplified: { w: 256, h: 256 },
  icon: { w: 48, h: 48 },
  fullPng: { w: 400, h: 400 },
  mono: { w: 256, h: 256 },
};

/**
 * Marca Jurnex: navbar = simplified, panel = icon (+ texto aparte), landing = full PNG (fallback simplified), mono = fondos oscuros.
 */
export function JurnexMark({ variant, className, alt = "Jurnex" }: Props) {
  if (variant === "fullPng") {
    const { w, h } = defaultSize.fullPng;
    return (
      <picture>
        <source srcSet={JURNEX_BRAND.logos.fullPng} type="image/png" />
        <img
          src={JURNEX_BRAND.logos.simplified}
          alt={alt}
          width={w}
          height={h}
          className={className}
          decoding="async"
        />
      </picture>
    );
  }

  const { w, h } = defaultSize[variant];
  const src = JURNEX_BRAND.logos[variant];
  return <img src={src} alt={alt} width={w} height={h} className={className} decoding="async" />;
}
