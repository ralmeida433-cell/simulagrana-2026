import React, { useEffect, useRef, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useCreatorMode } from '../contexts/CreatorModeContext';
import { Mic, MicOff, Move, X, Play, Pause, Square, Circle } from 'lucide-react';

// Formata segundos para MM:SS
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function CameraWidget() {
  const {
    isCameraActive,
    setCameraActive,
    shape,
    borderColor,
    borderWidth,
    size,
    isMicEnabled,
    setMicEnabled,
    position,
    isRecording,
    isPaused,
    recordingTime,
    recordingError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useCreatorMode();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const dragControls = useDragControls();

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true,
        });
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
        setError(null);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Permissão negada ou câmera não encontrada.');
      }
    };

    if (isCameraActive) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraActive]);

  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMicEnabled;
      });
    }
  }, [isMicEnabled, stream]);

  if (!isCameraActive) return null;

  const getInitialPosition = () => {
    const padding = 24;
    switch (position) {
      case 'top-left':
        return { top: padding, left: padding };
      case 'top-right':
        return { top: padding, right: padding };
      case 'bottom-left':
        return { bottom: padding, left: padding };
      case 'bottom-right':
        return { bottom: padding, right: padding };
      default:
        return { bottom: padding, right: padding };
    }
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={getInitialPosition()}
      style={{
        position: 'fixed',
        width: size,
        height: size,
        borderRadius: shape === 'circle' ? '50%' : '16px',
        border: `${borderWidth}px solid ${borderColor}`,
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        backgroundColor: '#1e293b', // slate-800
        ...getInitialPosition(),
      }}
      className="group touch-none"
      onPointerDown={(e) => {
        // Apenas alterna se clicou na área do vídeo, não nos botões
        setShowControls(prev => !prev);
      }}
    >
      {error ? (
        <div className="w-full h-full flex items-center justify-center text-center p-4 text-white text-xs">
          {error}
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted // Mute local playback to avoid feedback loop
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
        />
      )}

      {/* Overlay Controls (visible on hover or tap) */}
      <div className={`absolute inset-0 bg-black/40 transition-opacity flex flex-col items-center justify-between p-3 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        
        {/* Top Controls: Close and Move */}
        <div className="w-full flex justify-between items-start pointer-events-auto">
          {/* Drag Handle */}
          <div
            className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full cursor-grab active:cursor-grabbing backdrop-blur-sm transition-colors text-white"
            onPointerDown={(e) => {
              e.stopPropagation();
              dragControls.start(e);
            }}
            title="Mover Câmera"
          >
            <Move className="w-4 h-4" />
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCameraActive(false);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 bg-black/40 hover:bg-red-500 rounded-full transition-colors text-white backdrop-blur-sm"
            title="Fechar Câmera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Recording Time if active */}
        {isRecording && (
          <div className="px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white text-xs font-mono font-medium flex items-center gap-2 pointer-events-none">
            <div className={`w-2 h-2 rounded-full ${!isPaused ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
            {formatTime(recordingTime)}
          </div>
        )}
        
        {recordingError && !isRecording && (
          <div className="px-2 py-2 bg-slate-900/90 backdrop-blur-md rounded-lg text-white text-[10px] text-center font-bold pointer-events-auto leading-tight absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 shadow-xl z-50 flex flex-col gap-1 items-center justify-center">
            <span className="text-amber-400">{recordingError}</span>
            <span className="text-xs">↗️ Clique no ícone de nova aba no topo do AI Studio</span>
          </div>
        )}

        {/* Bottom Controls: Mic and Recording */}
        <div className="w-full flex justify-center items-center gap-2 pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMicEnabled(!isMicEnabled);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              isMicEnabled ? 'bg-black/40 hover:bg-black/60 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
            }`}
            title={isMicEnabled ? "Desligar Áudio" : "Ligar Áudio"}
          >
            {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {!isRecording ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startRecording();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white backdrop-blur-sm transition-transform hover:scale-105 shadow-lg"
              title="Gravar Tela + Câmera"
            >
              <Circle className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resumeRecording();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white backdrop-blur-sm transition-transform hover:scale-105 shadow-lg"
                  title="Retomar"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    pauseRecording();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-2 bg-amber-500 hover:bg-amber-600 rounded-full text-white backdrop-blur-sm transition-transform hover:scale-105 shadow-lg"
                  title="Pausar"
                >
                  <Pause className="w-4 h-4 fill-current" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  stopRecording();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-2 bg-slate-800 hover:bg-slate-900 rounded-full text-white backdrop-blur-sm transition-transform hover:scale-105 shadow-lg"
                title="Parar Gravação"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </>
          )}
        </div>

      </div>
    </motion.div>
  );
}
