import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar as RadarIcon, 
  MapPin, 
  Bell, 
  Settings, 
  Zap, 
  ChevronRight,
  TrendingUp,
  History,
  Volume2,
  VolumeX,
  Smartphone
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Property {
  id: string;
  lat: number;
  lng: number;
  price: number;
  type: string;
  area: number;
  title: string;
  image: string;
}

interface PropertyRadarProps {
  properties: Property[];
  onPropertyClick: (id: string) => void;
}

// Haversine formula to calculate distance between two points in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the Earth in meters
  const q1 = (lat1 * Math.PI) / 180;
  const q2 = (lat2 * Math.PI) / 180;
  const dq = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dq / 2) * Math.sin(dq / 2) +
    Math.cos(q1) * Math.cos(q2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function PropertyRadar({ properties, onPropertyClick }: PropertyRadarProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radarEnabled, setRadarEnabled] = useState(false);
  const [radius, setRadius] = useState(1000); // meters
  const [detectedProperties, setDetectedProperties] = useState<Property[]>([]);
  const [lastDetectedIds, setLastDetectedIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context for the "ping" sound
  const playPing = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  const triggerVibration = () => {
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  // Get user location
  useEffect(() => {
    if (!radarEnabled) return;

    let watchId: number;

    const success = (pos: GeolocationPosition) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    };

    const error = (err: GeolocationPositionError) => {
      console.error('Radar location error:', err);
    };

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(success, error, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [radarEnabled]);

  // Scan loop
  useEffect(() => {
    if (!radarEnabled || !userLocation) return;

    const interval = setInterval(() => {
      const nearby = properties.filter(prop => {
        const dist = getDistance(userLocation.lat, userLocation.lng, prop.lat, prop.lng);
        return dist <= radius;
      });

      setDetectedProperties(nearby);

      // Check for new properties
      const newProps = nearby.filter(p => !lastDetectedIds.has(p.id));
      if (newProps.length > 0) {
        newProps.forEach(p => {
          const dist = getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng);
          
          playPing();
          triggerVibration();

          const newNotif = {
            id: Date.now() + Math.random(),
            propertyId: p.id,
            title: 'Imóvel encontrado próximo!',
            message: `R$ ${p.price.toLocaleString('pt-BR')} • ${Math.round(dist)}m de distância`,
            property: p
          };

          setNotifications(prev => [newNotif, ...prev]);
          setHistory(prev => [{ ...newNotif, time: new Date() }, ...prev].slice(0, 50));
          
          // Auto remove notification after 5s
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
          }, 5000);
        });

        const newIds = new Set(nearby.map(p => p.id));
        setLastDetectedIds(newIds);
      }
    }, 3000); // Scan every 3 seconds

    return () => clearInterval(interval);
  }, [radarEnabled, userLocation, properties, radius, lastDetectedIds, soundEnabled, vibrationEnabled]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Radar Left Side: Controls & Visual */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-card border border-border rounded-[2.5rem] shadow-xl relative overflow-hidden min-h-[500px]">
          
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
            
            <div className="flex items-center justify-between w-full mb-8">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Real-Time Radar</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Scanning for Opportunities</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={cn("p-2 rounded-xl transition-all border", soundEnabled ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-transparent text-muted-foreground")}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setVibrationEnabled(!vibrationEnabled)}
                  className={cn("p-2 rounded-xl transition-all border", vibrationEnabled ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-transparent text-muted-foreground")}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Radar UI */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-slate-950 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)] flex items-center justify-center overflow-hidden mb-8">
              
              {/* Radar Rings */}
              <div className={cn("absolute border border-emerald-500/20 rounded-full w-1/4 h-1/4", radarEnabled && "animate-[pulse_4s_infinite]")} />
              <div className={cn("absolute border border-emerald-500/20 rounded-full w-2/4 h-2/4", radarEnabled && "animate-[pulse_4s_infinite_1s]")} />
              <div className={cn("absolute border border-emerald-500/20 rounded-full w-3/4 h-3/4", radarEnabled && "animate-[pulse_4s_infinite_2s]")} />
              
              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-emerald-500/10" />
                <div className="h-full w-[1px] bg-emerald-500/10" />
              </div>

              {/* Scanning Line */}
              {radarEnabled && (
                <div className="absolute w-full h-full rounded-full bg-[conic-gradient(rgba(16,185,129,0.3)_0deg,rgba(16,185,129,0.05)_45deg,transparent_90deg)] animate-[spin_4s_linear_infinite]" />
              )}

              {/* Detected Property Dots */}
              {radarEnabled && userLocation && detectedProperties.map(p => {
                // Calculate relative position for display (clamped to radius)
                const dist = getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng);
                const angle = Math.atan2(p.lng - userLocation.lng, p.lat - userLocation.lat);
                
                // radius is 100% of display
                const rRatio = (dist / (radius * 1.1)) * 50; // max 50% from center
                const x = 50 + rRatio * Math.sin(angle);
                const y = 50 - rRatio * Math.cos(angle);

                return (
                  <motion.div
                    key={p.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] z-20 cursor-pointer"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => onPropertyClick(p.id)}
                  >
                    <div className="absolute -inset-2 bg-emerald-500/20 rounded-full animate-ping" />
                  </motion.div>
                );
              })}

              {/* Central User Marker */}
              <div className="relative z-30 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-white">
                <div className="absolute -inset-4 bg-primary/10 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Range de Busca</span>
                  <span className="text-sm font-bold text-primary">{radius} Metros</span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="5000" 
                  step="100" 
                  value={radius} 
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>

              <button
                onClick={() => setRadarEnabled(!radarEnabled)}
                className={cn(
                  "w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg",
                  radarEnabled 
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20" 
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                )}
              >
                {radarEnabled ? (
                  <>
                    <Zap className="w-5 h-5 fill-current" />
                    Desativar Radar
                  </>
                ) : (
                  <>
                    <RadarIcon className="w-5 h-5" />
                    Ativar Radar Inteligente
                  </>
                )}
              </button>
              
              {!radarEnabled && (
                <p className="text-[10px] text-center text-muted-foreground font-medium px-4">
                  O radar monitora imóveis em tempo real baseando-se na sua geolocalização.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Radar Right Side: Real-time Feed & Stats */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border p-4 rounded-[1.5rem] shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black uppercase text-muted-foreground mb-1">Detectados</span>
              <span className="text-2xl font-black text-emerald-500">{detectedProperties.length}</span>
            </div>
            <div className="bg-card border border-border p-4 rounded-[1.5rem] shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black uppercase text-muted-foreground mb-1">Status Radar</span>
              <span className={cn("text-sm font-black uppercase tracking-tighter", radarEnabled ? "text-emerald-500" : "text-muted-foreground")}>
                {radarEnabled ? 'Ativo' : 'Em Espera'}
              </span>
            </div>
            <div className="bg-card border border-border p-4 rounded-[1.5rem] shadow-sm flex flex-col items-center justify-center text-center hidden sm:flex">
              <span className="text-[10px] font-black uppercase text-muted-foreground mb-1">Oportunidades</span>
              <span className="text-2xl font-black text-primary">
                {detectedProperties.filter(p => p.type === 'Venda').length}
              </span>
            </div>
          </div>

          {/* Active Notifications / Feed */}
          <div className="flex-1 bg-card border border-border rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-black text-lg">Alertas Recentes</h3>
              </div>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase uppercase tracking-widest">Feed em Tempo Real</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
              <AnimatePresence mode="popLayout">
                {history.length > 0 ? history.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-4 bg-muted/20 border border-border rounded-2xl flex items-center gap-4 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer group"
                    onClick={() => onPropertyClick(item.propertyId)}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-border">
                      <img src={item.property.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-sm truncate">{item.property.title}</h4>
                        <span className="text-[10px] font-bold text-muted-foreground">{item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.message}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-40">
                    <RadarIcon className={cn("w-12 h-12 mb-4", radarEnabled && "animate-spin-slow")} />
                    <p className="text-sm font-bold uppercase tracking-widest">
                      {radarEnabled ? 'Aguardando detecção...' : 'Inicie o radar para buscar'}
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notifications (Global) */}
      <div className="fixed bottom-[max(6rem,env(safe-area-inset-bottom)+5rem)] left-4 right-4 sm:left-auto sm:right-8 sm:w-96 z-[100] pointer-events-none space-y-3">
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 50 }}
              className="bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500 pointer-events-auto cursor-pointer flex items-start gap-4 relative overflow-hidden"
              onClick={() => onPropertyClick(notif.propertyId)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-white/40" />
              <div className="p-2 bg-white/20 rounded-xl shrink-0">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-sm tracking-tight">{notif.title}</h4>
                <p className="text-xs text-white/90 mt-1 line-clamp-1">{notif.message}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Oportunidade Detectada</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
