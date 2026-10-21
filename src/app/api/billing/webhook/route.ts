import { NextRequest, NextResponse } from "next/server";
import { applyWebhookEvent, constructWebhookEvent } from "@/lib/server/billing.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  try {
    const event = constructWebhookEvent(payload, signature);
    const result = await applyWebhookEvent(event);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === "number" ? (error as { status: number }).status : 400;
    const message = error instanceof Error ? error.message : "Webhook inválido.";
    console.error("billing webhook failed", message);
    return NextResponse.json({ message }, { status });
  }
}
