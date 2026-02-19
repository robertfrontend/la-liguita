"use client";

import Link from "next/link";
import { Trophy, PlayCircle, CheckCircle2, ArrowRight, Github } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { saveEarlyAccessEmail, subscribeToEarlyAccessCount } from "@/lib/db";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalJoined, setTotalJoined] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToEarlyAccessCount((count) => {
      setTotalJoined(count);
    });
    return () => unsubscribe();

  }, []);

  const handleEarlyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    
    setIsSubmitting(true);
    try {
      // 1. Save to Firestore (Database)
      await saveEarlyAccessEmail(email);
      
      // 2. Send Notification Email (API)
      try {
        await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
      } catch (err) {
        console.error("Failed to send notification email", err);
        // Don't block success state if only email fails, as DB save worked
      }

      setHasJoined(true);
      setEmail("");
    } catch (error) {
      console.error("Error saving email", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  // VIEW FOR LOGGED IN USERS
  if (user) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-zinc-950 min-h-[calc(100vh-4rem)] transition-colors duration-300">
        <div className="flex justify-center w-full -mb-4">
            <img src="/logo.png" alt="La Liguita Logo" className="w-64 h-64 object-contain drop-shadow-sm brightness-100 dark:brightness-110" />
        </div>
        <div className="mb-10 relative z-10 max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">
            Welcome Back, <span className="text-orange-500">{user.displayName}</span>
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Ready to hit the court?
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
          <Link 
            href="/game/new" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full h-14 text-lg font-bold gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
              <PlayCircle size={24} />
              Start New Game
          </Link>
          <Link 
            href="/leaderboard" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 w-full h-14 text-lg font-medium gap-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 active:scale-[0.98]"
          >
              <Trophy size={20} />
              View Leaderboard
          </Link>
        </div>
      </div>
    );
  }

    // VIEW FOR GUESTS (LANDING PAGE)
    return (
      <div className="flex flex-col bg-white dark:bg-zinc-950 min-h-[calc(100vh-4rem)] transition-colors duration-300">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center p-8 text-center pt-20 pb-16">
          <a 
            href="https://github.com/robertfrontend/la-liguita" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-sm font-medium mb-6 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <Github size={16} />
            <span>Star us on GitHub</span>
          </a>
  
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-6 max-w-2xl leading-tight">
            Track Your Street <span className="text-orange-500">Basketball</span> Legacy.
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            La Liguita is the professional stats tracker for your casual games. Create leagues, track points & assists, and see who really owns the court.
          </p>
  
          <div className="max-w-lg w-full mb-12">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">
                {totalJoined > 0 ? (
                  <>Join <span className="text-orange-500">{totalJoined}</span> others on the Waitlist</>
                ) : (
                  "Join the Waitlist"
                )}
              </h2>
              
              {hasJoined ? (
                  <div className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 p-4 rounded-xl flex items-center justify-center gap-2 font-medium border border-green-100 dark:border-green-900/30 animate-in fade-in zoom-in-95">
                  <CheckCircle2 size={20} />
                  You're on the list! We'll be in touch.
                  </div>
              ) : (
                  <EarlyAccesForm email={email} setEmail={setEmail} isSubmitting={isSubmitting} handleEarlyAccess={handleEarlyAccess}/>
              )}
              
              <div className="mt-4">
                  <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-orange-500 transition-colors">
                      Already have an invited account? <span className="underline decoration-dotted">Log in here</span>
                  </Link>
              </div>
          </div>
        </section>
  
        {/* How it Works */}
        <section className="bg-zinc-50 dark:bg-zinc-900/50 py-16 px-6 border-t border-zinc-100 dark:border-zinc-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500 rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-2">Create a League</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Start a private group for your squad or local court.</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500 rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-2">Track Live Games</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Log points and assists in real-time on your phone.</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500 rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-2">Climb the Ranks</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Automatic leaderboards for wins, MVPs, and top scorers.</p>
              </div>
            </div>
          </div>
        </section>
  
        <div className="py-8 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 flex flex-col items-center justify-center gap-4">
           <p className="text-xs text-zinc-400">Created by <a href="https://linkedin.com/in/robertfrontend" target="_blank" rel="noopener noreferrer" className="text-zinc-600 dark:text-zinc-400 font-bold hover:text-orange-500 transition-colors">RobertFrontend</a> with ❤️</p>
           
           <a href="https://github.com/robertfrontend/la-liguita" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2 text-sm">
              <Github size={18} />
              <span className="font-medium">Open Source</span>
           </a>
        </div>
      </div>
    );
  }
  
  
  const EarlyAccesForm = ({email, setEmail, isSubmitting, handleEarlyAccess}: {email: string, setEmail: (email: string) => void, isSubmitting: boolean, handleEarlyAccess: (e: React.FormEvent) => void}) => {
    return (
      <form onSubmit={handleEarlyAccess} className="flex flex-col sm:flex-row gap-3">
        <input 
          type="email" 
          placeholder="Enter your email" 
          className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button 
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 rounded-lg bg-zinc-900 dark:bg-orange-500 text-white font-bold hover:bg-zinc-800 dark:hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? "Joining..." : "Join Now"}
          <ArrowRight size={18} />
        </button>
      </form>
    );
  }
  