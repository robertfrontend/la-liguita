import { ipAddress } from "@vercel/functions";
import { NextRequest, NextResponse } from "next/server";
import { trustedClientIp } from "@/lib/server/access-attempts.mjs";
import {
  consumeAccessAttempt,
  verifyAccessCode,
  verifyIdToken,
} from "@/lib/server/tournament-access.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: NextRequest) {
  const withIp = request as NextRequest & { ip?: string | null };
  let vercelIp = "";
  try {
    vercelIp = ipAddress(request) || "";
  } catch {
    vercelIp = "";
  }
  return trustedClientIp({
    headers: request.headers,
    requestIp: withIp.ip || "",
    vercelIp,
  });
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
  const decoded = await verifyIdToken(request.headers.get("authorization"));
  if (!decoded?.uid) {
    return NextResponse.json(
      { valid: false, message: "Inicia sesión para validar el código de acceso." },
      { status: 401 }
    );
  }

  try {
    const attempt = await consumeAccessAttempt({ uid: decoded.uid, ip: clientIp(request) });
    if (!attempt.allowed) {
      const retryAfter = Math.max(1, Math.ceil((attempt.retryAfterMs || 0) / 1000));
      return NextResponse.json(
        { valid: false, message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const result = await verifyAccessCode({ rawCode: code, decoded, claim });
    const status = result.status || 200;
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
