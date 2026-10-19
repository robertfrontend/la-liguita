import type { Metadata } from "next";
import { PublicTournamentPortal } from "@/components/features/PublicTournamentPortal";
import { getTournamentBySlugOrId } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const tournament = await getTournamentBySlugOrId(resolvedParams.id);

  if (!tournament) {
    return {
      title: "Torneo Oficial",
    };
  }

  const title = tournament.name;
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
      card: tournament.logoUrl ? "summary" : "summary",
      title,
      images: tournament.logoUrl ? [tournament.logoUrl] : [],
    },
  };
}

export default async function PublicTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <PublicTournamentPortal tournamentId={resolvedParams.id} />;
}
