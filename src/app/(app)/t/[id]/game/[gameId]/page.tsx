import type { Metadata } from "next";
import { PublicGameDetail } from "@/components/features/PublicGameDetail";
import { getTournamentBySlugOrId, getTournamentGame } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const tournament = await getTournamentBySlugOrId(resolvedParams.id);
  const game = tournament ? await getTournamentGame(tournament.id, resolvedParams.gameId) : null;

  if (!tournament) {
    return {
      title: "Partido Oficial",
    };
  }

  const title = game ? `${game.teamAName} vs ${game.teamBName} | ${tournament.name}` : tournament.name;
  const images = tournament.logoUrl
    ? [
        {
          url: tournament.logoUrl,
          width: 800,
          height: 800,
          alt: tournament.name,
        },
      ]
    : [];

  return {
    title,
    openGraph: {
      title,
      type: "website",
      images,
    },
    twitter: {
      card: "summary",
      title,
      images: tournament.logoUrl ? [tournament.logoUrl] : [],
    },
  };
}

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
