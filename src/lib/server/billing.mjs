import Stripe from "stripe";
import {
  appBaseUrl,
  assertCheckoutSelection,
  billingFromCheckoutSession,
  billingFromInvoiceFailed,
  billingFromSubscription,
  billingFromSubscriptionDeleted,
  checkoutMode,
  lookupPriceId,
  nextLeagueAllowance,
} from "../billing-state.mjs";
import { adminDb } from "./firebase-admin.mjs";
import { callerManagesTournament, verifyIdToken } from "./tournament-access.mjs";

const TOURNAMENTS = "tournaments";

let stripeClient = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const error = new Error("STRIPE_SECRET_KEY no está configurada.");
    error.status = 500;
    throw error;
  }
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}

export function resetStripeClient() {
  stripeClient = null;
}

async function loadTournament(tournamentId) {
  const snap = await adminDb().collection(TOURNAMENTS).doc(tournamentId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

export async function requireTournamentManager(request, tournamentId) {
  const decoded = await verifyIdToken(request.headers.get("authorization"));
  if (!decoded?.uid) {
    const error = new Error("Inicia sesión para continuar.");
    error.status = 401;
    throw error;
  }
  if (!tournamentId || typeof tournamentId !== "string") {
    const error = new Error("Falta el torneo.");
    error.status = 400;
    throw error;
  }
  const tournament = await loadTournament(tournamentId);
  if (!tournament) {
    const error = new Error("Torneo no encontrado.");
    error.status = 404;
    throw error;
  }
  if (!callerManagesTournament(decoded, tournament)) {
    const error = new Error("No puedes facturar este torneo.");
    error.status = 403;
    throw error;
  }
  return { decoded, tournament };
}

async function syncOwnerAllowance(ownerId, plan, status) {
  if (!ownerId) return;
  const ref = adminDb().collection("users").doc(ownerId);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : {};
  const leagueAllowance = nextLeagueAllowance(plan, status, data);
  await ref.set(
    {
      uid: ownerId,
      leagueAllowance,
      accountPlan: plan,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function writeTournamentBilling(tournamentId, billing, ownerId) {
  await adminDb().collection(TOURNAMENTS).doc(tournamentId).set(
    {
      billing,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  if (ownerId) await syncOwnerAllowance(ownerId, billing.plan, billing.status);
}

async function findTournamentBySubscription(subscriptionId) {
  if (!subscriptionId) return null;
  const snap = await adminDb()
    .collection(TOURNAMENTS)
    .where("billing.stripeSubscriptionId", "==", subscriptionId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

async function findTournamentByCustomer(customerId) {
  if (!customerId) return null;
  const snap = await adminDb()
    .collection(TOURNAMENTS)
    .where("billing.stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

function metaTournamentId(object) {
  const id = object?.metadata?.tournamentId;
  return typeof id === "string" && id.trim() ? id.trim() : "";
}

export async function createCheckoutSession({ tournament, decoded, plan, interval }) {
  assertCheckoutSelection(plan, interval);
  const price = lookupPriceId(plan, interval);
  if (!price) {
    const error = new Error("Falta el precio de Stripe para este plan. Revisa las variables de entorno.");
    error.status = 500;
    throw error;
  }

  const stripe = getStripe();
  const base = appBaseUrl();
  const mode = checkoutMode(interval);
  const metadata = {
    tournamentId: tournament.id,
    uid: decoded.uid,
    plan,
    interval,
  };
  const customer = tournament.billing?.stripeCustomerId || "";

  const session = await stripe.checkout.sessions.create({
    mode,
    locale: "es",
    client_reference_id: tournament.id,
    line_items: [{ price, quantity: 1 }],
    success_url: `${base}/tournament/${tournament.id}/billing?checkout=success`,
    cancel_url: `${base}/tournament/${tournament.id}/billing?checkout=cancel`,
    metadata,
    ...(customer ? { customer } : decoded.email ? { customer_email: decoded.email } : {}),
    ...(mode === "subscription"
      ? { subscription_data: { metadata } }
      : { payment_intent_data: { metadata } }),
  });

  if (!session.url) {
    const error = new Error("Stripe no devolvió la URL de pago.");
    error.status = 502;
    throw error;
  }
  return { url: session.url, id: session.id };
}

export async function createPortalSession({ tournament }) {
  const customer = tournament.billing?.stripeCustomerId;
  if (!customer) {
    const error = new Error("Todavía no hay un cliente de Stripe para este torneo.");
    error.status = 400;
    throw error;
  }
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${appBaseUrl()}/tournament/${tournament.id}/billing`,
  });
  return { url: session.url };
}

async function resolveTournament(object, subscriptionId) {
  const fromMeta = metaTournamentId(object);
  if (fromMeta) {
    const tournament = await loadTournament(fromMeta);
    if (tournament) return tournament;
  }
  const bySub = await findTournamentBySubscription(subscriptionId);
  if (bySub) return bySub;
  const customer = typeof object?.customer === "string" ? object.customer : object?.customer?.id;
  return findTournamentByCustomer(customer);
}

export async function applyWebhookEvent(event, now = new Date()) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    let subscription = null;
    if (session.mode === "subscription" && session.subscription) {
      const stripe = getStripe();
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    }
    const billing = billingFromCheckoutSession(session, subscription, now);
    const tournament = await resolveTournament(session, billing.stripeSubscriptionId);
    if (!tournament) return { applied: false, reason: "tournament-not-found" };
    await writeTournamentBilling(tournament.id, billing, tournament.ownerId);
    return { applied: true, tournamentId: tournament.id, type: event.type };
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const billing = billingFromSubscription(subscription);
    if (!billing) return { applied: false, reason: "unmapped-price" };
    const tournament = await resolveTournament(subscription, subscription.id);
    if (!tournament) return { applied: false, reason: "tournament-not-found" };
    await writeTournamentBilling(tournament.id, billing, tournament.ownerId);
    return { applied: true, tournamentId: tournament.id, type: event.type };
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const billing = billingFromSubscriptionDeleted(subscription);
    const tournament = await resolveTournament(subscription, subscription.id);
    if (!tournament) return { applied: false, reason: "tournament-not-found" };
    await writeTournamentBilling(tournament.id, billing, tournament.ownerId);
    return { applied: true, tournamentId: tournament.id, type: event.type };
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : "";
    const tournament = await resolveTournament(invoice, subscriptionId);
    if (!tournament) return { applied: false, reason: "tournament-not-found" };
    const billing = billingFromInvoiceFailed(tournament.billing, invoice);
    await writeTournamentBilling(tournament.id, billing, tournament.ownerId);
    return { applied: true, tournamentId: tournament.id, type: event.type };
  }

  return { applied: false, reason: "ignored" };
}

export function constructWebhookEvent(payload, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    const error = new Error("STRIPE_WEBHOOK_SECRET no está configurada.");
    error.status = 500;
    throw error;
  }
  if (!signature) {
    const error = new Error("Falta la firma de Stripe.");
    error.status = 400;
    throw error;
  }
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}

export async function releaseLeagueSlot(ownerId) {
  if (!ownerId) return;
  const ref = adminDb().collection("users").doc(ownerId);
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const count = Number(snap.data().ownedTournamentCount || 0);
    tx.set(
      ref,
      {
        ownedTournamentCount: Math.max(0, count - 1),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });
}

export async function releaseLeagueSlotForTournament(tournamentId, decoded) {
  const tournament = await loadTournament(tournamentId);
  if (!tournament) return { ok: false, status: 404 };
  const isOwner = tournament.ownerId && tournament.ownerId === decoded.uid;
  if (!isOwner && decoded.superAdmin !== true) return { ok: false, status: 403 };
  await releaseLeagueSlot(tournament.ownerId);
  return { ok: true, status: 200 };
}

