import { CreateTournamentForm } from "@/components/features/CreateTournamentForm";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function NewTournamentPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-950 py-6">
        <CreateTournamentForm />
      </div>
    </ProtectedRoute>
  );
}
