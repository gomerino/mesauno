"use client";

import { Toaster } from "sonner";

export function DashboardToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-center"
      toastOptions={{ duration: 4000 }}
    />
  );
}
