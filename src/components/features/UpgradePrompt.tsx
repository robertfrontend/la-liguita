"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tournament } from "@/types/tournament";
import { subscribeToTournament } from "@/lib/db";
import { getPlanLimits, PlanLimits } from "@/lib/plans.mjs";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function UpgradePrompt({
  tournamentId,
  children,
}: {
  tournamentId: string;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <p className="text-xs text-amber-100 leading-relaxed">{children}</p>
      <Link
        href={`/tournament/${tournamentId}/billing`}
        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0"
      >
        {t("billing.upgradeCta")}
      </Link>
    </div>
  );
}

export function PlanFeatureBanner({
  tournamentId,
  feature,
}: {
  tournamentId: string;
  feature: "liveScoreboard" | "statsLeaders";
}) {
  const { t } = useLanguage();
  const [limits, setLimits] = useState<PlanLimits | null>(null);

  useEffect(() => {
    if (!tournamentId) return;
    return subscribeToTournament(tournamentId, (tournament: Tournament | null) => {
      setLimits(tournament ? getPlanLimits(tournament) : null);
    });
  }, [tournamentId]);

  if (!limits || limits[feature]) return null;
  const message = feature === "liveScoreboard" ? t("billing.featureLive") : t("billing.featureStats");
  return <UpgradePrompt tournamentId={tournamentId}>{message}</UpgradePrompt>;
}
