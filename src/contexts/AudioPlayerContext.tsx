import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { isAIConfigured, generateContentWithRetry } from '../services/aiService';
import { Modality } from '@google/genai';

export const SPEEDS = [
  { id: 1, label: '1x (Natural)' },
  { id: 1.25, label: '1.25x' },
  { id: 1.5, label: '1.5x' },
  { id: 1.75, label: '1.75x' },
  { id: 2, label: '2x (Rápido)' },
];

export const VOICES = [
  { id: 'kokoro-male', name: 'IA Narradora Premium - Felipe', engine: 'gemini', voiceName: 'Puck' },
];

interface AudioPlayerContextType {
  play: (text: string, title: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  setVoice: (voiceId: string) => void;
  seekTo: (time: number) => void;
  seekBy: (seconds: number) => void;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTitle: string;
  currentText: string;
  speed: number;
  selectedVoiceId: string;
  voices: any[];
  currentTime: number;
  duration: number;
  getProgress: (text: string) => number;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  
  const [voices, setVoices] = useState<any[]>(VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('kokoro-male');
  const [speed, setSpeed] = useState<number>(1);
  
  const [showSetup, setShowSetup] = useState(false);
  const [pendingPlay, setPendingPlay] = useState<{text: string, title: string} | null>(null);
  const saveDefaultRef = useRef<HTMLInputElement>(null);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const engineRef = useRef<'gemini' | 'native'>('gemini');
  const keepAliveIntervalRef = useRef<number | null>(null);
  const nativeTimeoutRef = useRef<number | null>(null);

  const clearKeepAlive = () => {
    if (keepAliveIntervalRef.current) {
      window.clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  };

  const getTextHash = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  const getProgress = (text: string) => {
    const hash = getTextHash(text);
    return progressMap[hash] || 0;
  };

  useEffect(() => {
    const prefs = localStorage.getItem('simulagrana_audio_prefs');
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        if (parsed.voiceId) setSelectedVoiceId(parsed.voiceId);
        if (parsed.speed) setSpeed(parsed.speed);
        if (parsed.progressMap) setProgressMap(parsed.progressMap);
      } catch (e) {
        console.error('Failed to parse audio prefs', e);
      }
    }

    const loadNativeVoices = () => {
      const available = window.speechSynthesis.getVoices();
      const ptVoices = available.filter(v => v.lang.startsWith('pt')).map((v, i) => ({
        id: `native-${v.voiceURI}-${i}`,
        name: `💻 Nativo - ${v.name}`,
        engine: 'native',
        nativeVoice: v
      }));
      setVoices([...VOICES, ...ptVoices]);
    };
    
    loadNativeVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadNativeVoices;
    }
    
    return () => stop();
  }, []);

  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      try {
        if (isPlaying) {
          navigator.mediaSession.playbackState = 'playing';
          if ('MediaMetadata' in window) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: currentTitle || 'Relatório de Análise',
              artist: 'SimulaGrana',
              album: 'Análise de Investimentos',
              artwork: [
                { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
              ]
            });
          }

          navigator.mediaSession.setActionHandler('play', () => {
            resume();
          });
          navigator.mediaSession.setActionHandler('pause', () => {
            pause();
          });
          navigator.mediaSession.setActionHandler('stop', () => {
            stop();
          });
        } else if (isPaused) {
          navigator.mediaSession.playbackState = 'paused';
        } else {
          navigator.mediaSession.playbackState = 'none';
        }
      } catch (e) {
        console.error("MediaSession error:", e);
      }
    }
  }, [isPlaying, isPaused, currentTitle]);

  const stop = (keepMetadata = false) => {
    clearKeepAlive();
    if (nativeTimeoutRef.current) {
      window.clearTimeout(nativeTimeoutRef.current);
      nativeTimeoutRef.current = null;
    }
    if (audioElementRef.current) {
      // Save progress before stopping
      if (currentText) {
        const hash = getTextHash(currentText);
        const time = audioElementRef.current.currentTime;
        if (time > 0) {
          setProgressMap(prev => {
            const next = { ...prev, [hash]: time };
            localStorage.setItem('simulagrana_audio_prefs', JSON.stringify({ 
              voiceId: selectedVoiceId, 
              speed, 
              progressMap: next 
            }));
            return next;
          });
        }
      }

      audioElementRef.current.onended = null;
      audioElementRef.current.onerror = null;
      audioElementRef.current.onloadedmetadata = null;
      audioElementRef.current.ontimeupdate = null;
      audioElementRef.current.pause();
      if (!keepMetadata) {
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.removeAttribute('src'); // Clean up
      }
      audioElementRef.current = null;
    }
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
    setCurrentTime(0);
    setDuration(0);
    
    if (!keepMetadata) {
      console.log("stop() cleared currentText");
      setCurrentText('');
      setCurrentTitle('');
    }
  };

  const pause = async () => {
    if (engineRef.current === 'gemini' && audioElementRef.current) {
      audioElementRef.current.pause();
    } else {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
    setIsPlaying(false);
  };

  const resume = async () => {
    if (engineRef.current === 'gemini' && audioElementRef.current) {
      await audioElementRef.current.play();
    } else {
      window.speechSynthesis.resume();
    }
    setIsPaused(false);
    setIsPlaying(true);
  };

  const stripMarkdown = (md: string) => {
    // If it looks like JSON, don't read it raw
    if (md.trim().startsWith('{') && md.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(md);
        if (parsed.narrationText) return parsed.narrationText;
        if (parsed.strategicDecision?.justification) return parsed.strategicDecision.justification;
      } catch (e) {
        // Not valid JSON or failed to parse
      }
      return "O relatório está sendo processado para narração. Por favor, aguarde a conclusão da análise visual.";
    }

    return md
      .replace(/[#*`_]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\n+/g, '. ');
  };

  const createWavBlob = (pcm16Array: Int16Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + pcm16Array.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcm16Array.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, 1, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, pcm16Array.length * 2, true);

    let offset = 44;
    for (let i = 0; i < pcm16Array.length; i++, offset += 2) {
      view.setInt16(offset, pcm16Array[i], true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const playBase64Audio = async (base64Data: string, startTime = 0) => {
    stop(true); // Ensure any previous audio is stopped but keep metadata to prevent unmount

    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    let blob: Blob;
    
    // Detect audio format from magic numbers
    const headerStr = String.fromCharCode(...bytes.slice(0, 4));
    const isRiff = headerStr === 'RIFF';
    const isOgg = headerStr === 'OggS';
    const isFlac = headerStr === 'fLaC';
    const isWebm = bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3;
    const isMp3 = (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) || String.fromCharCode(...bytes.slice(0, 3)) === 'ID3';
    const isMp4 = String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp';

    if (isRiff) {
      blob = new Blob([bytes], { type: 'audio/wav' });
    } else if (isOgg) {
      blob = new Blob([bytes], { type: 'audio/ogg' });
    } else if (isMp3) {
      blob = new Blob([bytes], { type: 'audio/mpeg' });
    } else if (isFlac) {
      blob = new Blob([bytes], { type: 'audio/flac' });
    } else if (isWebm) {
      blob = new Blob([bytes], { type: 'audio/webm' });
    } else if (isMp4) {
      blob = new Blob([bytes], { type: 'audio/mp4' });
    } else {
      // Assume raw PCM 16-bit 24000Hz
      // Ensure even length for 16-bit PCM
      const dataLength = bytes.length % 2 === 0 ? bytes.length : bytes.length - 1;
      const buffer = new ArrayBuffer(44 + dataLength);
      const view = new DataView(buffer);

      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + dataLength, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true); // Subchunk1Size
      view.setUint16(20, 1, true); // AudioFormat (PCM)
      view.setUint16(22, 1, true); // NumChannels
      view.setUint32(24, 24000, true); // SampleRate
      view.setUint32(28, 24000 * 2, true); // ByteRate
      view.setUint16(32, 2, true); // BlockAlign
      view.setUint16(34, 16, true); // BitsPerSample
      writeString(36, 'data');
      view.setUint32(40, dataLength, true);

      const outArray = new Uint8Array(buffer);
      outArray.set(new Uint8Array(bytes.buffer, bytes.byteOffset, dataLength), 44);

      blob = new Blob([buffer], { type: 'audio/wav' });
    }

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    // This is the magic property that preserves pitch when speeding up
    audio.preservesPitch = true; 
    audio.playbackRate = speed;
    
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      if (startTime > 0 && startTime < audio.duration) {
        audio.currentTime = startTime;
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      // Periodically save progress (every 5 seconds)
      if (Math.floor(audio.currentTime) % 5 === 0 && currentText) {
        const hash = getTextHash(currentText);
        setProgressMap(prev => {
          const next = { ...prev, [hash]: audio.currentTime };
          localStorage.setItem('simulagrana_audio_prefs', JSON.stringify({ 
            voiceId: selectedVoiceId, 
            speed, 
            progressMap: next 
          }));
          return next;
        });
      }
    };

    audio.onended = () => {
      console.log("audio.onended fired");
      if (currentText) {
        const hash = getTextHash(currentText);
        setProgressMap(prev => {
          const { [hash]: _, ...rest } = prev;
          localStorage.setItem('simulagrana_audio_prefs', JSON.stringify({ 
            voiceId: selectedVoiceId, 
            speed, 
            progressMap: rest 
          }));
          return rest;
        });
      }
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentText('');
      setCurrentTime(0);
      setDuration(0);
      URL.revokeObjectURL(url);
    };

    audio.onerror = (e) => {
      console.error("Error playing audio element", e);
      setIsPlaying(false);
      setIsLoading(false);
      URL.revokeObjectURL(url);
    };
    
    audioElementRef.current = audio;
    
    try {
      // Wait for the audio to be ready to play
      await new Promise((resolve, reject) => {
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          resolve(null);
        };
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('error', reject);
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error("Audio load timeout")), 10000);
      });

      await audio.play();
      
      // Ensure startTime is applied after play starts for better stability in some browsers
      if (startTime > 0 && startTime < audio.duration) {
        audio.currentTime = startTime;
      }
      
      setIsPlaying(true);
      setIsPaused(false);
    } catch (e) {
      console.error("Audio play failed", e);
      setIsPlaying(false);
      setIsLoading(false);
      URL.revokeObjectURL(url);
    }
  };

  const playNativeAudio = (cleanText: string, voice?: SpeechSynthesisVoice) => {
    console.log("[AudioPlayer] Playing native audio, text length:", cleanText.length);
    if (!cleanText) {
      console.warn("[AudioPlayer] Empty text provided to playNativeAudio");
      return;
    }

    // Stop and clear
    window.speechSynthesis.cancel();
    clearKeepAlive();
    
    if (nativeTimeoutRef.current) {
      window.clearTimeout(nativeTimeoutRef.current);
      nativeTimeoutRef.current = null;
    }

    // Chunking text securely
    const textToChunk = cleanText.replace(/\s+/g, ' ').trim();
    const chunks: string[] = [];
    const maxChunkLen = 200;
    let start = 0;
    while (start < textToChunk.length) {
      let end = start + maxChunkLen;
      if (end >= textToChunk.length) {
        chunks.push(textToChunk.slice(start));
        break;
      }
      let lastPunc = Math.max(
        textToChunk.lastIndexOf('.', end),
        textToChunk.lastIndexOf('!', end),
        textToChunk.lastIndexOf('?', end),
        textToChunk.lastIndexOf(';', end),
        textToChunk.lastIndexOf(':', end)
      );
      let lastSpace = textToChunk.lastIndexOf(' ', end);
      
      let splitAt = lastPunc > start ? lastPunc + 1 : (lastSpace > start ? lastSpace : end);
      chunks.push(textToChunk.slice(start, splitAt).trim());
      start = splitAt;
    }

    let currentSentenceIndex = 0;
    setIsPlaying(true);
    setIsPaused(false);

    const playNextChunk = () => {
      // If stopped manually, utteranceRef is null
      if (currentSentenceIndex >= chunks.length || !utteranceRef.current) {
        console.log("Todos os chunks finalizados");
        clearKeepAlive();
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentText(prev => prev === cleanText ? '' : prev);
        return;
      }

      const chunkText = chunks[currentSentenceIndex];
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = "pt-BR";
      
      if (voice) {
        utterance.voice = voice;
      } else {
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang === 'pt-BR') || voices.find(v => v.lang.startsWith('pt'));
        if (ptVoice) utterance.voice = ptVoice;
      }
      
      utterance.rate = speed;
      
      utterance.onend = () => {
        if (!utteranceRef.current) return;
        currentSentenceIndex++;
        playNextChunk();
      };
      
      utterance.onerror = (e) => {
        console.error("Native audio error:", e);
        if (e.error === 'canceled' || e.error === 'interrupted') {
          // Ignored
        } else {
          clearKeepAlive();
          setIsPlaying(false);
          setIsPaused(false);
        }
      };
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    utteranceRef.current = new SpeechSynthesisUtterance("init");
    playNextChunk();
  };

  const play = async (text: string, title: string, skipSetup = false, startTime = 0) => {
    if (!skipSetup) {
      const prefs = localStorage.getItem('simulagrana_audio_prefs');
      if (!prefs && !showSetup) {
        setPendingPlay({ text, title });
        setShowSetup(true);
        return;
      }
    }

    // If startTime is not provided, check if we have saved progress
    let actualStartTime = startTime;
    if (actualStartTime === 0) {
      actualStartTime = getProgress(text);
    }

    // If we are already playing this exact text, and it's just a restart for settings, 
    // we keep the metadata to prevent GlobalAudioPlayer from unmounting
    const isRestart = currentText === text;
    stop(isRestart); 
    
    setCurrentText(text);
    setCurrentTitle(title);

    let selectedVoice = voices.find(v => v.id === selectedVoiceId);
    if (!selectedVoice) {
      selectedVoice = voices[0];
      setSelectedVoiceId(selectedVoice.id);
    }
    if (!selectedVoice) return;

    const cleanText = stripMarkdown(text);
    engineRef.current = selectedVoice.engine;
    console.log(`[AudioPlayer] Starting playback. Engine: ${selectedVoice.engine}, Voice: ${selectedVoice.name}, Text length: ${cleanText.length}, StartTime: ${actualStartTime}`);
    
    if (selectedVoice.engine === 'gemini') {
      const configured = isAIConfigured();
      if (!configured) {
        console.warn("Gemini API key not configured, falling back to native TTS.");
        engineRef.current = 'native';
        playNativeAudio(cleanText);
        return;
      }

      setIsLoading(true);
      try {
        const response = await generateContentWithRetry({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: cleanText }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice.voiceName }
              }
            }
          }
        });
        
        let base64Audio = "";
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              base64Audio = part.inlineData.data;
              break;
            }
          }
        }

        if (base64Audio) {
          setIsLoading(false);
          await playBase64Audio(base64Audio, actualStartTime);
        } else {
          throw new Error("No audio data in response");
        }
      } catch (error) {
        console.error("Gemini TTS Error, falling back to native:", error);
        setIsLoading(false);
        engineRef.current = 'native';
        playNativeAudio(cleanText);
      }
    } else if (['chatterbox', 'orpheus', 'kokoro', 'parler', 'piper'].includes(selectedVoice.engine)) {
      console.log(`[SimulaGrana] Chamada para backend ${selectedVoice.engine} pendente. Usando fallback nativo.`);
      engineRef.current = 'native';
      playNativeAudio(cleanText);
    } else {
      playNativeAudio(cleanText, selectedVoice.nativeVoice);
    }
  };

  const handleSetVoice = (voiceId: string) => {
    const oldVoiceId = selectedVoiceId;
    setSelectedVoiceId(voiceId);
    
    if (localStorage.getItem('simulagrana_audio_prefs')) {
      localStorage.setItem('simulagrana_audio_prefs', JSON.stringify({ voiceId, speed }));
    }
    
    if (isPlaying || isPaused) {
      // Capture current time if using Gemini
      let startTime = 0;
      if (engineRef.current === 'gemini' && audioElementRef.current) {
        startTime = audioElementRef.current.currentTime;
      }
      
      // Restart with new voice and previous time
      play(currentText, currentTitle, true, startTime);
    }
  };

  const handleSetSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (localStorage.getItem('simulagrana_audio_prefs')) {
      localStorage.setItem('simulagrana_audio_prefs', JSON.stringify({ voiceId: selectedVoiceId, speed: newSpeed }));
    }
    if (isPlaying || isPaused) {
      if (engineRef.current === 'native') {
        // Native needs restart to apply speed
        play(currentText, currentTitle, true);
      } else if (engineRef.current === 'gemini' && audioElementRef.current) {
        // Gemini can update speed in real-time
        audioElementRef.current.playbackRate = newSpeed;
      }
    }
  };

  const seekTo = (time: number) => {
    if (engineRef.current === 'gemini' && audioElementRef.current && duration > 0) {
      if (time >= 0 && time <= duration) {
        audioElementRef.current.currentTime = time;
        setCurrentTime(time);
        
        // Save progress explicitly on seek
        if (currentText) {
            const hash = getTextHash(currentText);
            setProgressMap(prev => {
              const next = { ...prev, [hash]: time };
              localStorage.setItem('simulagrana_audio_prefs', JSON.stringify({ 
                voiceId: selectedVoiceId, 
                speed, 
                progressMap: next 
              }));
              return next;
            });
        }
      }
    }
  };

  const seekBy = (seconds: number) => {
    if (engineRef.current === 'gemini' && audioElementRef.current) {
         seekTo(audioElementRef.current.currentTime + seconds);
    }
  };

  return (
    <AudioPlayerContext.Provider value={{
      play, pause, resume, stop, setSpeed: handleSetSpeed, setVoice: handleSetVoice,
      seekTo, seekBy,
      isPlaying, isPaused, isLoading, currentTitle, currentText, speed, selectedVoiceId, voices,
      currentTime, duration, getProgress
    }}>
      {children}
      
      {showSetup && pendingPlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-transparent dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-foreground mb-2">Configuração de Áudio</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Antes de começar, escolha como prefere ouvir as análises.</p>
            
            {/* Voice Selection */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Narrador</label>
              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-muted/50 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <optgroup label="Vozes Premium (Assinatura)">
                  {voices.filter(v => v.engine === 'gemini').map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Modelos Open-Source (Gratuito)">
                  {voices.filter(v => ['chatterbox', 'orpheus', 'kokoro', 'parler', 'piper'].includes(v.engine)).map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Vozes Nativas (Offline/Fallback)">
                  {voices.filter(v => v.engine === 'native').map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Speed Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Velocidade</label>
              <div className="grid grid-cols-2 gap-2">
                {SPEEDS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSpeed(s.id)}
                    className={`py-2 px-3 text-sm font-medium rounded-xl border transition-colors ${
                      speed === s.id 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Default Checkbox */}
            <div className="mb-6 flex items-center gap-2">
              <input 
                type="checkbox" 
                id="saveDefault" 
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-emerald-500"
                defaultChecked={true}
                ref={saveDefaultRef}
              />
              <label htmlFor="saveDefault" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                Tornar padrão para as próximas vezes
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSetup(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (saveDefaultRef.current?.checked) {
                    localStorage.setItem('simulagrana_audio_prefs', JSON.stringify({ voiceId: selectedVoiceId, speed }));
                  }
                  setShowSetup(false);
                  play(pendingPlay.text, pendingPlay.title, true);
                }}
                className="px-6 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl transition-colors shadow-sm"
              >
                Ouvir Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
