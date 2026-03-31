// ImageBasedDatacenter.jsx — Escape Room con imagen de fondo + hotspots
// Mismo patrón que ImageBasedOffice pero para el Analista
// Integra: timer, enviar pistas, terminal bloqueada

import { useState, useCallback } from 'react';

// ─── DATACENTER THEMES ──────────────────────────────────────────────
const DC_THEMES = {
  datacenter: [
    {
      id: 'pasillo',
      name: 'Pasillo de Racks',
      image: '/assets/rooms/datacenter-pasillo.jpg',
      fallbackBg: 'linear-gradient(180deg, #0c0e12 0%, #060708 100%)',
      hotspots: [
        // REALES — 5 objetos con pistas BIAN
        { id: 'servidor-humeante', x: 5, y: 8, w: 12, h: 55, real: true, label: 'Rack humeante' },
        { id: 'computadora-bloqueada', x: 55, y: 62, w: 14, h: 18, real: true, label: 'Terminal' },
        { id: 'postit-teclado', x: 55, y: 82, w: 10, h: 6, real: true, label: 'Post-it' },
        { id: 'carpeta-escritorio', x: 68, y: 72, w: 10, h: 8, real: true, label: 'Carpeta' },
        { id: 'log-errores', x: 35, y: 25, w: 25, h: 18, real: true, label: 'Monitor de errores' },
        // FALSOS
        { id: 'f-rack2', x: 82, y: 8, w: 12, h: 55, real: false },
        { id: 'f-rack3', x: 18, y: 12, w: 10, h: 45, real: false },
        { id: 'f-rack4', x: 72, y: 12, w: 10, h: 45, real: false },
        { id: 'f-cables', x: 42, y: 50, w: 12, h: 20, real: false },
        { id: 'f-floorcable', x: 30, y: 78, w: 25, h: 8, real: false },
        { id: 'f-backrack', x: 38, y: 28, w: 20, h: 30, real: false },
        { id: 'f-light', x: 30, y: 3, w: 35, h: 6, real: false },
        { id: 'f-floortile', x: 40, y: 68, w: 15, h: 8, real: false },
        { id: 'f-extinguisher', x: 28, y: 55, w: 5, h: 12, real: false },
      ]
    },
    {
      id: 'sala',
      name: 'Sala de Servidores',
      image: '/assets/rooms/datacenter-sala.jpg',
      fallbackBg: 'linear-gradient(135deg, #110f0d 0%, #080706 100%)',
      hotspots: [
        { id: 'servidor-humeante', x: 3, y: 10, w: 14, h: 65, real: true, label: 'Servidor humeante' },
        { id: 'computadora-bloqueada', x: 65, y: 45, w: 12, h: 16, real: true, label: 'Terminal bloqueada' },
        { id: 'postit-teclado', x: 66, y: 63, w: 8, h: 7, real: true, label: 'Post-it' },
        { id: 'carpeta-escritorio', x: 30, y: 55, w: 10, h: 6, real: true, label: 'Carpeta' },
        { id: 'log-errores', x: 32, y: 38, w: 30, h: 18, real: true, label: 'Pantalla monitoreo' },
        { id: 'f-rack5', x: 78, y: 12, w: 10, h: 60, real: false },
        { id: 'f-rack6', x: 88, y: 12, w: 10, h: 60, real: false },
        { id: 'f-rack2', x: 17, y: 10, w: 12, h: 65, real: false },
        { id: 'f-chair', x: 48, y: 72, w: 8, h: 10, real: false },
        { id: 'f-door', x: 94, y: 15, w: 5, h: 55, real: false },
        { id: 'f-cabletray', x: 5, y: 5, w: 85, h: 3, real: false },
        { id: 'f-floortile', x: 42, y: 76, w: 8, h: 5, real: false },
        { id: 'f-extinguisher', x: 76, y: 52, w: 3, h: 10, real: false },
      ]
    }
  ],
  sala_reuniones: [
    {
      id: 'sala-exec',
      name: 'Sala Ejecutiva',
      image: '/assets/rooms/sala-reuniones.jpg',
      fallbackBg: 'linear-gradient(135deg, #14130f 0%, #0a0908 100%)',
      hotspots: [
        { id: 'proyector', x: 5, y: 3, w: 28, h: 35, real: true, label: 'Pantalla proyector' },
        { id: 'archivos-confidenciales', x: 75, y: 35, w: 12, h: 14, real: true, label: 'Archivos rojos' },
        { id: 'foto-organigrama', x: 42, y: 30, w: 18, h: 18, real: true, label: 'Organigrama' },
        { id: 'telefono-mensajes', x: 52, y: 62, w: 8, h: 6, real: true, label: 'Teléfono' },
        { id: 'caja-fuerte', x: 88, y: 32, w: 9, h: 18, real: true, label: 'Caja fuerte' },
        { id: 'f-chairs', x: 15, y: 72, w: 12, h: 15, real: false },
        { id: 'f-chair2', x: 60, y: 72, w: 12, h: 15, real: false },
        { id: 'f-table', x: 12, y: 60, w: 70, h: 10, real: false },
        { id: 'f-coffee', x: 62, y: 58, w: 4, h: 4, real: false },
        { id: 'f-water', x: 28, y: 58, w: 3, h: 5, real: false },
        { id: 'f-whiteboard', x: 62, y: 30, w: 12, h: 14, real: false },
        { id: 'f-plant', x: 2, y: 55, w: 5, h: 20, real: false },
        { id: 'f-papers', x: 40, y: 60, w: 6, h: 4, real: false },
        { id: 'f-window', x: 2, y: 3, w: 95, h: 25, real: false },
      ]
    }
  ]
};

// ─── HOTSPOT COMPONENT ──────────────────────────────────────────────
const Hotspot = ({ spot, isDiscovered, isActive, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="absolute cursor-pointer transition-all duration-200"
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        width: `${spot.w}%`,
        height: `${spot.h}%`,
        borderRadius: '4px',
        boxShadow: hovered && !isDiscovered
          ? '0 0 8px 1px rgba(161,161,170,0.08), inset 0 0 12px 1px rgba(161,161,170,0.04)'
          : 'none',
        backgroundColor: isDiscovered ? 'rgba(0,0,0,0.35)' : 'transparent',
        border: isActive ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(spot)}
    />
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────
export default function ImageBasedDatacenter({
  mapType = 'datacenter', // 'datacenter' | 'sala_reuniones'
  discoveredIds = [],
  activeObjectId = null,
  onObjectClick,
  onFakeClick,
  themeIndex = null
}) {
  const themes = DC_THEMES[mapType] || DC_THEMES.datacenter;
  const [theme] = useState(() => {
    const idx = themeIndex !== null ? themeIndex : Math.floor(Math.random() * themes.length);
    return themes[idx % themes.length];
  });
  const [fakeFlash, setFakeFlash] = useState(false);

  const handleClick = useCallback((spot) => {
    if (spot.real) {
      onObjectClick(spot.id);
    } else {
      setFakeFlash(true);
      setTimeout(() => setFakeFlash(false), 900);
      onFakeClick?.(spot.id);
    }
  }, [onObjectClick, onFakeClick]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ minHeight: '400px' }}>
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ background: `url('${theme.image}') center/cover no-repeat, ${theme.fallbackBg}` }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)' }}
      />

      {/* Hotspots */}
      {theme.hotspots.map(spot => (
        <Hotspot
          key={spot.id}
          spot={spot}
          isDiscovered={discoveredIds.includes(spot.id)}
          isActive={activeObjectId === spot.id}
          onClick={handleClick}
        />
      ))}

      {/* Fake toast */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-800/80 rounded-lg text-xs font-mono text-zinc-500 transition-all duration-500 pointer-events-none ${
        fakeFlash ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-2'
      }`}>
        Nada relevante aquí...
      </div>

      {/* Theme label */}
      <div className="absolute bottom-1 right-2 text-[8px] font-mono text-zinc-700 pointer-events-none">
        {theme.name}
      </div>
    </div>
  );
}

export { DC_THEMES };