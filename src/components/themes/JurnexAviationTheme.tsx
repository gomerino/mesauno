import type { InvitacionThemePageProps } from "@/components/themes/invitacion-theme-props";
import { SoftAviationSpaShell } from "@/components/themes/soft-aviation/SoftAviationSpaShell";

/**
 * Tema Jurnex Aviation: misma experiencia en pestañas, SPA y pase que Premium Aviation,
 * con cromía de marca (oro/ámbar y marino Jurnex) vía `aviationVariant="jurnex"`.
 */
export function JurnexAviationTheme(props: InvitacionThemePageProps) {
  return <SoftAviationSpaShell {...props} aviationVariant="jurnex" />;
}
