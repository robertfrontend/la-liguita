import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/server/tournament-access.mjs";
import { releaseLeagueSlotForTournament } from "@/lib/server/billing.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { tournamentId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const decoded = await verifyIdToken(request.headers.get("authorization"));
  if (!decoded?.uid) {
    return NextResponse.json({ message: "Inicia sesión para continuar." }, { status: 401 });
  }
  const tournamentId = typeof body.tournamentId === "string" ? body.tournamentId : "";
  if (!tournamentId) {
    return NextResponse.json({ message: "Falta el torneo." }, { status: 400 });
  }

  try {
    const result = await releaseLeagueSlotForTournament(tournamentId, decoded);
    if (!result.ok) {
      const message = result.status === 404 ? "Torneo no encontrado." : "No puedes liberar este cupo.";
      return NextResponse.json({ message }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo liberar el cupo.";
    console.error("billing release failed", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
