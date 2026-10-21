"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tournament } from "@/types/tournament";
import { subscribeToTournament } from "@/lib/db";
import { BillingPanel } from "@/components/features/BillingPanel";
import { Loader2 } from "lucide-react";

export default function TournamentBillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Cargando plan...</div>}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const params = useParams();
  const tournamentId = params?.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    if (!tournamentId) return;
    return subscribeToTournament(tournamentId, setTournament);
  }, [tournamentId]);

  if (!tournament) {
    return (
      <div className="p-8 text-center text-zinc-500 flex items-center justify-center gap-2">
        <Loader2 className="animate-spin text-emerald-500" size={16} />
        <span>Cargando plan y facturación...</span>
      </div>
    );
  }

  return <BillingPanel tournament={tournament} />;
}
