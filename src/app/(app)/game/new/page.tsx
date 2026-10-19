import { GameSetup } from "@/components/features/GameSetup";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function NewGamePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <GameSetup />
      </div>
    </ProtectedRoute>
  );
}
