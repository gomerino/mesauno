import { JourneyViajeClient } from "@/components/panel/JourneyViajeClient";
import { PanelThemeSelector } from "@/components/panel/PanelThemeSelector";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";

export async function JourneyHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const bundle = await loadPanelProgressBundle(supabase, user.id);
  const emailsEnviados = bundle.invitados.filter((r) => r.email_enviado === true).length;

  return (
    <>
      <JourneyViajeClient
        evento={bundle.evento}
        invitadosCount={bundle.invitados.length}
        emailsEnviados={emailsEnviados}
      />

      <div className="mt-12 border-t border-white/10 pt-8">
        <PanelThemeSelector />
      </div>
    </>
  );
}
