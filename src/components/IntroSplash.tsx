import React, { useState, useEffect } from "react";
import { Flame, ArrowRight, Shield } from "lucide-react";

interface IntroSplashProps {
  onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  const [fading, setFading] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; left: string; size: string; delay: string; duration: string }[]>([]);

  useEffect(() => {
    // Generate randomized embers/sparkles rising from the fire
    const generated = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${15 + Math.random() * 70}%`,
      size: `${2 + Math.random() * 4}px`,
      delay: `${Math.random() * 4}s`,
      duration: `${3 + Math.random() * 4}s`,
    }));
    setSparkles(generated);

    // Auto-transition to main application after a short beautiful cinematic duration
    const transitionTimer = setTimeout(() => {
      setFading(true);
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(finishTimer);
    }, 2800);

    return () => clearTimeout(transitionTimer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-stone-950 text-stone-100 flex flex-col justify-between p-6 overflow-hidden select-none transition-all duration-1000 ease-in-out ${
        fading ? "opacity-0 scale-[1.05] pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Mystical atmosphere grid & glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141110_1px,transparent_1px),linear-gradient(to_bottom,#141110_1px,transparent_1px)] bg-[size:5rem_5rem]" />
      
      {/* Absolute core heat source (hearth glow) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-t from-orange-600/20 via-amber-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Greek-like accent line */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between opacity-50">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-stone-800 to-transparent flex-1" />
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-amber-500/70 px-4">
          EST. 2026 &bull; SACRED CODES
        </span>
        <div className="h-0.5 bg-gradient-to-r from-transparent via-stone-800 to-transparent flex-1" />
      </div>

      {/* Main Monumental Stage */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Animated Sacred Fire Hearth Metaphor */}
        <div className="relative mb-8 w-44 h-44 flex items-center justify-center">
          
          {/* Flame Backlights */}
          <div className="absolute inset-0 rounded-full bg-orange-600/10 blur-3xl animate-pulse [animation-duration:3s]" />
          <div className="absolute w-24 h-24 rounded-full bg-amber-500/15 blur-2xl animate-pulse [animation-duration:2s]" />

          {/* Firewood / Logs Base */}
          <div className="absolute bottom-4 w-28 h-5 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border border-stone-800 rounded-full shadow-lg flex justify-around px-2 items-center z-10">
            <span className="w-4 h-1.5 bg-amber-600/30 rounded-full animate-pulse" />
            <span className="w-5 h-1.5 bg-orange-500/40 rounded-full animate-pulse [animation-duration:1.5s]" />
            <span className="w-3 h-1.5 bg-amber-500/30 rounded-full animate-pulse [animation-duration:2.5s]" />
          </div>

          {/* Real-time Rising Embers */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {sparkles.map((spark) => (
              <span
                key={spark.id}
                className="absolute bottom-8 bg-amber-400 rounded-full animate-ping opacity-60"
                style={{
                  left: spark.left,
                  width: spark.size,
                  height: spark.size,
                  animationDelay: spark.delay,
                  animationDuration: spark.duration,
                  boxShadow: "0 0 8px #f97316",
                }}
              />
            ))}
          </div>

          {/* Fire Core Icon (Custom stylized nested layers) */}
          <div className="relative flex items-center justify-center animate-bounce [animation-duration:4s] z-20">
            {/* Outer flame */}
            <Flame className="w-24 h-24 text-orange-600 fill-orange-500/30 animate-pulse" />
            
            {/* Mid flame */}
            <Flame className="w-16 h-16 text-amber-500 fill-amber-500/60 absolute bottom-1 scale-x-95 animate-pulse [animation-duration:1.5s]" />
            
            {/* Inner burning light core */}
            <Flame className="w-10 h-10 text-white fill-white absolute bottom-2 scale-x-90 animate-pulse [animation-duration:0.8s]" />
          </div>

        </div>

        {/* HESTIA in Strong Monumental Greekish font */}
        <div className="space-y-4">
          <h1
            className="font-greek text-5xl sm:text-7xl font-black text-white tracking-[0.35em] uppercase leading-none select-none"
            style={{
              textShadow: "0 0 35px rgba(249, 115, 22, 0.25)",
            }}
          >
            Hestia
          </h1>
          
          <div className="flex items-center justify-center gap-3 max-w-xs mx-auto">
            <div className="h-[1px] bg-gradient-to-r from-transparent to-amber-500/60 flex-1" />
            <p className="text-[10px] font-mono tracking-[0.4em] text-amber-500 font-bold uppercase shrink-0">
              The Code Hearth
            </p>
            <div className="h-[1px] bg-gradient-to-l from-transparent to-amber-500/60 flex-1" />
          </div>
        </div>

        {/* Automatic Cinematic Loader Status */}
        <div className="mt-14 h-12 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-mono tracking-[0.25em] text-amber-500/80 animate-pulse uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            Preparing the Code Hearth...
          </div>
        </div>

      </div>

      {/* Classical bottom frame ornamentation */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center gap-3 opacity-40">
        <div className="flex justify-between w-full text-[9px] font-mono text-stone-500 tracking-wider uppercase">
          <span>&bull; CLOUD INGRESS ACTIVE</span>
          <span>SECURED BY GITHUB CODES &bull;</span>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-transparent via-stone-800 to-transparent w-full" />
      </div>

    </div>
  );
}
