import { PublicHistory } from "@/components/features/PublicHistory";

export default async function PublicHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <PublicHistory leagueId={resolvedParams.id} />
  );
}
