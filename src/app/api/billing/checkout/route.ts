import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, requireTournamentManager } from "@/lib/server/billing.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { tournamentId?: unknown; plan?: unknown; interval?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const tournamentId = typeof body.tournamentId === "string" ? body.tournamentId : "";
  const plan = typeof body.plan === "string" ? body.plan : "";
  const interval = typeof body.interval === "string" ? body.interval : "";

  try {
    const { decoded, tournament } = await requireTournamentManager(request, tournamentId);
    const session = await createCheckoutSession({ tournament, decoded, plan, interval });
    return NextResponse.json(session);
  } catch (error) {
    const status = typeof (error as { status?: number }).status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : "No se pudo abrir el pago.";
    if (status >= 500) console.error("billing checkout failed", message);
    return NextResponse.json({ message }, { status });
  }
}
