import { LiveScoreboard } from "@/components/features/LiveScoreboard";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <ProtectedRoute>
      <LiveScoreboard gameId={resolvedParams.id} />
    </ProtectedRoute>
  );
}
