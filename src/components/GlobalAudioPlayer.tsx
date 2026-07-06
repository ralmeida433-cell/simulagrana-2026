import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Settings2, Volume2, FastForward, Loader2, X, Headphones, Minimize2, Maximize2, GripHorizontal, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { useAudioPlayer, SPEEDS } from '../contexts/AudioPlayerContext';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { cn } from '../lib/utils';

export default function GlobalAudioPlayer() {
  const { 
    isPlaying, isPaused, isLoading, currentTitle, currentText,
    pause, resume, stop, speed, setSpeed, 
    selectedVoiceId, setVoice, voices,
    currentTime, duration, seekTo, seekBy
  } = useAudioPlayer();
  
  const [showSettings, setShowSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

  const currentVoice = voices.find(v => v.id === selectedVoiceId);

  useEffect(() => {
    if (!isDraggingSeek) {
      setSeekValue(currentTime);
    }
  }, [currentTime, isDraggingSeek]);

  // Keep player visible if currentText is set, even if not playing/loading
  if (!currentText) {
    return null;
  }

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(parseFloat(e.target.value));
  };

  const handleSeekComplete = () => {
    setIsDraggingSeek(false);
    seekTo(seekValue);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isNative = currentVoice?.engine === 'native';

  return (
    <>
      {/* Invisible constraints area for dragging */}
      <div className="fixed inset-4 pointer-events-none z-[60]" ref={constraintsRef} />
      
      <motion.div 
        drag
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-[70] flex flex-col items-end"
        style={{ touchAction: 'none' }}
      >
        <AnimatePresence mode="wait">
          {!isMinimized ? (
            <motion.div 
              key="maximized"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-4 w-[calc(100vw-32px)] md:w-[380px] flex flex-col gap-4"
            >
              <div 
                className="flex items-center justify-between cursor-grab active:cursor-grabbing group select-none -mt-1 -mx-1 p-1 rounded-t-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex items-center gap-2">
                  <GripHorizontal className="w-4 h-4 text-slate-300 dark:text-slate-600 transition-colors" />
                  <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    <Headphones className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-px">Narrador IA</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsMinimized(true)} 
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Minimizar"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => stop()} 
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    title="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <div className="relative">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border shadow-sm", 
                    isLoading ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" : "bg-gradient-to-tr from-emerald-500 to-teal-500 border-emerald-600 shadow-emerald-500/20")}>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    ) : (
                      <Headphones className="w-5 h-5 text-white" />
                    )}
                  </div>
                  {isPlaying && (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-0.5">
                    {currentTitle || 'Relatório Analítico'}
                  </h4>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                    <span className="truncate">{currentVoice?.name || 'Voz Padrão'}</span>
                    {!isNative && duration > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className="shrink-0">{formatTime(duration)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar (Only visible if duration is known & not native) */}
              {!isNative && duration > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-medium text-slate-500 tabular-nums w-8 text-right">{formatTime(seekValue)}</span>
                    <input 
                      type="range" 
                      min="0" 
                      max={duration || 100} 
                      value={seekValue} 
                      onChange={handleSeekChange}
                      onMouseDown={() => setIsDraggingSeek(true)}
                      onMouseUp={handleSeekComplete}
                      onTouchStart={() => setIsDraggingSeek(true)}
                      onTouchEnd={handleSeekComplete}
                      className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] font-medium text-slate-500 tabular-nums w-8">{formatTime(duration)}</span>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-between mt-1">
                {/* Secondary controls Left */}
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => seekTo(0)}
                    disabled={isLoading || isNative}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title="Reiniciar"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => seekBy(-15)}
                    disabled={isLoading || isNative}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title="Voltar 15s"
                  >
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>
                  
                  <button
                    onClick={isPlaying ? pause : resume}
                    disabled={isLoading}
                    className="w-12 h-12 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full hover:scale-105 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => seekBy(15)}
                    disabled={isLoading || isNative}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title="Avançar 15s"
                  >
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>
                </div>

                {/* Secondary controls Right */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={cn(
                      "p-2 rounded-full transition-all", 
                      showSettings ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                    title="Configurações"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showSettings && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-4 w-[280px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-10"
                      >
                        <div className="space-y-4">
                          <div>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                              <Volume2 className="w-3.5 h-3.5" /> Narrador
                            </label>
                            <select
                              value={selectedVoiceId}
                              onChange={(e) => setVoice(e.target.value)}
                              className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 transition-all shadow-sm"
                            >
                              <optgroup label="Modelo Neural Principal">
                                {voices.filter(v => ['kokoro', 'gemini'].includes(v.engine)).map(v => (
                                  <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                              <FastForward className="w-3.5 h-3.5" /> Velocidade
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {SPEEDS.map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => setSpeed(s.id)}
                                  className={cn(
                                    "py-2 px-1.5 text-[11px] font-bold rounded-lg border transition-all text-center",
                                    speed === s.id 
                                      ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-md" 
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 shadow-sm"
                                  )}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="minimized"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl rounded-full border border-slate-200/50 dark:border-slate-800/50 p-2 flex items-center gap-2 cursor-grab active:cursor-grabbing group select-none relative overflow-hidden"
              onPointerDown={(e) => dragControls.start(e)}
              title={`Tocando: ${currentTitle || 'Relatório'}`}
            >
              {/* Mini progress bar behind the content */}
              {!isNative && duration > 0 && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-emerald-500 dark:bg-emerald-400 opacity-20 transition-all duration-300"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              )}

              <div className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full dark:bg-emerald-500/10 dark:text-emerald-400 z-10 shrink-0">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GripHorizontal className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              
              <div className="w-24 px-1 truncate flex items-center z-10">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                  {currentTitle || 'Narrador'}
                </span>
              </div>

              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 shrink-0 z-10" />

              <div className="flex items-center gap-1 shrink-0 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    isPlaying ? pause() : resume();
                  }}
                  disabled={isLoading}
                  className="w-8 h-8 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full hover:scale-105 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(false);
                  }} 
                  className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" 
                  title="Expandir"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    stop();
                  }} 
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors" 
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
