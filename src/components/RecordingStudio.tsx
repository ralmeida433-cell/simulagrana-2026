import React from 'react';
import { useCreatorMode } from '../contexts/CreatorModeContext';
import { Play, Pause, Square, Circle, Download, Trash2, Scissors, Clapperboard, MonitorPlay, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Formata segundos para MM:SS
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function RecordingStudio() {
  const { 
    isStudioActive, 
    setStudioActive,
    isRecording,
    isPaused,
    recordingTime,
    recordedVideoUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecordedVideo
  } = useCreatorMode();

  if (!isStudioActive && !recordedVideoUrl) return null;

  return (
    <>
      {/* Controles Flutuantes de Gravação */}
      {isStudioActive && !recordedVideoUrl && (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-24 md:bottom-8 left-[calc(50%-160px)] z-[9999] bg-[#0f172a]/80 backdrop-blur-xl text-white p-1.5 pr-2 rounded-full shadow-2xl flex items-center gap-3 border border-white/5 cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-3 pl-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="font-mono text-sm font-medium w-12 tracking-wider">
              {formatTime(recordingTime)}
            </span>
          </div>

          <div className="w-px h-5 bg-slate-700/50" />

          <div className="flex items-center gap-1">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 bg-[#ff3344] hover:bg-[#ff1a2e] text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                Gravar Tela + Câmera
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="flex items-center gap-2 hover:bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                    Retomar
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="flex items-center gap-2 hover:bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    Pausar
                  </button>
                )}
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 hover:bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                >
                  <Square className="w-3.5 h-3.5 text-slate-300 fill-current" />
                  Parar
                </button>
              </>
            )}
          </div>

          {!isRecording && (
            <>
              <div className="w-px h-5 bg-slate-700/50 ml-1" />
              <button
                onClick={() => setStudioActive(false)}
                className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors"
                title="Fechar Estúdio"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </motion.div>
      )}

      {/* Modal de Preview e Edição de Vídeo */}
      <AnimatePresence>
        {recordedVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 md:p-8"
          >
            <div className="bg-slate-900 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-3 text-white">
                  <Clapperboard className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-semibold text-lg">Estúdio de Edição (Preview)</h2>
                </div>
                <button
                  onClick={clearRecordedVideo}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
                {/* Video Player */}
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner">
                  <video
                    src={recordedVideoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Fake Editor Timeline (Visual Only) */}
                <div className="bg-slate-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4" />
                      <span className="text-sm font-medium">Linha do Tempo (Cortes e Transições)</span>
                    </div>
                    <span className="text-xs text-slate-500">Duração: {formatTime(recordingTime)}</span>
                  </div>
                  
                  <div className="relative h-16 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden group cursor-not-allowed">
                    {/* Fake waveform/timeline */}
                    <div className="absolute inset-0 flex items-center gap-1 px-2 opacity-30">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="flex-1 bg-indigo-500 rounded-full" style={{ height: `${Math.max(20, Math.random() * 100)}%` }} />
                      ))}
                    </div>
                    {/* Fake trim handles */}
                    <div className="absolute top-0 bottom-0 left-0 w-4 bg-indigo-500/50 border-r-2 border-indigo-400" />
                    <div className="absolute top-0 bottom-0 right-0 w-4 bg-indigo-500/50 border-l-2 border-indigo-400" />
                    
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-white bg-black/80 px-4 py-2 rounded-full font-medium text-center max-w-md">
                        ⚠️ Edição avançada (cortes precisos, transições e efeitos) requer um software desktop dedicado como CapCut, Premiere ou DaVinci Resolve. Baixe o vídeo bruto abaixo para editar.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                <button
                  onClick={clearRecordedVideo}
                  className="px-6 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Descartar
                </button>
                <a
                  href={recordedVideoUrl}
                  download={`SimulaGrana_Analise_${new Date().getTime()}.webm`}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-900/20"
                >
                  <Download className="w-4 h-4" />
                  Baixar Vídeo (WebM)
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
