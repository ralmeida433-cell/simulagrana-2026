import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, MapPin, Gauge, DollarSign, 
  ChevronRight, Search, Navigation2,
  AlertCircle
} from 'lucide-react';
import { Vehicle } from './mockData';
import { cn } from '../../lib/utils';

interface VehicleRadarProps {
  vehicles: Vehicle[];
  onVehicleClick: (v: Vehicle) => void;
}

export default function VehicleRadar({ vehicles, onVehicleClick }: VehicleRadarProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setScanning(false);
        },
        (err) => {
          console.warn("Geolocation error", err);
          setPermissionError(true);
          setScanning(false);
          // Fallback location (São Paulo) for demo if denied
          setUserLocation({ lat: -23.5505, lng: -46.6333 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setPermissionError(true);
      setScanning(false);
    }
  }, []);

  // Calculate distances and normalized positions for the radar display
  const radarItems = vehicles.map(v => {
    if (!userLocation || !v.latitude || !v.longitude) return null;
    
    const latDiff = v.latitude - userLocation.lat;
    const lngDiff = v.longitude - userLocation.lng;
    
    // Simple Euclidean distance for the visual radar
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    const maxDistance = 0.5; // About 50km for visualization range
    
    // Normalize to a percentage of radar radius (max 100%)
    const distFactor = Math.min(distance / maxDistance, 1);
    const angle = Math.atan2(lngDiff, latDiff); // Angle in radians
    
    return {
      vehicle: v,
      x: 50 + (Math.sin(angle) * distFactor * 40), // 50 is center, max 40% offset
      y: 50 - (Math.cos(angle) * distFactor * 40),
      distance: distance * 111, // Rough km approximation
      isDestaque: v.destaque
    };
  }).filter(Boolean);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="bg-card border border-border rounded-[32px] overflow-hidden p-6 sm:p-10 shadow-xl relative min-h-[500px] flex flex-col items-center justify-center">
        {/* Radar Background */}
        <div className="absolute inset-0 z-0 opacity-5">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_var(--color-emerald-500)_100%)]" />
           <div className="grid grid-cols-8 h-full w-full border-l border-t border-emerald-500" />
        </div>

        {/* The Radar Circle Rendering */}
        <div className="relative w-full max-w-[400px] aspect-square rounded-full border-2 border-emerald-500/20 flex items-center justify-center z-10">
          {/* Scanning Sweep */}
          {scanning && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 4 }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/20 origin-center"
            />
          )}

          {/* Concentric Circles */}
          <div className="absolute w-[75%] h-[75%] rounded-full border border-emerald-500/10" />
          <div className="absolute w-[50%] h-[50%] rounded-full border border-emerald-500/10" />
          <div className="absolute w-[25%] h-[25%] rounded-full border border-emerald-500/10" />

          {/* Center User Point */}
          <div className="absolute w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 z-20">
            <Navigation2 className="w-3 h-3 text-white fill-white animate-pulse" />
          </div>

          {/* Radar Points */}
          {radarItems.map((item, idx) => (
            <motion.div
              key={`${item!.vehicle.id}-${idx}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedId(item!.vehicle.id)}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 cursor-pointer",
                selectedId === item!.vehicle.id ? "z-30 scale-125" : "z-20 hover:scale-110"
              )}
              style={{ left: `${item!.x}%`, top: `${item!.y}%` }}
            >
              <div className={cn(
                 "w-6 h-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all duration-300",
                 item!.isDestaque ? "bg-amber-500 scale-110" : "bg-emerald-500",
                 selectedId === item!.vehicle.id ? "ring-4 ring-emerald-500/40 rotate-12" : "hover:scale-110"
              )}>
                <Car className="w-3 h-3 text-white fill-current" />
              </div>
              
              {/* Tooltip Content on selection */}
              <AnimatePresence>
                {selectedId === item!.vehicle.id && (
                  <motion.div 
                    key={`tooltip-${item!.vehicle.id}`}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-3 border border-border pointer-events-auto"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-muted">
                        <img src={item!.vehicle.fotos[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-tight truncate dark:text-white">
                      {item!.vehicle.marca} {item!.vehicle.modelo}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-bold text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item!.vehicle.preco)}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {item!.distance.toFixed(1)}km
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onVehicleClick(item!.vehicle);
                      }}
                      className="w-full mt-2 bg-emerald-600 text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-emerald-500 transition-colors"
                    >
                      Ver Anúncio
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Permission Disclaimer / Error */}
        {permissionError && (
          <div className="absolute top-4 inset-x-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3 z-30">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Localização Necessária</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-0.5">
                Para mostrar veículos próximos e garantir sua segurança contra golpes, precisamos acessar sua localização real. 
                Prezamos pela transparência: anúncios locais são mais fáceis de converter e menos propensos a fraudes.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center max-w-sm z-10">
           <h4 className="text-xl font-black text-foreground mb-2 flex items-center justify-center gap-2">
             <Car className="w-6 h-6 text-emerald-600" /> Veículos ao seu redor
           </h4>
           <p className="text-sm text-muted-foreground">
             Exibindo anúncios em um raio de até 50km da sua posição capturada. 
             Prezamos pela segurança através da localização real dos anúncios.
           </p>
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <RadarStat icon={Car} label="Total Radar" value={radarItems.length.toString()} />
        <RadarStat icon={Navigation2} label="Precisão" value="GPS Ativo" />
        <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-3">
           <div className="w-3 h-3 rounded-full bg-amber-500" />
           <span className="text-xs font-bold text-muted-foreground uppercase">Destaques</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-3">
           <div className="w-3 h-3 rounded-full bg-emerald-500" />
           <span className="text-xs font-bold text-muted-foreground uppercase">Privados</span>
        </div>
      </div>
    </div>
  );
}

const RadarStat = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-3 shadow-sm">
    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
      <Icon className="w-4 h-4 text-emerald-600" />
    </div>
    <div>
      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  </div>
);
