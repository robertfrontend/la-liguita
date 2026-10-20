declare module "@/lib/admin-identity.mjs" {
  export function canonicalAdminEmail(entry: unknown): string;
  export function canonicalAdminEmails(list: unknown): string[];
  export function emailIsListed(adminEmails: unknown, tokenEmail: unknown): boolean;
  export function decideClaimResult(
    result:
      | {
          ok?: boolean;
          valid?: boolean;
          message?: string;
          tournamentId?: string;
          tournament?: { id?: string } | null;
        }
      | null
      | undefined,
    expectedTournamentId?: string
  ): {
    proceed: boolean;
    clearPin: boolean;
    message: string | null;
    tournamentId: string;
  };

  export const CLAIM_DESTINATION_STORAGE_KEY: string;

  export function claimResolvedTournament(result: {
    ok?: boolean;
    valid?: boolean;
    message?: string;
    tournamentId?: string;
    tournament?: { id?: string } | null;
  } | null | undefined): { ok: boolean; tournamentId: string; message?: string };

  export function decidePostLoginRedirect(input: {
    hasPin: boolean;
    claim?: {
      ok?: boolean;
      valid?: boolean;
      message?: string;
      tournamentId?: string;
      tournament?: { id?: string } | null;
    } | null;
    rememberedDestination?: string | null;
    isSuperAdmin?: boolean;
  }): {
    path: string | null;
    clearPin: boolean;
    clearStoredTournamentId: boolean;
    rememberedDestination: string;
    consumeRemembered: boolean;
    message: string | null;
  };
}
