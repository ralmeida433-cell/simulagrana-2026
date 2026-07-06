import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

let deferredPrompt: any;

export default function InstallPWA() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent;
    const webkit = !!ua.match(/WebKit/i);
    const isIPad = !!ua.match(/iPad/i);
    const isIPhone = !!ua.match(/iPhone/i);
    const isIOSDevice = isIPad || isIPhone;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone === true);

    if (isIOSDevice && webkit && !isStandalone) {
      setIsIOS(true);
      // Show iOS prompt conditionally if we haven't dismissed it
      if (localStorage.getItem('simulagrana_pwa_dismissed') !== 'true') {
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    }

    // Android/Chrome logic
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      if (localStorage.getItem('simulagrana_pwa_dismissed') !== 'true') {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      deferredPrompt = null;
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('simulagrana_pwa_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showInstallPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-card text-card-foreground border border-border shadow-2xl rounded-2xl p-4 z-[100] flex flex-col gap-3"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:bg-accent rounded-full touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <img src="/simulagranalogo.svg" alt="App Icon" className="w-8 h-8 pointer-events-none" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-foreground">Instalar SimulaGrana</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione à tela inicial para acesso rápido, experiência em tela cheia e modo offline.
              </p>
            </div>
          </div>
          
          {isIOS ? (
            <div className="bg-muted p-3 flex items-center gap-3 rounded-xl border border-border/50 text-[11px] text-muted-foreground">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 bg-background rounded shadow-sm border border-border text-foreground">
                <Share className="w-3.5 h-3.5" />
              </span>
              <p>
                Toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
              </p>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors active:scale-95 touch-manipulation text-sm mt-1"
            >
              <Download className="w-4 h-4" />
              Instalar App
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
