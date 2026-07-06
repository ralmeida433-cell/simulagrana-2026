import { useState, useRef } from 'react';

export function useVideoRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      setRecordingError(null);
      // Verifica se a API de gravação de tela está disponível no navegador atual
      if (!navigator.mediaDevices || !(navigator.mediaDevices as any).getDisplayMedia) {
        throw new Error("Gravação bloqueada no preview (getDisplayMedia ausent).");
      }

      // Use getDisplayMedia robustly
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true
      });

      // Solicita o microfone
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      // Combina o vídeo da tela com o áudio do microfone
      const tracks = [
        ...screenStream.getVideoTracks(),
        ...micStream.getAudioTracks()
      ];

      const stream = new MediaStream(tracks);
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingTime(0);

        // Para todas as faixas para liberar a câmera/tela
        stream.getTracks().forEach(track => track.stop());
        screenStream.getTracks().forEach(track => track.stop());
        micStream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Salva chunks a cada 1s
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Se o usuário parar o compartilhamento pela interface do navegador
      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

    } catch (err: any) {
      console.error("Erro ao iniciar gravação:", err);
      // Sempre instruir o usuário a abrir em nova aba se houver qualquer erro de acesso
      if (err.name === 'NotAllowedError' || err.message?.includes('Gravação bloqueada') || err.message?.includes('not supported') || err.message?.includes('is not a function')) {
        setRecordingError("Abra o app em Nova Aba para gravar \u2197\ufe0f");
      } else {
        setRecordingError("Permissão de tela/câmera negada.");
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const clearRecordedVideo = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    chunksRef.current = [];
  };

  return {
    isRecording,
    isPaused,
    recordingTime,
    recordedVideoUrl,
    recordingError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecordedVideo
  };
}
