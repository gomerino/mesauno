import Link from "next/link";

type Props = {
  /** Sustituye o amplía clases del enlace (p. ej. `mb-2` en vistas compactas). */
  className?: string;
};

export function PanelBackLink({ className = "" }: Props) {
  return (
    <Link
      href="/panel"
      className={`mb-3 inline-flex text-sm text-white/50 transition-colors hover:text-white ${className}`.trim()}
    >
      ← Volver al panel
    </Link>
  );
}
