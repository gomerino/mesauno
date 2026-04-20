"use client";

import { markInvitacionVistaAction } from "@/app/invitacion/actions";
import { useEffect, useRef } from "react";

type Props = { accessToken: string };

/** Registra la apertura de la invitación en segundo plano, sin bloquear la carga de la página. */
export function InvitacionViewTracker({ accessToken }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void markInvitacionVistaAction(accessToken);
  }, [accessToken]);

  return null;
}
