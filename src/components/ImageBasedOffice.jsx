// ImageBasedOffice.jsx — Oficina con imagen de fondo + hotspots invisibles
// Reemplaza todo el SVG por una imagen + divs posicionados
//
// Para generar imágenes de fondo:
//   - Midjourney/DALL-E: "dark executive banking office, cinematic lighting, 
//     wide angle, no people, dark moody atmosphere, 16:9"
//   - O usar fotos reales de oficinas con licencia
//
// Cada tema es solo: { id, name, image, hotspots }

import { useState, useCallback } from 'react';

// ─── THEME DEFINITIONS ──────────────────────────────────────────────
// hotspots: % positions relative to image (responsive)
// Cada hotspot tiene: id, x%, y%, w%, h%, real (boolean), clueKey (si real)
const OFFICE_THEMES = [
  {
    id: 'biblioteca',
    name: 'Biblioteca Oscura',
    // Reemplazar con URL real de tu imagen
    image: '/assets/rooms/biblioteca-oscura.jpg',
    // Fallback: gradiente CSS si no hay imagen
    fallbackBg: 'linear-gradient(135deg, #14110d 0%, #0a0806 50%, #1a1610 100%)',
    hotspots: [
      // REALES — 5 objetos con pistas
      { id: 'computador', x: 35, y: 42, w: 16, h: 20, real: true, clueKey: 'computador', label: 'Monitor' },
      { id: 'documentos', x: 28, y: 58, w: 10, h: 8, real: true, clueKey: 'documentos', label: 'Papeles' },
      { id: 'celular', x: 62, y: 60, w: 5, h: 6, real: true, clueKey: 'celular', label: 'Teléfono' },
      { id: 'trofeos', x: 5, y: 25, w: 10, h: 18, real: true, clueKey: 'trofeos', label: 'Vitrina' },
      { id: 'organigrama', x: 72, y: 12, w: 14, h: 16, real: true, clueKey: 'organigrama', label: 'Pantalla' },
      // FALSOS — distractores
      { id: 'f-books1', x: 2, y: 5, w: 12, h: 22, real: false },
      { id: 'f-books2', x: 85, y: 5, w: 12, h: 45, real: false },
      { id: 'f-painting', x: 25, y: 8, w: 12, h: 15, real: false },
      { id: 'f-lamp', x: 20, y: 48, w: 6, h: 12, real: false },
      { id: 'f-mug', x: 55, y: 58, w: 4, h: 5, real: false },
      { id: 'f-chair', x: 40, y: 70, w: 14, h: 22, real: false },
      { id: 'f-drawer', x: 30, y: 65, w: 12, h: 10, real: false },
      { id: 'f-plant', x: 78, y: 55, w: 6, h: 18, real: false },
      { id: 'f-clock', x: 48, y: 5, w: 6, h: 8, real: false },
      { id: 'f-notebook', x: 68, y: 58, w: 6, h: 4, real: false },
      { id: 'f-photo', x: 8, y: 48, w: 5, h: 7, real: false },
      { id: 'f-pen', x: 48, y: 59, w: 3, h: 5, real: false },
    ]
  },
  {
    id: 'comando',
    name: 'Centro de Comando',
    image: '/assets/rooms/centro-comando.jpg',
    fallbackBg: 'linear-gradient(135deg, #0c0a08 0%, #1a0e08 30%, #060504 100%)',
    hotspots: [
      { id: 'computador', x: 22, y: 35, w: 18, h: 22, real: true, clueKey: 'computador', label: 'Monitor principal' },
      { id: 'documentos', x: 45, y: 60, w: 8, h: 6, real: true, clueKey: 'documentos', label: 'Documentos' },
      { id: 'celular', x: 58, y: 58, w: 5, h: 6, real: true, clueKey: 'celular', label: 'Celular' },
      { id: 'trofeos', x: 8, y: 5, w: 10, h: 8, real: true, clueKey: 'trofeos', label: 'Estante' },
      { id: 'organigrama', x: 70, y: 52, w: 15, h: 14, real: true, clueKey: 'organigrama', label: 'Pantalla lateral' },
      { id: 'f-bigscreen', x: 55, y: 5, w: 38, h: 38, real: false },
      { id: 'f-keyboard', x: 25, y: 60, w: 12, h: 5, real: false },
      { id: 'f-headphones', x: 92, y: 18, w: 5, h: 8, real: false },
      { id: 'f-couch', x: 72, y: 75, w: 22, h: 16, real: false },
      { id: 'f-shelf1', x: 18, y: 5, w: 8, h: 8, real: false },
      { id: 'f-shelf2', x: 30, y: 5, w: 8, h: 8, real: false },
      { id: 'f-mouse', x: 40, y: 60, w: 4, h: 4, real: false },
      { id: 'f-mug', x: 52, y: 58, w: 4, h: 5, real: false },
      { id: 'f-led', x: 15, y: 68, w: 30, h: 3, real: false },
      { id: 'f-chair', x: 30, y: 65, w: 12, h: 20, real: false },
      { id: 'f-lamp', x: 14, y: 48, w: 5, h: 10, real: false },
    ]
  },
  {
    id: 'moderna',
    name: 'Corporativa Moderna',
    image: '/assets/rooms/corporativa-moderna.jpg',
    fallbackBg: 'linear-gradient(135deg, #101012 0%, #08080a 50%, #0d0d10 100%)',
    hotspots: [
      { id: 'computador', x: 42, y: 36, w: 16, h: 20, real: true, clueKey: 'computador', label: 'Monitor' },
      { id: 'documentos', x: 32, y: 56, w: 8, h: 6, real: true, clueKey: 'documentos', label: 'Documentos' },
      { id: 'celular', x: 72, y: 55, w: 5, h: 5, real: true, clueKey: 'celular', label: 'Teléfono' },
      { id: 'trofeos', x: 5, y: 35, w: 8, h: 8, real: true, clueKey: 'trofeos', label: 'Premio' },
      { id: 'organigrama', x: 72, y: 36, w: 16, h: 12, real: true, clueKey: 'organigrama', label: 'Pantalla' },
      { id: 'f-mon2', x: 60, y: 38, w: 8, h: 14, real: false },
      { id: 'f-lamp', x: 26, y: 46, w: 5, h: 10, real: false },
      { id: 'f-kb', x: 44, y: 56, w: 12, h: 4, real: false },
      { id: 'f-mug', x: 78, y: 54, w: 4, h: 5, real: false },
      { id: 'f-water', x: 38, y: 52, w: 2, h: 6, real: false },
      { id: 'f-plant', x: 88, y: 58, w: 5, h: 20, real: false },
      { id: 'f-photo', x: 12, y: 34, w: 4, h: 5, real: false },
      { id: 'f-books', x: 15, y: 34, w: 5, h: 5, real: false },
      { id: 'f-art', x: 28, y: 36, w: 8, h: 10, real: false },
      { id: 'f-clock', x: 62, y: 36, w: 5, h: 7, real: false },
      { id: 'f-notebook', x: 66, y: 55, w: 5, h: 4, real: false },
      { id: 'f-sticky', x: 58, y: 36, w: 3, h: 4, real: false },
    ]
  }
];

// ─── HOTSPOT COMPONENT ──────────────────────────────────────────────
const Hotspot = ({ spot, isDiscovered, isActive, onRealClick, onFakeClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="absolute transition-all duration-200 cursor-pointer"
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        width: `${spot.w}%`,
        height: `${spot.h}%`,
        // Hover: brillo MUY sutil — solo borde casi invisible
        boxShadow: hovered && !isDiscovered
          ? '0 0 8px 1px rgba(161,161,170,0.08), inset 0 0 12px 1px rgba(161,161,170,0.04)'
          : 'none',
        borderRadius: '4px',
        // Discovered: se oscurece
        backgroundColor: isDiscovered ? 'rgba(0,0,0,0.35)' : 'transparent',
        // Active: borde dorado sutil
        border: isActive ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => spot.real ? onRealClick(spot.clueKey) : onFakeClick(spot.id)}
    />
  );
};

// ─── FAKE CLICK TOAST ───────────────────────────────────────────────
const FakeToast = ({ visible }) => (
  <div
    className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-800/80 rounded-lg text-xs font-mono text-zinc-200 transition-all duration-500 pointer-events-none ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    }`}
  >
    Nada relevante aquí...
  </div>
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────
export default function ImageBasedOffice({
  discoveredKeys = [],
  activeClueKey = null,
  onClueClick,
  themeIndex = null // null = random, number = specific theme
}) {
  const [theme] = useState(() => {
    const idx = themeIndex !== null ? themeIndex : Math.floor(Math.random() * OFFICE_THEMES.length);
    return OFFICE_THEMES[idx % OFFICE_THEMES.length];
  });
  const [fakeFlash, setFakeFlash] = useState(false);

  const handleFakeClick = useCallback(() => {
    setFakeFlash(true);
    setTimeout(() => setFakeFlash(false), 900);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ height: '100%', minHeight: '400px' }}>
      {/* ═══ BACKGROUND IMAGE ═══ */}
      <img
        src={theme.image}
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'center center' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      <div className="absolute inset-0" style={{ background: theme.fallbackBg, zIndex: -1 }} />

      {/* ═══ SUBTLE VIGNETTE OVERLAY ═══ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* ═══ HOTSPOTS ═══ */}
      {theme.hotspots.map(spot => (
        <Hotspot
          key={spot.id}
          spot={spot}
          isDiscovered={spot.real && discoveredKeys.includes(spot.clueKey)}
          isActive={spot.real && activeClueKey === spot.clueKey}
          onRealClick={onClueClick}
          onFakeClick={handleFakeClick}
        />
      ))}

      {/* ═══ FAKE TOAST ═══ */}
      <FakeToast visible={fakeFlash} />

      {/* ═══ THEME LABEL (quitar en prod) ═══ */}
      <div className="absolute bottom-1 right-2 text-[8px] font-mono text-zinc-700 pointer-events-none">
        {theme.name}
      </div>
    </div>
  );
}

// ─── EXAMPLE USAGE ──────────────────────────────────────────────────
/*
  // En ClientDirectorStation.jsx, reemplazar el <OfficeSVG> por:

  import ImageBasedOffice from './ImageBasedOffice';

  // En la fase de investigación:
  <div className="flex-1 relative">
    <ImageBasedOffice
      discoveredKeys={discoveredKeys}
      activeClueKey={activeClue?.key}
      onClueClick={handleClueClick}
    />
  </div>

  // Para agregar un nuevo tema, solo necesitas:
  // 1. Una imagen de fondo (1920x1080 recomendado)
  // 2. Las coordenadas % de los hotspots
  // 3. Agregarlo al array OFFICE_THEMES

  // Para generar imágenes con IA:
  // Midjourney: "dark executive banking office interior, cinematic wide angle,
  //   moody atmospheric lighting, bookshelves, desk with monitors, leather chair,
  //   paintings on wall, no people, photorealistic, 16:9 --ar 16:9 --v 6"
  //
  // DALL-E: similar prompt
  //
  // Stable Diffusion: similar prompt con negative "people, text, watermark"
*/