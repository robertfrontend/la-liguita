import { LiveScoreboard } from "@/components/features/LiveScoreboard";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function GamePage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <LiveScoreboard params={params} />
    </ProtectedRoute>
  );
}
