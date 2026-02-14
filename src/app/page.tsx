import Link from "next/link";
import { Trophy, PlayCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-[var(--background)] h-[calc(100vh-8rem)]">
      <div className="flex justify-center w-full -mb-4">
          <img src="/logo.png" alt="La Liguita Logo" className="w-64 h-64 object-contain drop-shadow-sm" />
      </div>
      <div className="mb-10 relative z-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-4">
          Welcome to the Court
        </h1>
        <p className="text-lg text-zinc-500 max-w-sm mx-auto">
          Track stats, climb the leaderboard, and dominate the game.
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link 
          href="/game/new" 
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full h-14 text-lg font-bold gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
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

      <div className="mt-24 text-xs text-zinc-400 font-medium animate-in fade-in slide-in-from-bottom-4 duration-1000">
         <p>Created by <a href="https://linkedin.com/in/robertfrontend" target="_blank" rel="noopener noreferrer" className="text-zinc-600 font-bold hover:text-orange-500 transition-colors underline decoration-dotted underline-offset-2">RobertFrontend</a></p>
         <p>with <span className="text-red-500">❤️</span> from <span className="text-zinc-600 font-bold">Boston, MA</span></p>
      </div>
    </div>
  );
}
