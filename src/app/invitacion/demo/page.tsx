import { DemoInvitacionShell } from "@/components/demo/DemoInvitacionShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo invitación — Dreams Wedding",
  description: "Vista previa interactiva estilo boarding pass.",
};

type Props = {
  searchParams: Promise<{ embed?: string }>;
};

export default async function InvitacionDemoPage({ searchParams }: Props) {
  const { embed } = await searchParams;
  return <DemoInvitacionShell embed={embed === "1"} />;
}
