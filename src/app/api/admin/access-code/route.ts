import { NextRequest, NextResponse } from "next/server";
import {
  enforceAccessCodeRateLimit,
  verifyAccessCode,
  verifyIdToken,
} from "@/lib/server/tournament-access.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  return ip;
}

export async function POST(request: NextRequest) {
  let body: { code?: unknown; claim?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, message: "Solicitud inválida." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  const claim = body.claim === true;
  const key = `${clientKey(request)}:${claim ? "claim" : "preview"}`;
  if (!enforceAccessCodeRateLimit(key)) {
    return NextResponse.json(
      { valid: false, message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 }
    );
  }

  try {
    const decoded = await verifyIdToken(request.headers.get("authorization"));
    const result = await verifyAccessCode({ rawCode: code, decoded, claim });
    const status = result.status || (result.valid ? 200 : 200);
    return NextResponse.json(
      {
        valid: result.valid === true,
        message: result.message,
        tournament: result.tournament,
      },
      { status }
    );
  } catch (error) {
    console.error("access-code verification failed", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { valid: false, message: "No se pudo verificar el código. Revisa la configuración del servidor." },
      { status: 500 }
    );
  }
}
