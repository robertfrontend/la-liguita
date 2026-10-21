declare module "@/lib/plans.mjs" {
  export type BillingPlan = "free" | "pro" | "club" | "federation";
  export type BillingInterval = "month" | "season" | "year";
  export type BillingStatus =
    | "none"
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "unpaid"
    | "paused";

  export type TournamentBilling = {
    plan: BillingPlan;
    status: BillingStatus;
    interval?: BillingInterval | null;
    currentPeriodEnd?: string | null;
    currentPeriodEndMs?: number | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  };

  export type PlanLimits = {
    plan: BillingPlan;
    maxActiveLeagues: number;
    maxTeams: number;
    maxAdminEmails: number;
    sponsorSlots: number;
    liveScoreboard: boolean;
    statsLeaders: boolean;
    multipleAdmins: boolean;
    hideBranding: boolean;
    showLeagueLogo: boolean;
    customDomain: boolean;
    whatsappSupport: boolean;
  };

  export const FEDERATION_EMAIL: string;
  export const SPONSOR_RULE_CAP: number;
  export const FREE_TEAM_CAP: number;
  export const FREE_ADMIN_EMAIL_CAP: number;
  export const PLAN_PRICES: Record<
    BillingPlan,
    { month: number | null; season: number | null; year: number | null }
  >;

  export function legacyProUntil(env?: NodeJS.ProcessEnv): Date;
  export function addMonths(date: Date, months: number): Date;
  export function initialFreeBilling(): TournamentBilling;
  export function effectivePlan(
    tournament: unknown,
    now?: Date,
    env?: NodeJS.ProcessEnv
  ): BillingPlan;
  export function getPlanLimits(tournament: unknown, now?: Date, env?: NodeJS.ProcessEnv): PlanLimits;
  export function canAddAdmin(tournament: unknown, currentEmailCount: number, now?: Date): boolean;
  export function canAddTeam(tournament: unknown, currentTeamCount: number, now?: Date): boolean;
  export function leagueAllowanceFor(userData: { leagueAllowance?: number } | null | undefined): number;
  export function canOwnAnotherLeague(ownedCount: number, allowance: number | null | undefined): boolean;
  export function planLimitMessage(code: string, language?: "es" | "en"): string;
  export function normalizeSponsors(
    value: unknown,
    cap: number
  ): { name: string; href?: string; imageUrl?: string }[];
  export function allowanceAfterPlan(
    plan: string,
    status: string,
    currentAllowance: number | null | undefined,
    ownedCount: number
  ): number;
}

declare module "@/lib/billing-state.mjs" {
  export const SEASON_MONTHS: number;
  export function priceCatalog(env?: NodeJS.ProcessEnv): Record<string, string>;
  export function lookupPriceId(plan: string, interval: string, env?: NodeJS.ProcessEnv): string | null;
  export function planFromPriceId(
    priceId: string | null | undefined,
    env?: NodeJS.ProcessEnv
  ): { plan: string; interval: string } | null;
  export function appBaseUrl(env?: NodeJS.ProcessEnv): string;
  export function normalizeStatus(status: string | null | undefined): string;
  export function assertCheckoutSelection(plan: string, interval: string): void;
  export function checkoutMode(interval: string): "payment" | "subscription";
  export function subscriptionPeriodEndMs(subscription: unknown): number | null;
  export function billingFromCheckoutSession(
    session: Record<string, unknown>,
    subscription: Record<string, unknown> | null,
    now?: Date
  ): Record<string, unknown>;
  export function billingFromSubscription(
    subscription: Record<string, unknown>,
    env?: NodeJS.ProcessEnv
  ): Record<string, unknown> | null;
  export function billingFromSubscriptionDeleted(
    subscription: Record<string, unknown>,
    env?: NodeJS.ProcessEnv
  ): Record<string, unknown>;
  export function billingFromInvoiceFailed(
    existing: Record<string, unknown> | null | undefined,
    invoice: Record<string, unknown>
  ): Record<string, unknown>;
  export function nextLeagueAllowance(
    plan: string,
    status: string,
    userData: Record<string, unknown> | null | undefined
  ): number;
}
