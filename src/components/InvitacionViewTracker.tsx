"use client";

import { markInvitacionVistaAction } from "@/app/invitacion/actions";
import { useEffect, useRef } from "react";

type Props = { accessToken: string };

/**
 * Actualización silenciosa vía RPC (sin bloquear el Server Component principal).
 */
export function InvitacionViewTracker({ accessToken }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void markInvitacionVistaAction(accessToken);
  }, [accessToken]);

  return null;
}
