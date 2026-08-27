import { PublicTournamentPortal } from "@/components/features/PublicTournamentPortal";

export default async function PublicTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <PublicTournamentPortal tournamentId={resolvedParams.id} />;
}
