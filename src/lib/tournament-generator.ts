import { collection, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateAdminAccessCode, setTournamentAccessCode, slugify } from "@/lib/db";
import { TournamentTier, Sport, TournamentGame } from "@/types/tournament";

export interface ProvisionOptions {
  tournamentName: string;
  organizationName: string;
  sport: Sport;
  tier: TournamentTier;
  organizerEmail: string;
  adminAccessCode?: string;
  ownerId: string;
  numberOfTeams: number; // 4, 6, 8, 10, 12, 16
  playersPerTeam: number; // 5, 8, 10, 12
  theme: "dominican" | "nba" | "european" | "cities" | "custom";
  autoGenerateSchedule: boolean;
  startDate?: string;
}

const DOMINICAN_BASKETBALL_TEAMS = [
  { name: "Pueblo Nuevo", shortName: "PNV", color: "#f97316" },
  { name: "Los Cajuilitos", shortName: "CAJ", color: "#3b82f6" },
  { name: "San Lázaro", shortName: "SLA", color: "#10b981" },
  { name: "Mauricio Báez", shortName: "MBA", color: "#eab308" },
  { name: "Rafael Barias", shortName: "RBA", color: "#ef4444" },
  { name: "Bameso", shortName: "BAM", color: "#8b5cf6" },
  { name: "San Carlos", shortName: "SCA", color: "#ec4899" },
  { name: "Huellas del Siglo", shortName: "HUE", color: "#06b6d4" },
  { name: "Villa Francisca", shortName: "VFR", color: "#14b8a6" },
  { name: "Los Mina", shortName: "LMI", color: "#6366f1" },
  { name: "Calero", shortName: "CAL", color: "#f43f5e" },
  { name: "Renacer", shortName: "REN", color: "#84cc16" },
  { name: "El Millón", shortName: "MIL", color: "#a855f7" },
  { name: "Santa Ana", shortName: "SAN", color: "#0ea5e9" },
  { name: "Sameji", shortName: "SAM", color: "#d946ef" },
  { name: "Club Domingo Paulino (CDP)", shortName: "CDP", color: "#f59e0b" },
];

const NBA_TEAMS = [
  { name: "Los Angeles Lakers", shortName: "LAL", color: "#eab308" },
  { name: "Boston Celtics", shortName: "BOS", color: "#10b981" },
  { name: "Golden State Warriors", shortName: "GSW", color: "#3b82f6" },
  { name: "Chicago Bulls", shortName: "CHI", color: "#ef4444" },
  { name: "Miami Heat", shortName: "MIA", color: "#f43f5e" },
  { name: "Brooklyn Nets", shortName: "BKN", color: "#71717a" },
  { name: "Milwaukee Bucks", shortName: "MIL", color: "#059669" },
  { name: "Phoenix Suns", shortName: "PHX", color: "#f97316" },
  { name: "Dallas Mavericks", shortName: "DAL", color: "#0284c7" },
  { name: "San Antonio Spurs", shortName: "SAS", color: "#a1a1aa" },
  { name: "Denver Nuggets", shortName: "DEN", color: "#1e3a8a" },
  { name: "Philadelphia 76ers", shortName: "PHI", color: "#2563eb" },
  { name: "New York Knicks", shortName: "NYK", color: "#ea580c" },
  { name: "Toronto Raptors", shortName: "TOR", color: "#be123c" },
  { name: "Memphis Grizzlies", shortName: "MEM", color: "#38bdf8" },
  { name: "Houston Rockets", shortName: "HOU", color: "#dc2626" },
];

const SOCCER_TEAMS = [
  { name: "Real Madrid CF", shortName: "RMA", color: "#ffffff" },
  { name: "FC Barcelona", shortName: "FCB", color: "#1e40af" },
  { name: "Manchester City", shortName: "MCI", color: "#38bdf8" },
  { name: "Bayern Múnich", shortName: "BAY", color: "#dc2626" },
  { name: "Paris Saint-Germain", shortName: "PSG", color: "#1e3a8a" },
  { name: "Liverpool FC", shortName: "LIV", color: "#b91c1c" },
  { name: "Inter de Milán", shortName: "INT", color: "#1d4ed8" },
  { name: "Arsenal FC", shortName: "ARS", color: "#ef4444" },
  { name: "Juventus", shortName: "JUV", color: "#52525b" },
  { name: "Chelsea FC", shortName: "CHE", color: "#2563eb" },
  { name: "Atlético de Madrid", shortName: "ATM", color: "#e11d48" },
  { name: "Borussia Dortmund", shortName: "BVB", color: "#eab308" },
];

const CITIES_TEAMS = [
  { name: "Baní Titans", shortName: "BAN", color: "#f97316" },
  { name: "Santo Domingo Lions", shortName: "SDO", color: "#3b82f6" },
  { name: "Santiago Sharks", shortName: "STI", color: "#10b981" },
  { name: "La Vega Eagles", shortName: "VEG", color: "#eab308" },
  { name: "San Cristóbal Bulls", shortName: "SCR", color: "#ef4444" },
  { name: "Puerto Plata Waves", shortName: "POP", color: "#06b6d4" },
  { name: "Moca Knights", shortName: "MOC", color: "#8b5cf6" },
  { name: "San Pedro Hawks", shortName: "SPM", color: "#14b8a6" },
  { name: "La Romana Kings", shortName: "LRM", color: "#f43f5e" },
  { name: "Bonao Thunder", shortName: "BON", color: "#6366f1" },
  { name: "Higüey Warriors", shortName: "HIG", color: "#84cc16" },
  { name: "Azua Gladiators", shortName: "AZU", color: "#a855f7" },
];

const FIRST_NAMES = [
  "Carlos", "Miguel", "Jean", "David", "Luis", "Kelvin", "Jonathan", "Manuel", 
  "Alejandro", "Víctor", "Ángel", "José", "Edward", "Brayan", "Gabriel", "Javier", 
  "Erick", "Roberto", "Anthony", "Diego", "Samuel", "Alexander", "Manny", "Kevin", 
  "Cristian", "Juan", "Richard", "Héctor", "Pedro", "Franklin"
];

const LAST_NAMES = [
  "Pérez", "Rodríguez", "García", "Hernández", "Martínez", "Santos", "González", 
  "Díaz", "Báez", "Castillo", "Mendoza", "Reyes", "Cruz", "Morales", "Ramírez", 
  "Ortiz", "Vargas", "Guerrero", "Gómez", "Rosario", "Almonte", "Polanco", "Santana", 
  "Severino", "Mejía", "Taveras", "Guzmán", "Peralta", "Mateo", "Sánchez"
];

const BASKETBALL_POSITIONS = ["PG", "SG", "SF", "PF", "C"];
const SOCCER_POSITIONS = ["POR", "DEF", "DEF", "DEF", "MED", "MED", "MED", "DEL", "DEL", "DEL"];
const JERSEY_NUMBERS = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 15, 21, 23, 24, 30, 32, 33, 34, 77, 99];

export async function provisionConfiguredTournament(options: ProvisionOptions): Promise<string> {
  const {
    tournamentName,
    organizationName,
    sport,
    tier,
    organizerEmail,
    ownerId,
    numberOfTeams,
    playersPerTeam,
    theme,
    autoGenerateSchedule,
    startDate
  } = options;

  const cleanEmails = organizerEmail
    .split(/[,\s]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0 && e.includes('@'));

  const slug = slugify(tournamentName);

  // Generar PIN / Código de acceso único si no viene especificado
  const generatedPin = options.adminAccessCode?.trim().toUpperCase() || generateAdminAccessCode();

  // 1. Crear Torneo en Firestore
  const tournamentDoc = {
    name: tournamentName.trim(),
    slug,
    sport,
    tier,
    ownerId,
    adminEmails: cleanEmails,
    organizationName: organizationName.trim() || "Liga Oficial",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      maxTeams: Math.max(numberOfTeams, 16),
      playersPerTeam,
      periodDurationMinutes: sport === "basketball" ? (tier === "pro" ? 10 : 8) : 45,
      totalPeriods: sport === "basketball" ? 4 : 2,
      allowOvertime: true,
      publicLeaderboard: true,
      trackPlayByPlay: tier === "pro",
      trackShotCharts: tier === "pro",
      enableRefereeAssignment: tier === "pro",
      enableVideoHighlights: tier === "pro",
    },
  };

  const tournamentRef = await addDoc(collection(db, "tournaments"), tournamentDoc);
  const tournamentId = tournamentRef.id;
  try {
    await setTournamentAccessCode(tournamentId, generatedPin);
  } catch (error) {
    await deleteDoc(tournamentRef).catch(() => {});
    throw error;
  }

  // 2. Determinar la lista base de equipos según temática
  let sourceTeams = DOMINICAN_BASKETBALL_TEAMS;
  if (sport === "soccer") {
    sourceTeams = SOCCER_TEAMS;
  } else if (theme === "nba") {
    sourceTeams = NBA_TEAMS;
  } else if (theme === "cities") {
    sourceTeams = CITIES_TEAMS;
  }

  // 3. Crear los equipos seleccionados
  const createdTeams: Array<{ id: string; name: string; shortName: string }> = [];

  for (let i = 0; i < numberOfTeams; i++) {
    const defaultData = sourceTeams[i % sourceTeams.length];
    const teamName = i < sourceTeams.length 
      ? defaultData.name 
      : `${defaultData.name} ${Math.floor(i / sourceTeams.length) + 1}`;
    
    const teamShort = i < sourceTeams.length 
      ? defaultData.shortName 
      : `${defaultData.shortName}${i}`;

    const teamDoc = {
      tournamentId,
      name: teamName,
      shortName: teamShort,
      color: defaultData.color || "#f97316",
      playerIds: [],
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      createdAt: new Date().toISOString(),
    };

    const teamRef = await addDoc(
      collection(db, "tournaments", tournamentId, "teams"),
      teamDoc
    );

    createdTeams.push({
      id: teamRef.id,
      name: teamName,
      shortName: teamShort,
    });

    // 4. Crear los jugadores para este equipo
    const shuffledFirst = [...FIRST_NAMES].sort(() => 0.5 - Math.random());
    const shuffledLast = [...LAST_NAMES].sort(() => 0.5 - Math.random());
    const numbersPool = [...JERSEY_NUMBERS].sort(() => 0.5 - Math.random());

    for (let p = 0; p < playersPerTeam; p++) {
      const pName = `${shuffledFirst[p % shuffledFirst.length]} ${shuffledLast[p % shuffledLast.length]}`;
      const position = sport === "basketball" 
        ? BASKETBALL_POSITIONS[p % BASKETBALL_POSITIONS.length]
        : SOCCER_POSITIONS[p % SOCCER_POSITIONS.length];
      const number = numbersPool[p % numbersPool.length];

      const playerDoc = {
        tournamentId,
        teamId: teamRef.id,
        name: pName,
        number,
        position,
        isRegisteredPro: tier === "pro",
        gamesPlayed: 0,
        totalPoints: 0,
        totalAssists: 0,
        createdAt: new Date().toISOString(),
      };

      await addDoc(
        collection(db, "tournaments", tournamentId, "players"),
        playerDoc
      );
    }
  }

  // 5. Generar Calendario de Partidos (Round Robin) si fue solicitado
  if (autoGenerateSchedule && createdTeams.length >= 2) {
    const baseDate = startDate ? new Date(startDate) : new Date();
    let matchIndex = 0;

    // Generador de cruces Round Robin
    for (let i = 0; i < createdTeams.length; i++) {
      for (let j = i + 1; j < createdTeams.length; j++) {
        const teamA = createdTeams[i];
        const teamB = createdTeams[j];

        // Fechas espaciadas por días y horas
        const matchDate = new Date(baseDate.getTime() + matchIndex * 86400000 * 2 + (matchIndex % 2) * 7200000);
        matchDate.setHours(19 + (matchIndex % 2), 30, 0, 0); // 7:30 PM o 8:30 PM

        const roundNumber = Math.floor(matchIndex / Math.floor(createdTeams.length / 2)) + 1;

        const gameDoc: Omit<TournamentGame, "id"> = {
          tournamentId,
          sport,
          teamAId: teamA.id,
          teamBId: teamB.id,
          teamAName: teamA.name,
          teamBName: teamB.name,
          scoreA: 0,
          scoreB: 0,
          isFinished: false,
          status: "scheduled",
          date: matchDate.toISOString(),
          roundName: `Jornada ${roundNumber}`,
          venue: "Cancha Principal / Polideportivo Oficial",
          currentPeriod: 1,
          timeRemaining: sport === "basketball" ? (tier === "pro" ? "10:00" : "08:00") : "45:00",
          playerStats: {},
        };

        await addDoc(
          collection(db, "tournaments", tournamentId, "games"),
          gameDoc
        );

        matchIndex++;
      }
    }
  }

  return tournamentId;
}
