"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { isSuperAdmin } from "@/lib/auth-helpers";
import { decideClaimResult } from "@/lib/admin-identity.mjs";
import { claimTournamentWithAccessCode } from "@/lib/db";
import { useRouter } from "next/navigation";
import { AdminGatekeeper } from "@/components/features/AdminGatekeeper";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || loading) return;
    let cancelled = false;

    const continueToApp = async () => {
      const unlockedId = typeof window !== "undefined" ? sessionStorage.getItem("admin_unlocked_tournament_id") : null;
      const savedPin = typeof window !== "undefined" ? sessionStorage.getItem("admin_unlocked_pin") : null;
      let destinationId = unlockedId;

      if (savedPin) {
        const result = await claimTournamentWithAccessCode(unlockedId || "", user.email || "", savedPin);
        if (cancelled) return;
        const decision = decideClaimResult(result, unlockedId || "");
        if (!decision.proceed) {
          setClaimError(decision.message);
          return;
        }
        sessionStorage.removeItem("admin_unlocked_pin");
        destinationId = decision.tournamentId || unlockedId;
      }

      if (cancelled) return;
      if (isSuperAdmin(user)) {
        router.push("/superadmin");
      } else if (destinationId && destinationId !== "superadmin-root") {
        router.push(`/tournament/${destinationId}/games`);
      } else {
        router.push("/admin");
      }
    };

    continueToApp();
    return () => {
      cancelled = true;
    };
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  return (
    <div className="py-8">
      <AdminGatekeeper
        title="Acceso Administrativo"
        subtitle="Ingresa el Código o PIN Único de administración para acceder a la gestión de tu torneo."
        externalError={claimError}
      />
    </div>
  );
}
