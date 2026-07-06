import React from 'react';
import { Play, Square, Loader2, Headphones, Sparkles, Pause } from 'lucide-react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { cn } from '../lib/utils';

interface ReportAudioPlayerProps {
  text: string;
  title?: string;
  colorTheme?: 'emerald' | 'indigo' | 'violet' | 'rose';
}

export default function ReportAudioPlayer({ text, title = 'Relatório de Análise', colorTheme = 'emerald' }: ReportAudioPlayerProps) {
  const { play, pause, resume, stop, isPlaying, isPaused, isLoading, currentText, currentTime, duration, getProgress } = useAudioPlayer();

  const isActive = currentText === text;
  const activeIsPlaying = isActive && isPlaying;
  const activeIsPaused = isActive && isPaused;
  const activeIsLoading = isActive && isLoading;
  
  const savedProgress = getProgress(text);
  const hasProgress = savedProgress > 0 && !isActive;

  const themeColors = {
    emerald: {
      bg: 'bg-emerald-600',
      hover: 'hover:bg-emerald-700',
      light: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-500/20'
    },
    indigo: {
      bg: 'bg-indigo-600',
      hover: 'hover:bg-indigo-700',
      light: 'bg-indigo-50 dark:bg-indigo-500/10',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-500/20'
    },
    violet: {
      bg: 'bg-violet-600',
      hover: 'hover:bg-violet-700',
      light: 'bg-violet-50 dark:bg-violet-500/10',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-200 dark:border-violet-500/20'
    },
    rose: {
      bg: 'bg-rose-600',
      hover: 'hover:bg-rose-700',
      light: 'bg-rose-50 dark:bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-500/20'
    }
  };

  const colors = themeColors[colorTheme] || themeColors.emerald;

  const handleToggle = () => {
    if (isActive) {
       if (activeIsPlaying) {
         pause();
       } else if (activeIsPaused) {
         resume();
       } else {
         stop();
       }
    } else {
      play(text, title);
    }
  };

  const progressPercent = isActive && duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "mt-8 overflow-hidden rounded-2xl border transition-all duration-500 flex flex-col group relative",
      isActive 
        ? `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-lg shadow-${colorTheme}-500/10` 
        : "bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800"
    )}>
      
      {/* Background ambient glow if active */}
      {activeIsPlaying && (
        <div className={cn("absolute -inset-[100px] opacity-20 blur-3xl z-0 transition-opacity duration-1000", colors.bg)} />
      )}

      <div className="p-4 flex items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggle}
            disabled={activeIsLoading}
            className={cn(
              "w-12 h-12 flex items-center justify-center text-white rounded-full transition-all shadow-md shrink-0 block",
              isActive && !activeIsPaused ? colors.bg : "bg-slate-800 dark:bg-slate-100 dark:text-slate-900",
              !isActive && "group-hover:scale-105 active:scale-95",
              activeIsLoading && "opacity-80 pointer-events-none"
            )}
          >
            {activeIsLoading ? (
               <Loader2 className="w-5 h-5 animate-spin" />
            ) : activeIsPlaying ? (
               <Pause className="w-5 h-5 fill-current" />
            ) : (
               <Play className="w-5 h-5 fill-current ml-1" />
            )}
          </button>
          
          <div className="flex flex-col justify-center min-w-0">
             <div className="flex items-center gap-2 mb-0.5">
               <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                 {activeIsPlaying ? 'Ouvindo Análise' : activeIsPaused ? 'Leitura Pausada' : hasProgress ? 'Retomar Narração' : 'Ouvir Relatório'}
               </h4>
               {activeIsPlaying && (
                 <span className="flex h-2 w-2 relative">
                   <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", colors.bg)}></span>
                   <span className={cn("relative inline-flex rounded-full h-2 w-2", colors.bg)}></span>
                 </span>
               )}
             </div>
             
             <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
               {activeIsLoading ? (
                 <>Processando com motor neural...</>
               ) : hasProgress ? (
                 <>Continuar de onde parou</>
               ) : !isActive ? (
                 <><Sparkles className="w-3 h-3 text-amber-500" /> IA Narradora Premium</>
               ) : (
                 <>Sincronizado via Kokoro TTS</>
               )}
             </p>
          </div>
        </div>
        
        {!isActive && !hasProgress && (
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
             <Headphones className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {isActive && duration > 0 && (
        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 z-10 relative">
          <div 
            className={cn("h-full transition-all duration-300 ease-linear rounded-r-full", colors.bg)}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
