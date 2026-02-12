import { Leaderboard } from "@/components/features/Leaderboard";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 pb-20 bg-[var(--background)]">
        <Leaderboard />
      </div>
    </ProtectedRoute>
  );
}
