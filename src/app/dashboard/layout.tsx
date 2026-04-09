import { DashboardToaster } from "@/components/dashboard/DashboardToaster";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DashboardToaster />
    </>
  );
}
