import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Crosshair, Building2, BellRing, Loader2 } from 'lucide-react';

// Fix Leaflet default icon issues in Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const houseIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map when location is found
function RecenterAutomatically({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14, { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function NearbyPropertiesMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [notification, setNotification] = useState<any>(null);

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pleo seu navegador.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        setLoading(false);
        generateMockProperties(latitude, longitude);
      },
      (err) => {
        setError(err.message || 'Permissão negada ou erro ao buscar localização.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    // Try to get location automatically on mount if already granted
    navigator.permissions?.query({ name: 'geolocation' }).then(res => {
      if (res.state === 'granted') {
        requestLocation();
      }
    });
  }, []);

  const generateMockProperties = (lat: number, lng: number) => {
    // Generate 3-5 random properties nearby (within ~3km)
    const count = Math.floor(Math.random() * 3) + 3;
    const newProps = Array.from({ length: count }).map((_, i) => {
      // Offset max ~0.02 degrees (~2km)
      const latOffset = (Math.random() - 0.5) * 0.04;
      const lngOffset = (Math.random() - 0.5) * 0.04;
      
      const distance = Math.sqrt(latOffset * latOffset + lngOffset * lngOffset) * 111; // rough km
      
      return {
        id: `prop-${i}`,
        title: i % 2 === 0 ? 'Apartamento Decorado' : 'Casa em Condomínio',
        price: 450000 + Math.random() * 1000000,
        type: i % 3 === 0 ? 'Locação' : 'Venda',
        lat: lat + latOffset,
        lng: lng + lngOffset,
        distance: distance.toFixed(1),
        image: i % 2 === 0 
          ? 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=80'
          : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80'
      };
    });
    
    setProperties(newProps);

    // Simulate "Perto de Você" Notification if the closest is within 1km
    const closest = newProps.reduce((prev, curr) => (parseFloat(curr.distance) < parseFloat(prev.distance) ? curr : prev));
    if (parseFloat(closest.distance) <= 1.0) {
      setTimeout(() => {
        setNotification({
          title: `Imóvel disponível a ${Number(closest.distance) * 1000}m de você!`,
          desc: `${closest.title} - R$ ${closest.price.toLocaleString('pt-BR')}`,
          prop: closest
        });
        
        // Hide after 6 seconds
        setTimeout(() => setNotification(null), 6000);
      }, 3000);
    }
  };

  return (
    <div className="relative flex flex-col h-[600px] bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      {/* HUD Header */}
      <div className="absolute top-0 inset-x-0 z-[400] p-4 flex items-center justify-between pointer-events-none">
        <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-xl border border-border shadow-sm pointer-events-auto flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-500" />
          <div>
            <h3 className="font-bold text-sm">Explorador Inteligente</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Baseado na sua localização</p>
          </div>
        </div>
        
        <button 
          onClick={requestLocation}
          className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg pointer-events-auto hover:scale-105 active:scale-95 transition-transform"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
        </button>
      </div>

      {/* Dynamic Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-20 right-4 z-[500] max-w-sm w-full bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl border border-emerald-400 pointer-events-auto cursor-pointer hover:bg-emerald-600 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold">{notification.title}</h4>
                <p className="text-sm text-emerald-50 mt-1">{notification.desc}</p>
                <div className="mt-3 text-xs font-bold bg-white/20 inline-block px-3 py-1 rounded-full uppercase tracking-wider">
                  Tocar para ver detalhes
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!position && !loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10 bg-muted/20">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Navigation className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black mb-3">Ative a Localização</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Encontre as melhores oportunidades de imóveis exatamente onde você está. Nossa IA prioriza ofertas baseadas na sua região em tempo real.
          </p>
          <button 
            onClick={requestLocation}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 text-sm uppercase tracking-wider"
          >
            Habilitar Radar Geográfico
          </button>
          {error && <p className="text-rose-500 mt-4 text-sm font-semibold">{error}</p>}
        </div>
      ) : loading ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="font-bold text-muted-foreground animate-pulse">Sincronizando coordenadas...</p>
        </div>
      ) : position ? (
        <div className="flex-1 relative z-0">
          <MapContainer 
            center={position} 
            zoom={14} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles"
            />
            <RecenterAutomatically lat={position[0]} lng={position[1]} />
            
            {/* User Location */}
            <Marker position={position} icon={userIcon}>
              <Popup>
                <div className="font-bold text-center">Você está aqui</div>
              </Popup>
            </Marker>
            
            {/* 3km Radar Circle radius in meters */}
            <Circle 
              center={position} 
              radius={3000} 
              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, dashArray: '5, 10' }} 
            />

            {/* Properties Markers */}
            {properties.map(prop => (
              <Marker key={prop.id} position={[prop.lat, prop.lng]} icon={houseIcon}>
                <Popup className="custom-popup">
                  <div className="w-48 overflow-hidden rounded-xl">
                    <img src={prop.image} alt={prop.title} className="w-full h-24 object-cover" />
                    <div className="p-3">
                      <div className="text-[10px] font-black uppercase text-primary mb-1">{prop.type} • {prop.distance}km</div>
                      <h4 className="font-bold text-sm leading-tight mb-2">{prop.title}</h4>
                      <div className="font-black text-emerald-600">R$ {prop.price.toLocaleString('pt-BR')}</div>
                      <button className="w-full mt-3 bg-primary/10 text-primary hover:bg-primary hover:text-white py-1.5 rounded-lg text-xs font-bold transition-colors">
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : null}
    </div>
  );
}
