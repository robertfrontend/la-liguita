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
}
