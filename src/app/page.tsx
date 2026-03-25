"use client";

import Link from "next/link";
import { Trophy, PlayCircle, ArrowRight, Github, Zap } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return null;

  // VIEW FOR LOGGED IN USERS
  if (user) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-background min-h-[calc(100vh-4rem)] transition-colors duration-300">
        <div className="flex justify-center w-full -mb-4">
            <img src="/logo.png" alt="La Liguita Logo" className="w-64 h-64 object-contain drop-shadow-sm brightness-100 dark:brightness-110" />
        </div>
        <div className="mb-10 relative z-10 max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">
            Welcome Back, <span className="text-primary">{user.displayName}</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Ready to hit the court?
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
          <Link 
            href="/game/new" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full h-14 text-lg font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
              <PlayCircle size={24} />
              Start New Game
          </Link>
          <Link 
            href="/leaderboard" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-card text-foreground hover:bg-muted/10 w-full h-14 text-lg font-medium gap-2 border border-border hover:border-primary/50 active:scale-[0.98]"
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
      <div className="flex flex-col bg-background min-h-[calc(100vh-4rem)] transition-colors duration-300">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center p-8 text-center pt-20 pb-16">
          <a 
            href="https://github.com/robertfrontend/la-liguita" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/10 text-muted-foreground text-sm font-medium mb-6 hover:bg-muted/20 transition-colors"
          >
            <Github size={16} />
            <span>Star us on GitHub</span>
          </a>
  
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6 max-w-2xl leading-tight">
            Track Your Street <span className="text-primary">Basketball</span> Legacy.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            La Liguita is the professional stats tracker for your casual games. Create leagues, track points & assists, and see who really owns the court.
          </p>
  
          <div className="max-w-lg w-full flex flex-col items-center gap-4 mb-12">
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-black text-xl hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
              >
                Get Started Now
                <Zap className="fill-current group-hover:scale-110 transition-transform" size={24} />
              </Link>
              
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Open for everyone - No invite needed
              </p>
          </div>
        </section>
  
        {/* How it Works */}
        <section className="bg-muted/5 py-16 px-6 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-foreground mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
                <h3 className="font-bold text-lg text-foreground mb-2">Create a League</h3>
                <p className="text-muted-foreground text-sm">Start a private group for your squad or local court.</p>
              </div>
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
                <h3 className="font-bold text-lg text-foreground mb-2">Track Live Games</h3>
                <p className="text-muted-foreground text-sm">Log points and assists in real-time on your phone.</p>
              </div>
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
                <h3 className="font-bold text-lg text-foreground mb-2">Climb the Ranks</h3>
                <p className="text-muted-foreground text-sm">Automatic leaderboards for wins, MVPs, and top scorers.</p>
              </div>
            </div>
          </div>
        </section>
  
        <div className="py-8 bg-background border-t border-border flex flex-col items-center justify-center gap-4">
           <p className="text-xs text-muted-foreground">Created by <a href="https://linkedin.com/in/robertfrontend" target="_blank" rel="noopener noreferrer" className="text-foreground font-bold hover:text-primary transition-colors">RobertFrontend</a> with ❤️</p>
           
           <a href="https://github.com/robertfrontend/la-liguita" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm">
              <Github size={18} />
              <span className="font-medium">Open Source</span>
           </a>
        </div>
      </div>
    );
  }

  