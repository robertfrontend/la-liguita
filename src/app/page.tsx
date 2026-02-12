import Link from "next/link";
import { Trophy, PlayCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[var(--background)]">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-4">
          La <span className="text-orange-500">Liguita</span>
        </h1>
        <p className="text-lg text-zinc-500 max-w-sm mx-auto">
          The ultimate platform for tracking your 3-on-3 street basketball stats among friends.
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link 
          href="/game/new" 
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-zinc-900 hover:bg-zinc-50 w-full h-14 text-lg font-medium gap-2 border border-zinc-200 hover:border-zinc-300"

        >
            <PlayCircle size={24} />
            Start New Game
        </Link>
        <Link 
          href="/leaderboard" 
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-zinc-900 hover:bg-zinc-50 w-full h-14 text-lg font-medium gap-2 border border-zinc-200 hover:border-zinc-300"
        >
            <Trophy size={20} />
            View Leaderboard
        </Link>
      </div>
    </div>
  );
}
