"use client";

import { SpeakerPortalSteps } from "@/components/speakers/speaker-portal-steps";

export default function SpeakerPortalPage({
  params,
}: {
  params: { token: string };
}) {
  return <SpeakerPortalSteps token={params.token} />;
}
