import React from 'react';
import { useCreatorMode } from '../contexts/CreatorModeContext';
import { Video, VideoOff, Mic, MicOff, Circle, Square, LayoutTemplate, Palette, Maximize2, Move, MonitorPlay } from 'lucide-react';

export default function CreatorModeSettings() {
  const {
    isCameraActive,
    setCameraActive,
    isStudioActive,
    setStudioActive,
    shape,
    setShape,
    borderColor,
    setBorderColor,
    borderWidth,
    setBorderWidth,
    size,
    setSize,
    isMicEnabled,
    setMicEnabled,
    position,
    setPosition,
  } = useCreatorMode();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900  dark:border-slate-800 ">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 ">Análise Preview (Modo Criador)</h2>
            <p className="text-slate-500">Configure sua câmera para gravar vídeos de análise e tutoriais.</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Main Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Camera Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-border dark:bg-slate-800 ">
              <div className="flex items-center gap-3">
                {isCameraActive ? (
                  <Video className="w-6 h-6 text-emerald-500" />
                ) : (
                  <VideoOff className="w-6 h-6 text-slate-400" />
                )}
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 ">Câmera Flutuante</h3>
                  <p className="text-xs text-slate-500">Exibir seu rosto na tela.</p>
                </div>
              </div>
              <button
                onClick={() => setCameraActive(!isCameraActive)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCameraActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isCameraActive ? 'Desativar' : 'Ativar'}
              </button>
            </div>

            {/* Studio Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-border dark:bg-slate-800 ">
              <div className="flex items-center gap-3">
                <MonitorPlay className={`w-6 h-6 ${isStudioActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 ">Estúdio de Gravação</h3>
                  <p className="text-xs text-slate-500">Gravar tela e câmera juntos.</p>
                </div>
              </div>
              <button
                onClick={() => setStudioActive(!isStudioActive)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isStudioActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isStudioActive ? 'Ocultar Estúdio' : 'Abrir Estúdio'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formato da Moldura */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ">
                <LayoutTemplate className="w-4 h-4" />
                Formato da Moldura
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShape('circle')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    shape === 'circle'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Circle className="w-6 h-6" />
                  <span className="text-sm font-medium">Círculo (Instagram)</span>
                </button>
                <button
                  onClick={() => setShape('square')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    shape === 'square'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Square className="w-6 h-6" />
                  <span className="text-sm font-medium">Quadrado</span>
                </button>
              </div>
            </div>

            {/* Posição Inicial */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ">
                <Move className="w-4 h-4" />
                Posição Inicial (Arraste para ajustar)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPosition('top-left')}
                  className={`p-3 text-sm font-medium rounded-xl border transition-colors ${
                    position === 'top-left' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Sup. Esquerdo
                </button>
                <button
                  onClick={() => setPosition('top-right')}
                  className={`p-3 text-sm font-medium rounded-xl border transition-colors ${
                    position === 'top-right' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Sup. Direito
                </button>
                <button
                  onClick={() => setPosition('bottom-left')}
                  className={`p-3 text-sm font-medium rounded-xl border transition-colors ${
                    position === 'bottom-left' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Inf. Esquerdo
                </button>
                <button
                  onClick={() => setPosition('bottom-right')}
                  className={`p-3 text-sm font-medium rounded-xl border transition-colors ${
                    position === 'bottom-right' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Inf. Direito
                </button>
              </div>
            </div>

            {/* Tamanho */}
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 ">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  Tamanho do Avatar
                </div>
                <span className="text-indigo-600">{size}px</span>
              </label>
              <input
                type="range"
                min="100"
                max="400"
                step="10"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Pequeno</span>
                <span>Médio</span>
                <span>Grande</span>
              </div>
            </div>

            {/* Cor e Espessura da Borda */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ">
                <Palette className="w-4 h-4" />
                Estilo da Borda
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                />
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Espessura</span>
                    <span>{borderWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={borderWidth}
                    onChange={(e) => setBorderWidth(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Microfone */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ">
                <Mic className="w-4 h-4" />
                Microfone
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMicEnabled(true)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                    isMicEnabled
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span className="text-sm font-medium">Ligado</span>
                </button>
                <button
                  onClick={() => setMicEnabled(false)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                    !isMicEnabled
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <MicOff className="w-4 h-4" />
                  <span className="text-sm font-medium">Desligado</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                O áudio será capturado junto com o vídeo se você usar um software de gravação de tela (como OBS Studio ou Loom).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
