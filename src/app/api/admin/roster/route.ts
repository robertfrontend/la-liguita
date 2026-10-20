import { NextRequest, NextResponse } from "next/server";
import { syncTournamentAdmins, verifyIdToken } from "@/lib/server/tournament-access.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { tournamentId?: unknown; adminEmails?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const tournamentId = typeof body.tournamentId === "string" ? body.tournamentId.trim() : "";
  if (!tournamentId || !Array.isArray(body.adminEmails)) {
    return NextResponse.json({ message: "Faltan el torneo o la lista de administradores." }, { status: 400 });
  }

  const decoded = await verifyIdToken(request.headers.get("authorization"));
  if (!decoded) {
    return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
  }

  try {
    const result = await syncTournamentAdmins(tournamentId, body.adminEmails, decoded);
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status || 400 });
    }
    return NextResponse.json({ adminEmails: result.adminEmails, adminUids: result.adminUids });
  } catch (error) {
    console.error("roster sync failed", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { message: "No se pudo actualizar los administradores." },
      { status: 500 }
    );
  }
}
