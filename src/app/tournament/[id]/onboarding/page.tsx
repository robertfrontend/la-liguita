"use client";

import { useParams } from "next/navigation";
import { TournamentSetupWizard } from "@/components/features/TournamentSetupWizard";

export default function TournamentOnboardingPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  if (!tournamentId) return null;

  return <TournamentSetupWizard tournamentId={tournamentId} />;
}
