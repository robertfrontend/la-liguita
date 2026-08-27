"use client";

import { Video, Play, UploadCloud, Sparkles } from "lucide-react";

export default function TournamentMediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Video className="text-orange-500" />
              Video Highlights & Transmisión
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-sm">
              PRO
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Enlace con transmisiones de YouTube/Twitch, clips de las mejores jugadas y resúmenes automáticos.
          </p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-sm rounded-xl transition shadow-lg shadow-orange-500/20">
          <UploadCloud size={18} />
          <span>Vincular Streaming / Highlight</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden group">
          <div className="h-48 bg-zinc-800/60 flex items-center justify-center relative cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-orange-500 text-zinc-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
              <Play size={20} className="fill-current ml-0.5" />
            </div>
            <span className="absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
              03:45
            </span>
          </div>
          <div className="p-5">
            <h4 className="font-bold text-white text-sm">Top 10 Jugadas - Jornada Inaugural</h4>
            <p className="text-xs text-zinc-400 mt-1">Dunk espectacular de Carlos Rodríguez en el 4to cuarto.</p>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden group">
          <div className="h-48 bg-zinc-800/60 flex items-center justify-center relative cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-orange-500 text-zinc-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
              <Play size={20} className="fill-current ml-0.5" />
            </div>
            <span className="absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
              01:12:30
            </span>
          </div>
          <div className="p-5">
            <h4 className="font-bold text-white text-sm">Transmisión Completa: Los Cajuilitos vs Santa Rosa</h4>
            <p className="text-xs text-zinc-400 mt-1">Narración oficial del TBS Peravia 2026 en vivo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
