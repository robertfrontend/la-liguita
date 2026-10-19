import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PublicLeague = {
  id: string;
  name: string;
  slug: string;
  sport: "basketball" | "soccer";
  organizationName?: string;
  status?: string;
};

function createdAtMillis(value: unknown): number {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function listPublicTournaments(): Promise<PublicLeague[]> {
  if (!db) return [];

  try {
    const snap = await withTimeout(getDocs(collection(db, "tournaments")), 2500);
    return snap.docs
      .map((docSnap) => {
        const data = docSnap.data();
        const sport: PublicLeague["sport"] = data.sport === "soccer" ? "soccer" : "basketball";
        const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : "Torneo";
        const slug =
          typeof data.slug === "string" && data.slug.trim() ? data.slug.trim() : docSnap.id;
        const organizationName =
          typeof data.organizationName === "string" && data.organizationName.trim()
            ? data.organizationName.trim()
            : undefined;
        const status = typeof data.status === "string" ? data.status : undefined;

        return {
          id: docSnap.id,
          name,
          slug,
          sport,
          organizationName,
          status,
          createdAt: createdAtMillis(data.createdAt),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 24)
      .map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        sport: row.sport,
        organizationName: row.organizationName,
        status: row.status,
      }));
  } catch (error) {
    console.error("No se pudieron listar las ligas públicas.", error);
    return [];
  }
}
