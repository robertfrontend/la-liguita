"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { isSuperAdmin } from "@/lib/auth-helpers";
import {
  CLAIM_DESTINATION_STORAGE_KEY,
  decidePostLoginRedirect,
} from "@/lib/admin-identity.mjs";
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
      const savedPin = typeof window !== "undefined" ? sessionStorage.getItem("admin_unlocked_pin") : null;
      const rememberedDestination = typeof window !== "undefined"
        ? sessionStorage.getItem(CLAIM_DESTINATION_STORAGE_KEY)
        : null;
      const claim = savedPin
        ? await claimTournamentWithAccessCode("", user.email || "", savedPin)
        : null;
      if (cancelled) return;

      const redirect = decidePostLoginRedirect({
        hasPin: Boolean(savedPin),
        claim,
        rememberedDestination,
        isSuperAdmin: isSuperAdmin(user),
      });
      if (redirect.clearPin) sessionStorage.removeItem("admin_unlocked_pin");
      if (redirect.clearStoredTournamentId) sessionStorage.removeItem("admin_unlocked_tournament_id");
      if (redirect.consumeRemembered) sessionStorage.removeItem(CLAIM_DESTINATION_STORAGE_KEY);
      if (redirect.rememberedDestination) {
        sessionStorage.setItem(CLAIM_DESTINATION_STORAGE_KEY, redirect.rememberedDestination);
      }
      if (redirect.message) {
        setClaimError(redirect.message);
        return;
      }
      if (redirect.path) router.push(redirect.path);
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
