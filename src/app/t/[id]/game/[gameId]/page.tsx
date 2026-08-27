import { PublicGameDetail } from "@/components/features/PublicGameDetail";

export default async function PublicGameDetailPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>;
}) {
  const resolvedParams = await params;
  return (
    <PublicGameDetail
      tournamentSlugOrId={resolvedParams.id}
      gameId={resolvedParams.gameId}
    />
  );
}
