"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { isSuperAdmin } from "@/lib/auth-helpers";
import { claimTournamentWithAccessCode } from "@/lib/db";
import { useRouter } from "next/navigation";
import { AdminGatekeeper } from "@/components/features/AdminGatekeeper";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || loading) return;
    let cancelled = false;

    const continueToApp = async () => {
      const unlockedId = typeof window !== "undefined" ? sessionStorage.getItem("admin_unlocked_tournament_id") : null;
      const savedPin = typeof window !== "undefined" ? sessionStorage.getItem("admin_unlocked_pin") : null;
      if (savedPin && unlockedId && unlockedId !== "superadmin-root") {
        await claimTournamentWithAccessCode(unlockedId, user.email || "", savedPin);
        sessionStorage.removeItem("admin_unlocked_pin");
      }
      if (cancelled) return;
      if (isSuperAdmin(user)) {
        router.push("/superadmin");
      } else if (unlockedId && unlockedId !== "superadmin-root") {
        router.push(`/tournament/${unlockedId}/games`);
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
      />
    </div>
  );
}
