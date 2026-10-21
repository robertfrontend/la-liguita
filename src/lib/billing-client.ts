import { auth } from "@/lib/firebase";

async function authHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!auth?.currentUser) throw new Error("Debes iniciar sesión.");
  headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  return headers;
}

async function postBilling(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "No se pudo completar la solicitud de facturación.");
  }
  return data as { url?: string };
}

export async function startCheckout(tournamentId: string, plan: "pro" | "club", interval: "month" | "season" | "year") {
  const data = await postBilling("/api/billing/checkout", { tournamentId, plan, interval });
  if (!data.url) throw new Error("Stripe no devolvió la URL de pago.");
  return data.url;
}

export async function openBillingPortal(tournamentId: string) {
  const data = await postBilling("/api/billing/portal", { tournamentId });
  if (!data.url) throw new Error("Stripe no devolvió el portal de facturación.");
  return data.url;
}
