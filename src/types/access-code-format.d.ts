declare module "@/lib/access-code-format.mjs" {
  export const ACCESS_CODE_ALPHABET: string;
  export const ACCESS_CODE_LENGTH: number;
  export function generateAccessCode(length?: number): string;
  export function isWeakAccessCode(code: unknown): boolean;
}

declare module "@/lib/server/access-attempts.mjs" {
  export function trustedClientIp(input?: {
    headers?: { get(name: string): string | null } | Record<string, string | undefined> | null;
    requestIp?: string | null;
    vercelIp?: string | null;
  }): string;
}
