// src/components/ImageBasedDatacenter.jsx
// v2 · Usa imágenes 4K reales con hotspots invisibles.
// Mantiene los mismos ids de hotspot que MAPS en EscapeRoomStation.

import { useState, useCallback, useEffect } from 'react';

// ─── THEMES — cada tema apunta a una imagen real en /public/assets/rooms/ ───
export const DC_THEMES = {
  datacenter: [
    {
      id: 'pasillo',
      name: 'Pasillo de Racks',
      image: '/assets/rooms/datacenter-pasillo.jpg',
      fallbackBg: 'radial-gradient(ellipse at 40% 40%, #1a0e0a 0%, #0a0706 70%, #050403 100%)',
      hotspots: [
        { id: 'servidor-humeante',     x: 5,  y: 8,  w: 12, h: 55, real: true, label: 'Rack humeante' },
        { id: 'computadora-bloqueada', x: 55, y: 62, w: 14, h: 18, real: true, label: 'Terminal' },
        { id: 'postit-teclado',        x: 55, y: 82, w: 10, h: 6,  real: true, label: 'Post-it' },
        { id: 'carpeta-escritorio',    x: 68, y: 72, w: 10, h: 8,  real: true, label: 'Carpeta' },
        { id: 'log-errores',           x: 35, y: 25, w: 25, h: 18, real: true, label: 'Monitor de errores' },
        { id: 'f-rack2',      x: 82, y: 8,  w: 12, h: 55, real: false },
        { id: 'f-rack3',      x: 18, y: 12, w: 10, h: 45, real: false },
        { id: 'f-rack4',      x: 72, y: 12, w: 10, h: 45, real: false },
        { id: 'f-cables',     x: 42, y: 50, w: 12, h: 20, real: false },
        { id: 'f-floorcable', x: 30, y: 78, w: 25, h: 8,  real: false },
        { id: 'f-backrack',   x: 38, y: 28, w: 20, h: 30, real: false },
        { id: 'f-light',      x: 30, y: 3,  w: 35, h: 6,  real: false },
        { id: 'f-floortile',  x: 40, y: 68, w: 15, h: 8,  real: false },
        { id: 'f-extinguisher', x: 28, y: 55, w: 5, h: 12, real: false },
      ],
    },
    {
      id: 'sala',
      name: 'Sala de Servidores',
      image: '/assets/rooms/datacenter-sala.jpg',
      fallbackBg: 'radial-gradient(ellipse at 60% 40%, #14100b 0%, #080604 70%, #030202 100%)',
      hotspots: [
        { id: 'servidor-humeante',     x: 3,  y: 10, w: 14, h: 65, real: true, label: 'Servidor humeante' },
        { id: 'computadora-bloqueada', x: 65, y: 45, w: 12, h: 16, real: true, label: 'Terminal bloqueada' },
        { id: 'postit-teclado',        x: 66, y: 63, w: 8,  h: 7,  real: true, label: 'Post-it' },
        { id: 'carpeta-escritorio',    x: 30, y: 55, w: 10, h: 6,  real: true, label: 'Carpeta' },
        { id: 'log-errores',           x: 32, y: 38, w: 30, h: 18, real: true, label: 'Pantalla monitoreo' },
        { id: 'f-rack5',       x: 78, y: 12, w: 10, h: 60, real: false },
        { id: 'f-rack6',       x: 88, y: 12, w: 10, h: 60, real: false },
        { id: 'f-rack2',       x: 17, y: 10, w: 12, h: 65, real: false },
        { id: 'f-chair',       x: 48, y: 72, w: 8,  h: 10, real: false },
        { id: 'f-door',        x: 94, y: 15, w: 5,  h: 55, real: false },
        { id: 'f-cabletray',   x: 5,  y: 5,  w: 85, h: 3,  real: false },
        { id: 'f-floortile',   x: 42, y: 76, w: 8,  h: 5,  real: false },
        { id: 'f-extinguisher', x: 76, y: 52, w: 3, h: 10, real: false },
      ],
    },
  ],
  sala_reuniones: [
    {
      id: 'sala-exec',
      name: 'Sala Ejecutiva',
      image: '/assets/rooms/sala-reuniones.jpg',
      fallbackBg: 'radial-gradient(ellipse at 50% 30%, #0f1522 0%, #070a11 70%, #030406 100%)',
      hotspots: [
        { id: 'proyector',              x: 5,  y: 3,  w: 28, h: 35, real: true, label: 'Pantalla proyector' },
        { id: 'archivos-confidenciales', x: 75, y: 35, w: 12, h: 14, real: true, label: 'Archivos rojos' },
        { id: 'foto-organigrama',       x: 42, y: 30, w: 18, h: 18, real: true, label: 'Organigrama' },
        { id: 'telefono-mensajes',      x: 52, y: 62, w: 8,  h: 6,  real: true, label: 'Teléfono' },
        { id: 'caja-fuerte',            x: 88, y: 32, w: 9,  h: 18, real: true, label: 'Caja fuerte' },
        { id: 'f-chairs',     x: 15, y: 72, w: 12, h: 15, real: false },
        { id: 'f-chair2',     x: 60, y: 72, w: 12, h: 15, real: false },
        { id: 'f-table',      x: 12, y: 60, w: 70, h: 10, real: false },
        { id: 'f-coffee',     x: 62, y: 58, w: 4,  h: 4,  real: false },
        { id: 'f-water',      x: 28, y: 58, w: 3,  h: 5,  real: false },
        { id: 'f-whiteboard', x: 62, y: 30, w: 12, h: 14, real: false },
        { id: 'f-plant',      x: 2,  y: 55, w: 5,  h: 20, real: false },
        { id: 'f-papers',     x: 40, y: 60, w: 6,  h: 4,  real: false },
        { id: 'f-window',     x: 2,  y: 3,  w: 95, h: 25, real: false },
      ],
    },
  ],
};

// Paleta consistente
const C = {
  accent: '#FBBF24',   // ámbar = color del Analista
  discovered: '#34D399',
  muted: '#9CA3AF',
};

// ─── Hotspot individual ────────────────────────────────────────────────────
function Hotspot({ spot, isDiscovered, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);

  // Estilo del contorno al hover (sutil) y cuando está activo (más visible)
  const showOutline = hovered && !isDiscovered;
  const borderColor = isActive
    ? `${C.accent}CC`
    : showOutline
      ? `${C.accent}55`
      : 'transparent';

  return (
    <div
      className="hs-area"
      style={{
        position: 'absolute',
        left: `${spot.x}%`, top: `${spot.y}%`,
        width: `${spot.w}%`, height: `${spot.h}%`,
        borderRadius: 6,
        border: `1.5px ${isActive ? 'dashed' : 'solid'} ${borderColor}`,
        background: isDiscovered ? 'rgba(0,0,0,0.4)' : (hovered && !isDiscovered ? `${C.accent}08` : 'transparent'),
        cursor: 'pointer',
        transition: 'border-color .2s ease, background .2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(spot)}
      title={spot.real && spot.label ? spot.label : undefined}
    >
      {/* Checkmark si ya fue descubierto */}
      {isDiscovered && spot.real && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 22, height: 22, borderRadius: '50%',
          background: `${C.discovered}33`, border: `1px solid ${C.discovered}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3 8 L7 12 L13 5" stroke={C.discovered} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
export default function ImageBasedDatacenter({
  mapType = 'datacenter',
  discoveredIds = [],
  activeObjectId = null,
  onObjectClick,
  onFakeClick,
  themeIndex = null,
}) {
  const themes = DC_THEMES[mapType] || DC_THEMES.datacenter;

  // Selección de tema random al montar (o índice específico si viene como prop)
  const [theme] = useState(() => {
    const idx = themeIndex !== null ? themeIndex : Math.floor(Math.random() * themes.length);
    return themes[idx % themes.length];
  });

  const [fakeFlash, setFakeFlash] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reiniciar estado de imagen al cambiar de tema
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [theme.image]);

  const handleClick = useCallback((spot) => {
    if (spot.real) {
      onObjectClick?.(spot.id);
    } else {
      setFakeFlash(true);
      setTimeout(() => setFakeFlash(false), 1100);
      onFakeClick?.(spot.id);
    }
  }, [onObjectClick, onFakeClick]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 1200,
        margin: '0 auto',
        aspectRatio: '16 / 9',
        background: theme.fallbackBg,
        borderRadius: 10,
        overflow: 'hidden',
        userSelect: 'none',
        cursor: 'crosshair',
      }}
    >
      {/* Imagen de fondo real — solo se monta una vez que cargó para evitar flash */}
      <img
        src={theme.image}
        alt={theme.name}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: imageLoaded && !imageError ? 1 : 0,
          transition: 'opacity .4s ease',
        }}
      />

      {/* Indicador de carga */}
      {!imageLoaded && !imageError && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center', color: C.muted }}>
            <div style={{
              width: 28, height: 28, border: `2px solid ${C.accent}`,
              borderTopColor: 'transparent', borderRadius: '50%',
              margin: '0 auto 10px',
              animation: 'hs-spin 1s linear infinite',
            }} />
            <p style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', margin: 0 }}>Cargando escena…</p>
          </div>
        </div>
      )}

      {/* Mensaje si la imagen no carga (usa el fallbackBg como fondo) */}
      {imageError && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          padding: '8px 12px', background: 'rgba(0,0,0,0.6)',
          borderRadius: 6, fontSize: 11, color: C.muted,
          fontFamily: 'ui-monospace, monospace',
        }}>
          Imagen no disponible: <code>{theme.image}</code> · usando fondo genérico. Sube la imagen al proyecto para ver la escena real.
        </div>
      )}

      {/* Viñeteado para que los bordes se difuminen con el fondo del juego */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)',
      }} />

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

      {/* Toast "nada relevante" cuando clickeas un decoy */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        padding: '8px 14px', background: 'rgba(20,24,31,0.9)',
        border: '1px solid rgba(156,163,175,0.3)', borderRadius: 6,
        fontSize: 12, color: C.muted, fontFamily: 'ui-monospace, monospace',
        pointerEvents: 'none',
        opacity: fakeFlash ? 1 : 0,
        transition: 'opacity .3s ease',
      }}>
        Nada relevante aquí…
      </div>

      {/* Etiqueta del tema (pequeña, abajo derecha) */}
      <div style={{
        position: 'absolute', bottom: 8, right: 12,
        fontSize: 10, color: 'rgba(156,163,175,0.5)',
        fontFamily: 'ui-monospace, monospace',
        pointerEvents: 'none', letterSpacing: '0.05em',
      }}>
        {theme.name}
      </div>

      {/* Animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes hs-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
