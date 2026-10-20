import { NextRequest, NextResponse } from "next/server";
import { setTournamentAccessCode, verifyIdToken } from "@/lib/server/tournament-access.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { tournamentId?: unknown; code?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const tournamentId = typeof body.tournamentId === "string" ? body.tournamentId.trim() : "";
  const code = typeof body.code === "string" ? body.code : "";
  if (!tournamentId || !code.trim()) {
    return NextResponse.json({ message: "Faltan el torneo o el código." }, { status: 400 });
  }

  try {
    const decoded = await verifyIdToken(request.headers.get("authorization"));
    if (!decoded) {
      return NextResponse.json({ message: "Debes iniciar sesión." }, { status: 401 });
    }
    const result = await setTournamentAccessCode(tournamentId, code, decoded);
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status });
    }
    return NextResponse.json({ code: result.code });
  } catch (error) {
    console.error("access-code set failed", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { message: "No se pudo guardar el código. Revisa la configuración del servidor." },
      { status: 500 }
    );
  }
}
