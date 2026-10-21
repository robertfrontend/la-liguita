import { NextRequest, NextResponse } from "next/server";
import { createPortalSession, requireTournamentManager } from "@/lib/server/billing.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { tournamentId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const tournamentId = typeof body.tournamentId === "string" ? body.tournamentId : "";
  try {
    const { tournament } = await requireTournamentManager(request, tournamentId);
    const session = await createPortalSession({ tournament });
    return NextResponse.json(session);
  } catch (error) {
    const status = typeof (error as { status?: number }).status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : "No se pudo abrir el portal de facturación.";
    if (status >= 500) console.error("billing portal failed", message);
    return NextResponse.json({ message }, { status });
  }
}
