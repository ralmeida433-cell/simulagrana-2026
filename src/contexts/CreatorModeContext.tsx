import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useVideoRecorder } from '../hooks/useVideoRecorder';

type Shape = 'circle' | 'square';
type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface CreatorModeState {
  isCameraActive: boolean;
  isStudioActive: boolean;
  shape: Shape;
  borderColor: string;
  borderWidth: number;
  size: number;
  isMicEnabled: boolean;
  position: Position;
  setCameraActive: (active: boolean) => void;
  setStudioActive: (active: boolean) => void;
  setShape: (shape: Shape) => void;
  setBorderColor: (color: string) => void;
  setBorderWidth: (width: number) => void;
  setSize: (size: number) => void;
  setMicEnabled: (enabled: boolean) => void;
  setPosition: (position: Position) => void;
  
  // Video Recording State
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  recordedVideoUrl: string | null;
  recordingError: string | null;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  clearRecordedVideo: () => void;
}

const CreatorModeContext = createContext<CreatorModeState | undefined>(undefined);

export function CreatorModeProvider({ children }: { children: ReactNode }) {
  const [isCameraActive, setCameraActive] = useState(false);
  const [isStudioActive, setStudioActive] = useState(false);
  const [shape, setShape] = useState<Shape>('circle');
  const [borderColor, setBorderColor] = useState('#10b981'); // emerald-500
  const [borderWidth, setBorderWidth] = useState(4);
  const [size, setSize] = useState(200);
  const [isMicEnabled, setMicEnabled] = useState(true);
  const [position, setPosition] = useState<Position>('bottom-right');

  const {
    isRecording,
    isPaused,
    recordingTime,
    recordedVideoUrl,
    recordingError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecordedVideo,
  } = useVideoRecorder();

  return (
    <CreatorModeContext.Provider
      value={{
        isCameraActive,
        isStudioActive,
        shape,
        borderColor,
        borderWidth,
        size,
        isMicEnabled,
        position,
        setCameraActive,
        setStudioActive,
        setShape,
        setBorderColor,
        setBorderWidth,
        setSize,
        setMicEnabled,
        setPosition,
        // Recording
        isRecording,
        isPaused,
        recordingTime,
        recordedVideoUrl,
        recordingError,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        clearRecordedVideo,
      }}
    >
      {children}
    </CreatorModeContext.Provider>
  );
}

export function useCreatorMode() {
  const context = useContext(CreatorModeContext);
  if (context === undefined) {
    throw new Error('useCreatorMode must be used within a CreatorModeProvider');
  }
  return context;
}
