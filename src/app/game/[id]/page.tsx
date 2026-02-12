import { LiveScoreboard } from "@/components/features/LiveScoreboard";

export default function GamePage({ params }: { params: { id: string } }) {
  return <LiveScoreboard params={params} />;
}
