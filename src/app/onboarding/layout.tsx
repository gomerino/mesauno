import { SiteHeader } from "@/components/SiteHeader";

export default function OnboardingJourneyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1222] via-[#0f172a] to-[#020617]">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:pt-12">{children}</div>
    </div>
  );
}
