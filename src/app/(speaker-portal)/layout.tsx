import { SpeakerPortalHeader } from "@/components/layout/speaker-portal-header";

export default function SpeakerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SpeakerPortalHeader />
      <main className="flex-1 container max-w-2xl py-8">{children}</main>
    </div>
  );
}
