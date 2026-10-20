declare module "@/lib/server/tournament-access.mjs" {
  export type AccessCodeResult = {
    ok?: boolean;
    status?: number;
    valid?: boolean;
    message?: string;
    tournament?: {
      id: string;
      name: string;
      slug: string;
      sport: string;
      tier: string;
      organizationName?: string;
      logoUrl?: string;
      bannerUrl?: string;
      status?: string;
      settings?: Record<string, unknown>;
    };
    code?: string;
    adminEmails?: string[];
    adminUids?: string[];
  };

  export type DecodedAdminToken = {
    uid: string;
    email?: string;
    superAdmin?: boolean;
  } | null;

  export function verifyIdToken(authorizationHeader: string | null): Promise<DecodedAdminToken>;
  export function consumeAccessAttempt(input: {
    uid?: string;
    ip?: string;
    tournamentId?: string;
    now?: number;
  }): Promise<{ allowed: boolean; retryAfterMs: number }>;
  export function verifyAccessCode(input: {
    rawCode: string;
    decoded: DecodedAdminToken;
    claim: boolean;
  }): Promise<AccessCodeResult>;
  export function syncTournamentAdmins(
    tournamentId: string,
    rawEmails: unknown,
    decoded: { uid: string; email?: string; superAdmin?: boolean }
  ): Promise<AccessCodeResult>;
  export function setTournamentAccessCode(
    tournamentId: string,
    rawCode: string,
    decoded: { uid: string; email?: string; superAdmin?: boolean }
  ): Promise<AccessCodeResult>;
}
