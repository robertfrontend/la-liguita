import { PublicLeaderboard } from "@/components/features/PublicLeaderboard";

export default async function PublicLeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <PublicLeaderboard leagueId={resolvedParams.id} />
  );
}
