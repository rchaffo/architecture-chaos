// src/components/OfficeScene.jsx — v2 (densa)
// 5 oficinas SVG estilizadas, una por cliente.
// Cada oficina tiene:
//  - 5 hotspots REALES (objetos clave que dan intel)
//  - 4-6 hotspots DECOY (clickeables, dicen "Nada relevante aquí")
//  - 15-25 elementos decorativos no-clickeables (densidad visual)
//  - Paleta única con acentos vibrantes

import { useState, useCallback } from 'react';

// ============================================================================
//  HOTSPOT REAL — feedback fuerte (ámbar) cuando real
// ============================================================================
function Hotspot({ x, y, w, h, label, isDiscovered, isActive, onClick, children }) {
  const [hovered, setHovered] = useState(false);
  const showOutline = (hovered || isActive) && !isDiscovered;

  return (
    <g style={{ cursor: 'pointer' }}>
      {children}
      {showOutline && (
        <rect
          x={x - 5} y={y - 5} width={w + 10} height={h + 10} rx="8"
          fill="none" stroke="#FBBF24" strokeWidth="2.5"
          strokeDasharray={isActive ? '7 4' : 'none'}
          style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.75))' }}
        />
      )}
      {isDiscovered && (
        <g transform={`translate(${x + w - 24}, ${y + 4})`}>
          <circle cx="10" cy="10" r="10" fill="#34D399" stroke="#0A0E14" strokeWidth="1.5" />
          <path d="M5.5 10 L8.5 13 L14 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      )}
      {hovered && !isDiscovered && label && (
        <g transform={`translate(${x + w / 2}, ${y - 18})`} style={{ pointerEvents: 'none' }}>
          <rect x={-(label.length * 4) - 10} y={-15} width={(label.length * 8) + 20} height={20} rx="4" fill="#FBBF24" />
          <text x="0" y="0" textAnchor="middle" fontSize="11" fontWeight="600" fontFamily="ui-monospace, monospace" fill="#412402">
            {label}
          </text>
        </g>
      )}
      <rect x={x} y={y} width={w} height={h} fill="transparent"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
      />
    </g>
  );
}

// ============================================================================
//  HOTSPOT DECOY — feedback gris suave + label genérico
// ============================================================================
function Decoy({ x, y, w, h, label, onDecoyClick, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <g style={{ cursor: 'pointer' }}>
      {children}
      {hovered && (
        <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx="6"
          fill="none" stroke="#6B7280" strokeWidth="1.5" opacity="0.6"
          style={{ filter: 'drop-shadow(0 0 4px rgba(107,114,128,0.5))' }}
        />
      )}
      {hovered && label && (
        <g transform={`translate(${x + w / 2}, ${y - 14})`} style={{ pointerEvents: 'none' }}>
          <rect x={-(label.length * 3.5) - 8} y={-13} width={(label.length * 7) + 16} height={17} rx="3" fill="#1C212B" stroke="#3A414F" strokeWidth="1" />
          <text x="0" y="-1" textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" fill="#9CA3AF">
            {label}
          </text>
        </g>
      )}
      <rect x={x} y={y} width={w} height={h} fill="transparent"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onDecoyClick?.(label)}
      />
    </g>
  );
}

// ============================================================================
//  TOAST DE DECOY — "Nada relevante aquí"
// ============================================================================
function DecoyToast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      background: '#1C212B', border: '1px solid #3A414F',
      borderRadius: 6, padding: '8px 14px',
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#9CA3AF',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      animation: 'os-toast-in 0.25s ease-out',
      pointerEvents: 'none', zIndex: 5,
    }}>
      <span style={{ color: '#FBBF24' }}>?</span>
      <span>Nada relevante aquí · {message}</span>
    </div>
  );
}

// ============================================================================
//  OFICINA 1 · MENDOZA — Director Agresivo (Banco Continental)
//  Vibe: club de directores, caoba + dorado + ventana con ciudad nocturna
// ============================================================================
function MendozaOffice(props) {
  return (
    <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="mz-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A1810" /><stop offset="100%" stopColor="#0E0805" />
        </linearGradient>
        <linearGradient id="mz-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A0F08" /><stop offset="100%" stopColor="#080403" />
        </linearGradient>
        <linearGradient id="mz-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6B3416" /><stop offset="100%" stopColor="#2E170A" />
        </linearGradient>
        <linearGradient id="mz-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A2540" /><stop offset="100%" stopColor="#0A1020" />
        </linearGradient>
        <radialGradient id="mz-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFC547" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFC547" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mz-fire" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#F87171" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#F87171" stopOpacity="0" />
        </radialGradient>
        <pattern id="mz-rug" patternUnits="userSpaceOnUse" width="40" height="40">
          <rect width="40" height="40" fill="#3A1818" />
          <circle cx="20" cy="20" r="6" fill="#5A2424" />
          <path d="M0,0 L40,40 M40,0 L0,40" stroke="#4A1C1C" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Pared y piso */}
      <rect width="1200" height="450" fill="url(#mz-wall)" />
      <rect y="450" width="1200" height="225" fill="url(#mz-floor)" />
      <line x1="0" y1="450" x2="1200" y2="450" stroke="#5A3520" strokeWidth="2" />

      {/* Alfombra persa */}
      <ellipse cx="600" cy="640" rx="500" ry="40" fill="#000" opacity="0.5" />
      <rect x="200" y="610" width="800" height="60" fill="url(#mz-rug)" opacity="0.85" />
      <rect x="200" y="610" width="800" height="60" fill="none" stroke="#704510" strokeWidth="2" />

      {/* Boiserie / paneles de madera en paredes */}
      <line x1="40" y1="40" x2="1160" y2="40" stroke="#704510" strokeWidth="2" />
      <line x1="40" y1="40" x2="40" y2="430" stroke="#704510" strokeWidth="2" />
      <line x1="1160" y1="40" x2="1160" y2="430" stroke="#704510" strokeWidth="2" />
      {/* Paneles divididos */}
      {[300, 600, 900].map(x => <line key={x} x1={x} y1="60" x2={x} y2="430" stroke="#3A2410" strokeWidth="1" opacity="0.6" />)}
      {/* Molduras superiores */}
      {[180, 480, 780, 1080].map(x => (
        <g key={x}>
          <rect x={x - 30} y="60" width="60" height="36" fill="none" stroke="#5A3520" strokeWidth="1" opacity="0.5" />
          <circle cx={x} cy="78" r="3" fill="#B8860B" opacity="0.6" />
        </g>
      ))}

      {/* Ventana con vista de la ciudad nocturna */}
      <g>
        <rect x="780" y="100" width="320" height="280" fill="url(#mz-sky)" stroke="#704510" strokeWidth="5" />
        {Array.from({ length: 18 }).map((_, i) => {
          const bx = 785 + i * 18;
          const bh = 30 + ((i * 19) % 90);
          return <rect key={i} x={bx} y={380 - bh} width={12 + (i % 3) * 4} height={bh} fill="#0B1224" />;
        })}
        {/* Ventanas iluminadas */}
        {Array.from({ length: 50 }).map((_, i) => {
          const bx = 790 + ((i * 11) % 305);
          const by = 290 + ((i * 13) % 80);
          return <rect key={`w-${i}`} x={bx} y={by} width="2" height="2" fill="#FBBF24" opacity={0.4 + (i % 5) * 0.12} />;
        })}
        {/* Cruz de la ventana */}
        <line x1="940" y1="100" x2="940" y2="380" stroke="#704510" strokeWidth="3" />
        <line x1="780" y1="240" x2="1100" y2="240" stroke="#704510" strokeWidth="3" />
        {/* Luna */}
        <circle cx="850" cy="160" r="22" fill="#FAFAFA" opacity="0.8" />
        <circle cx="858" cy="155" r="3" fill="#1A2540" opacity="0.4" />
        <circle cx="845" cy="165" r="2" fill="#1A2540" opacity="0.3" />
      </g>

      {/* Lámpara cenital con luz cálida */}
      <ellipse cx="600" cy="60" rx="320" ry="30" fill="url(#mz-lamp)" />
      <g>
        <line x1="500" y1="0" x2="500" y2="40" stroke="#3A2410" strokeWidth="2" />
        <line x1="700" y1="0" x2="700" y2="40" stroke="#3A2410" strokeWidth="2" />
        <ellipse cx="500" cy="42" rx="20" ry="6" fill="#3A2410" />
        <ellipse cx="700" cy="42" rx="20" ry="6" fill="#3A2410" />
        <ellipse cx="500" cy="50" rx="14" ry="3" fill="#FFC547" opacity="0.8" />
        <ellipse cx="700" cy="50" rx="14" ry="3" fill="#FFC547" opacity="0.8" />
      </g>

      {/* Chimenea decorativa al lado izquierdo */}
      <g>
        <rect x="240" y="280" width="170" height="160" fill="#3A1A0E" stroke="#5A3520" strokeWidth="2" />
        <rect x="252" y="320" width="146" height="100" fill="#0E0502" />
        {/* Fuego brillando */}
        <ellipse cx="325" cy="395" rx="50" ry="20" fill="url(#mz-fire)" />
        <path d="M295,420 Q300,400 310,395 Q305,380 320,375 Q318,360 330,360 Q335,375 340,378 Q350,375 348,395 Q355,400 355,420 Z" fill="#F87171" />
        <path d="M305,415 Q312,395 320,395 Q325,385 330,395 Q340,395 345,410 Z" fill="#FBBF24" />
        {/* Repisa */}
        <rect x="230" y="270" width="190" height="14" fill="#5A3520" />
      </g>

      {/* DECOY · reloj antiguo sobre la chimenea */}
      <Decoy x={310} y={235} w={50} h={42} label="Reloj antiguo" onDecoyClick={props.onDecoyClick}>
        <circle cx="335" cy="256" r="20" fill="#B8860B" stroke="#5A3520" strokeWidth="2" />
        <circle cx="335" cy="256" r="16" fill="#FAF6E8" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => {
          const a = (h * 30 - 90) * Math.PI / 180;
          return <line key={h} x1={335 + Math.cos(a) * 12} y1={256 + Math.sin(a) * 12} x2={335 + Math.cos(a) * 14} y2={256 + Math.sin(a) * 14} stroke="#3A2410" strokeWidth="0.8" />;
        })}
        <line x1="335" y1="256" x2="335" y2="248" stroke="#3A2410" strokeWidth="2" strokeLinecap="round" />
        <line x1="335" y1="256" x2="343" y2="260" stroke="#3A2410" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="335" cy="256" r="1.5" fill="#3A2410" />
      </Decoy>

      {/* DECOY · candelabros sobre la chimenea */}
      <Decoy x={250} y={236} w={30} h={40} label="Candelabro" onDecoyClick={props.onDecoyClick}>
        <rect x="262" y="266" width="6" height="8" fill="#B8860B" />
        <rect x="258" y="270" width="14" height="4" fill="#704510" />
        <rect x="263" y="248" width="4" height="20" fill="#FAF6E8" />
        <ellipse cx="265" cy="246" rx="2" ry="3" fill="#FBBF24">
          <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
        </ellipse>
      </Decoy>

      {/* DECOY · busto de bronce */}
      <Decoy x={388} y={226} w={26} h={50} label="Busto de bronce" onDecoyClick={props.onDecoyClick}>
        <rect x="392" y="266" width="18" height="10" fill="#3A2410" />
        <rect x="395" y="262" width="12" height="4" fill="#704510" />
        <ellipse cx="401" cy="252" rx="8" ry="9" fill="#704510" />
        <path d="M393,250 Q401,238 409,250" fill="#5A3520" />
      </Decoy>

      {/* Cuadros enmarcados en la pared (decoración) */}
      <g>
        <rect x="60" y="120" width="80" height="60" fill="#704510" />
        <rect x="66" y="126" width="68" height="48" fill="#1A2540" />
        <path d="M70,168 L85,150 L100,160 L125,130 L130,168 Z" fill="#5A3520" />
        <circle cx="115" cy="138" r="4" fill="#FBBF24" opacity="0.7" />
      </g>
      <g>
        <rect x="160" y="100" width="60" height="80" fill="#704510" />
        <rect x="166" y="106" width="48" height="68" fill="#3A2410" />
        <ellipse cx="190" cy="135" rx="14" ry="18" fill="#9C6F1A" opacity="0.6" />
      </g>

      {/* Escritorio grande de caoba */}
      <g>
        <polygon points="220,520 980,520 1030,580 180,580" fill="url(#mz-desk)" stroke="#704510" strokeWidth="1" />
        <rect x="180" y="580" width="850" height="40" fill="#2E170A" />
        <line x1="180" y1="580" x2="1030" y2="580" stroke="#5A3520" strokeWidth="0.5" />
        <rect x="200" y="620" width="22" height="50" fill="#1A0F06" />
        <rect x="988" y="620" width="22" height="50" fill="#1A0F06" />
        {/* Tallado en el frente */}
        <rect x="350" y="595" width="500" height="20" fill="none" stroke="#5A3520" strokeWidth="1" opacity="0.5" />
        <circle cx="450" cy="605" r="3" fill="#B8860B" opacity="0.5" />
        <circle cx="600" cy="605" r="3" fill="#B8860B" opacity="0.5" />
        <circle cx="750" cy="605" r="3" fill="#B8860B" opacity="0.5" />
      </g>

      {/* Silla ejecutiva alta de cuero capitoneado (de espaldas) */}
      <g transform="translate(610, 555)">
        <ellipse cx="0" cy="105" rx="65" ry="14" fill="#000" opacity="0.5" />
        <path d="M-55,-30 Q-58,-50 -50,-50 L50,-50 Q58,-50 55,-30 L55,80 Q55,90 45,90 L-45,90 Q-55,90 -55,80 Z" fill="#1A0F06" stroke="#5A3520" strokeWidth="1.5" />
        {/* Capitoné */}
        {[-30, -10, 10, 30].map(x => [-15, 15, 45].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#B8860B" opacity="0.4" />
        )))}
        <rect x="-3" y="80" width="6" height="22" fill="#3A2410" />
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <line key={i} x1="0" y1="102" x2={Math.cos(deg * Math.PI / 180) * 38} y2={102 + Math.sin(deg * Math.PI / 180) * 9} stroke="#3A2410" strokeWidth="3" />
        ))}
      </g>

      {/* ════ HOTSPOT 1 · TROFEOS — vitrina con copas ════ */}
      <Hotspot x={50} y={200} w={130} h={220} label="Trofeos y placas" {...wrapHotspot('trofeos', props)}>
        <rect x="50" y="200" width="130" height="220" fill="#3A2410" stroke="#704510" strokeWidth="3" />
        <rect x="58" y="208" width="114" height="204" fill="#1A0F06" />
        {/* Estantes */}
        <line x1="58" y1="270" x2="172" y2="270" stroke="#704510" strokeWidth="2" />
        <line x1="58" y1="340" x2="172" y2="340" stroke="#704510" strokeWidth="2" />
        {/* 6 trofeos dorados */}
        {[
          { cx: 90, cy: 248, h: 30 }, { cx: 140, cy: 248, h: 26 },
          { cx: 90, cy: 318, h: 24 }, { cx: 140, cy: 318, h: 28 },
          { cx: 90, cy: 388, h: 22 }, { cx: 140, cy: 388, h: 26 },
        ].map((t, i) => (
          <g key={i}>
            <ellipse cx={t.cx} cy={t.cy + t.h} rx="12" ry="2.5" fill="#000" opacity="0.5" />
            <path d={`M${t.cx - 9},${t.cy} Q${t.cx},${t.cy - t.h * 0.8} ${t.cx + 9},${t.cy} Z`} fill="#D4A030" />
            <rect x={t.cx - 11} y={t.cy} width="22" height="5" fill="#B8860B" />
            <rect x={t.cx - 7} y={t.cy + 5} width="14" height="9" fill="#704510" />
          </g>
        ))}
        {/* Reflejo del cristal */}
        <line x1="68" y1="215" x2="68" y2="405" stroke="white" strokeWidth="1" opacity="0.06" />
        <line x1="74" y1="220" x2="74" y2="280" stroke="white" strokeWidth="1" opacity="0.04" />
      </Hotspot>

      {/* ════ HOTSPOT 2 · ORGANIGRAMA — pizarra montada ════ */}
      <Hotspot x={460} y={120} w={250} h={170} label="Organigrama" {...wrapHotspot('organigrama', props)}>
        <rect x="460" y="120" width="250" height="170" fill="#0E0904" stroke="#704510" strokeWidth="4" />
        <rect x="468" y="128" width="234" height="154" fill="#08060B" />
        {/* CEO */}
        <rect x="555" y="142" width="80" height="24" fill="#3A2410" stroke="#B8860B" strokeWidth="1.5" />
        <text x="595" y="158" textAnchor="middle" fontSize="10" fill="#FBBF24" fontFamily="ui-monospace, monospace" fontWeight="700">CEO</text>
        <line x1="595" y1="166" x2="595" y2="180" stroke="#704510" />
        <line x1="510" y1="180" x2="680" y2="180" stroke="#704510" />
        {[510, 595, 680].map((bx, i) => (
          <g key={i}>
            <line x1={bx} y1="180" x2={bx} y2="194" stroke="#704510" />
            <rect x={bx - 28} y="194" width="56" height="22" fill="#2E170A" stroke="#B8860B" strokeWidth="1" />
            <text x={bx} y="208" textAnchor="middle" fontSize="9" fill="#9C6F1A" fontFamily="ui-monospace, monospace">{['CFO', 'COO', 'CTO'][i]}</text>
          </g>
        ))}
        {/* Subordinados */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={485 + i * 26} y="232" width="20" height="14" fill="#1A0F06" stroke="#3A2410" />
        ))}
        {/* Post-it amarillo "Board viernes" */}
        <g transform="rotate(-5 670 270)">
          <rect x="640" y="260" width="60" height="36" fill="#F5C44A" />
          <text x="670" y="275" textAnchor="middle" fontSize="8" fill="#5A3520" fontFamily="ui-monospace, monospace" fontWeight="700">BOARD</text>
          <text x="670" y="288" textAnchor="middle" fontSize="9" fill="#5A3520" fontFamily="ui-monospace, monospace" fontWeight="700">VIERNES</text>
        </g>
      </Hotspot>

      {/* ════ HOTSPOT 3 · DOCUMENTOS — carpeta SOX abierta ════ */}
      <Hotspot x={300} y={500} w={170} h={50} label="Documentos SOX" {...wrapHotspot('documentos', props)}>
        <polygon points="300,500 470,500 480,550 290,550" fill="#704510" />
        <rect x="305" y="510" width="160" height="30" fill="#FAF6E8" />
        <rect x="310" y="513" width="34" height="6" fill="#9C2A1F" />
        <text x="310" y="528" fontSize="8" fill="#5A3520" fontFamily="ui-monospace, monospace" fontWeight="700">SOX AUDIT 2026</text>
        {Array.from({ length: 4 }).map((_, i) => (
          <line key={i} x1="310" y1={532 + i * 3} x2="460" y2={532 + i * 3} stroke="#704510" strokeWidth="0.5" opacity="0.5" />
        ))}
        <rect x="395" y="530" width="60" height="8" fill="#FBBF24" opacity="0.6" />
      </Hotspot>

      {/* ════ HOTSPOT 4 · CELULAR — smartphone con notif "23" ════ */}
      <Hotspot x={520} y={500} w={48} h={78} label="Celular" {...wrapHotspot('celular', props)}>
        <rect x="520" y="500" width="48" height="78" rx="6" fill="#0A0A0A" stroke="#2A2A2A" strokeWidth="1.5" />
        <rect x="524" y="508" width="40" height="62" rx="2" fill="#1A0F06" />
        <text x="544" y="528" textAnchor="middle" fontSize="6" fill="#9C6F1A" fontFamily="ui-monospace, monospace">CEO</text>
        <text x="544" y="546" textAnchor="middle" fontSize="14" fill="#F87171" fontFamily="ui-monospace, monospace" fontWeight="700">23</text>
        <text x="544" y="558" textAnchor="middle" fontSize="5" fill="#9C6F1A" fontFamily="ui-monospace, monospace">missed</text>
        <circle cx="544" cy="495" r="3" fill="#F87171">
          <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
        </circle>
      </Hotspot>

      {/* ════ HOTSPOT 5 · COMPUTADOR — monitor SWIFT ════ */}
      <Hotspot x={620} y={400} w={150} h={120} label="Monitor SWIFT" {...wrapHotspot('computador', props)}>
        <rect x="620" y="400" width="150" height="100" rx="4" fill="#0A0A0A" stroke="#2A2A2A" strokeWidth="2" />
        <rect x="624" y="404" width="142" height="92" fill="#0B1224" />
        <rect x="624" y="404" width="142" height="14" fill="#1E3A5F" />
        <text x="695" y="414" textAnchor="middle" fontSize="8" fill="#FBBF24" fontFamily="ui-monospace, monospace" fontWeight="700">SWIFT GATEWAY</text>
        <text x="630" y="432" fontSize="7" fill="#F87171" fontFamily="ui-monospace, monospace">● TIMEOUT</text>
        <text x="630" y="444" fontSize="7" fill="#F87171" fontFamily="ui-monospace, monospace">Queue: 1247</text>
        {[0, 1, 2, 3, 4].map(i => (
          <rect key={i} x={630 + i * 22} y={460 + (i % 2) * 5} width="16" height={28 - (i * 2)} fill={i < 2 ? '#34D399' : '#F87171'} opacity="0.7" />
        ))}
        <rect x="685" y="500" width="20" height="14" fill="#2A2A2A" />
        <rect x="665" y="514" width="60" height="6" fill="#1A1A1A" />
      </Hotspot>

      {/* DECOY · decantador de whisky sobre el escritorio */}
      <Decoy x={780} y={478} w={36} h={48} label="Decantador" onDecoyClick={props.onDecoyClick}>
        <path d="M788,512 Q788,490 798,490 L800,484 L808,484 L810,490 Q820,490 820,512 Q820,524 804,524 Q788,524 788,512 Z" fill="#5A3520" opacity="0.85" />
        <ellipse cx="804" cy="510" rx="14" ry="8" fill="#B8860B" opacity="0.6" />
        <rect x="800" y="478" width="8" height="6" fill="#5A3520" />
      </Decoy>

      {/* DECOY · vasos pequeños */}
      <Decoy x={825} y={500} w={36} h={26} label="Vasos de cristal" onDecoyClick={props.onDecoyClick}>
        <path d="M828,500 L838,500 L840,524 L826,524 Z" fill="#3A2410" opacity="0.5" stroke="#B8860B" strokeWidth="0.5" />
        <ellipse cx="833" cy="500" rx="5" ry="1.5" fill="#704510" />
        <path d="M848,500 L858,500 L860,524 L846,524 Z" fill="#3A2410" opacity="0.5" stroke="#B8860B" strokeWidth="0.5" />
        <ellipse cx="853" cy="500" rx="5" ry="1.5" fill="#704510" />
      </Decoy>

      {/* DECOY · humidor de cigarros */}
      <Decoy x={870} y={510} w={50} h={22} label="Humidor" onDecoyClick={props.onDecoyClick}>
        <rect x="870" y="510" width="50" height="22" rx="2" fill="#3A1810" stroke="#704510" strokeWidth="1.5" />
        <rect x="874" y="514" width="42" height="6" fill="#5A2810" />
        <rect x="893" y="510" width="4" height="22" fill="#B8860B" opacity="0.6" />
      </Decoy>

      {/* DECOY · pluma estilográfica */}
      <Decoy x={400} y={555} w={70} h={14} label="Pluma estilográfica" onDecoyClick={props.onDecoyClick}>
        <rect x="400" y="560" width="58" height="6" rx="3" fill="#0A0A0A" />
        <rect x="455" y="558" width="12" height="10" rx="2" fill="#B8860B" />
        <circle cx="404" cy="563" r="2" fill="#B8860B" />
      </Decoy>

      {/* Lámpara de banca verde sobre el escritorio */}
      <g>
        <ellipse cx="490" cy="500" rx="40" ry="4" fill="#FBBF24" opacity="0.2" />
        <rect x="465" y="486" width="50" height="10" rx="3" fill="#0A4A1A" stroke="#3A6020" strokeWidth="1" />
        <rect x="485" y="450" width="10" height="38" fill="#3A2410" />
        <rect x="475" y="448" width="30" height="4" fill="#3A2410" />
      </g>
    </svg>
  );
}

// ============================================================================
//  OFICINA 2 · HERRERA — Directora Analítica (Banco Nacional)
//  Vibe: clínico-corporativo, dashboards, métricas vivas
// ============================================================================
function HerreraOffice(props) {
  return (
    <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="hr-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F2A3D" /><stop offset="100%" stopColor="#0A0F1A" />
        </linearGradient>
        <linearGradient id="hr-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F1525" /><stop offset="100%" stopColor="#050A14" />
        </linearGradient>
        <linearGradient id="hr-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A3550" /><stop offset="100%" stopColor="#0F1525" />
        </linearGradient>
        <linearGradient id="hr-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.05" />
        </linearGradient>
        <pattern id="hr-acoustic" patternUnits="userSpaceOnUse" width="60" height="60">
          <rect width="60" height="60" fill="#1A2233" />
          <circle cx="15" cy="15" r="3" fill="#0F1525" opacity="0.4" />
          <circle cx="45" cy="15" r="3" fill="#0F1525" opacity="0.4" />
          <circle cx="15" cy="45" r="3" fill="#0F1525" opacity="0.4" />
          <circle cx="45" cy="45" r="3" fill="#0F1525" opacity="0.4" />
        </pattern>
      </defs>

      <rect width="1200" height="450" fill="url(#hr-wall)" />
      <rect y="450" width="1200" height="225" fill="url(#hr-floor)" />
      <line x1="0" y1="450" x2="1200" y2="450" stroke="#3D5070" strokeWidth="2" />

      {/* Paneles acústicos en la pared del fondo */}
      <rect x="600" y="60" width="240" height="280" fill="url(#hr-acoustic)" opacity="0.7" />

      {/* LEDs azules ambientales */}
      <rect x="0" y="0" width="1200" height="3" fill="#60A5FA" opacity="0.4">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" />
      </rect>
      <rect x="0" y="446" width="1200" height="3" fill="#60A5FA" opacity="0.3" />

      {/* Glow ambiental azul */}
      <ellipse cx="700" cy="500" rx="600" ry="90" fill="#60A5FA" opacity="0.04" />

      {/* Pizarra de vidrio con fórmulas (decoración) */}
      <g>
        <rect x="60" y="80" width="220" height="40" fill="url(#hr-glass)" stroke="#3D5070" strokeWidth="1" />
        <text x="70" y="100" fontSize="11" fill="#60A5FA" fontFamily="ui-monospace, monospace" opacity="0.7">VaR = μ - σ × Φ⁻¹(α)</text>
        <text x="70" y="114" fontSize="11" fill="#60A5FA" fontFamily="ui-monospace, monospace" opacity="0.7">P(loss) = ∫f(x)dx</text>
      </g>

      {/* Reloj minimalista en pared */}
      <Decoy x={870} y={70} w={60} h={60} label="Reloj minimalista" onDecoyClick={props.onDecoyClick}>
        <circle cx="900" cy="100" r="26" fill="#FAFAFA" stroke="#3D5070" strokeWidth="2" />
        {[0, 3, 6, 9].map(h => {
          const a = (h * 30 - 90) * Math.PI / 180;
          return <line key={h} x1={900 + Math.cos(a) * 18} y1={100 + Math.sin(a) * 18} x2={900 + Math.cos(a) * 22} y2={100 + Math.sin(a) * 22} stroke="#1A2233" strokeWidth="2" />;
        })}
        <line x1="900" y1="100" x2="900" y2="86" stroke="#1A2233" strokeWidth="2" strokeLinecap="round" />
        <line x1="900" y1="100" x2="912" y2="106" stroke="#1A2233" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="900" cy="100" r="2" fill="#DC2626" />
      </Decoy>

      {/* DECOY · termo metálico sobre el escritorio */}
      <Decoy x={770} y={466} w={26} h={62} label="Termo" onDecoyClick={props.onDecoyClick}>
        <rect x="772" y="470" width="22" height="55" rx="3" fill="#9CA3AF" />
        <rect x="774" y="472" width="18" height="51" fill="#6B7280" />
        <rect x="776" y="466" width="14" height="6" rx="2" fill="#3D5070" />
        <ellipse cx="783" cy="498" rx="8" ry="2" fill="#374151" />
      </Decoy>

      {/* DECOY · planta de bambú alta */}
      <Decoy x={1050} y={350} w={70} h={130} label="Bambú" onDecoyClick={props.onDecoyClick}>
        <rect x="1075" y="450" width="20" height="30" fill="#5A6890" />
        <rect x="1078" y="445" width="14" height="6" fill="#3D5070" />
        <rect x="1083" y="350" width="4" height="100" fill="#34D399" opacity="0.85" />
        <rect x="1083" y="370" width="4" height="3" fill="#10B981" />
        <rect x="1083" y="395" width="4" height="3" fill="#10B981" />
        <rect x="1083" y="420" width="4" height="3" fill="#10B981" />
        <ellipse cx="1075" cy="362" rx="14" ry="3" fill="#34D399" opacity="0.85" transform="rotate(-30 1075 362)" />
        <ellipse cx="1095" cy="378" rx="14" ry="3" fill="#34D399" opacity="0.85" transform="rotate(35 1095 378)" />
        <ellipse cx="1075" cy="402" rx="14" ry="3" fill="#34D399" opacity="0.85" transform="rotate(-25 1075 402)" />
        <ellipse cx="1095" cy="425" rx="14" ry="3" fill="#34D399" opacity="0.85" transform="rotate(30 1095 425)" />
      </Decoy>

      {/* DECOY · libros de risk management apilados */}
      <Decoy x={278} y={460} w={50} h={70} label="Libros técnicos" onDecoyClick={props.onDecoyClick}>
        <rect x="280" y="510" width="46" height="20" fill="#1F2A3D" stroke="#3D5070" strokeWidth="1" />
        <text x="303" y="523" textAnchor="middle" fontSize="6" fill="#60A5FA" fontFamily="serif">Risk Management</text>
        <rect x="282" y="490" width="42" height="20" fill="#5A1A20" stroke="#3D5070" strokeWidth="1" />
        <text x="303" y="503" textAnchor="middle" fontSize="6" fill="#FAFAFA" fontFamily="serif">COSO ERM</text>
        <rect x="284" y="470" width="38" height="20" fill="#0A4A1A" stroke="#3D5070" strokeWidth="1" />
        <text x="303" y="483" textAnchor="middle" fontSize="6" fill="#FAFAFA" fontFamily="serif">Basel III</text>
      </Decoy>

      {/* DECOY · agenda con notas */}
      <Decoy x={345} y={555} w={70} h={20} label="Agenda" onDecoyClick={props.onDecoyClick}>
        <rect x="345" y="555" width="70" height="20" fill="#FAFAFA" stroke="#3D5070" strokeWidth="0.5" />
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i} x1="350" y1={559 + i * 3} x2="410" y2={559 + i * 3} stroke="#9CA3AF" strokeWidth="0.5" />
        ))}
      </Decoy>

      {/* DECOY · auriculares */}
      <Decoy x={482} y={552} w={32} h={22} label="Auriculares" onDecoyClick={props.onDecoyClick}>
        <path d="M484,572 Q484,556 498,556 Q512,556 512,572" fill="none" stroke="#1F2A3D" strokeWidth="2.5" />
        <ellipse cx="486" cy="572" rx="3" ry="4" fill="#0F1525" />
        <ellipse cx="510" cy="572" rx="3" ry="4" fill="#0F1525" />
      </Decoy>

      {/* Ventana esmerilada al fondo derecho con luz natural */}
      <rect x="900" y="160" width="180" height="180" fill="#3D5070" opacity="0.4" stroke="#5A6890" strokeWidth="2" />
      {Array.from({ length: 4 }).map((_, i) => (
        <line key={i} x1="900" y1={160 + i * 45} x2="1080" y2={160 + i * 45} stroke="#5A6890" strokeWidth="1" opacity="0.5" />
      ))}
      <line x1="990" y1="160" x2="990" y2="340" stroke="#5A6890" strokeWidth="1.5" />

      {/* Escritorio moderno de vidrio/metal */}
      <polygon points="220,520 980,520 1030,580 180,580" fill="url(#hr-desk)" stroke="#5A6890" strokeWidth="1" />
      <rect x="180" y="580" width="850" height="38" fill="#0F1525" />
      <rect x="200" y="618" width="14" height="50" fill="#3D5070" />
      <rect x="996" y="618" width="14" height="50" fill="#3D5070" />

      {/* Silla ergonómica negra */}
      <g transform="translate(610, 580)">
        <ellipse cx="0" cy="80" rx="55" ry="13" fill="#000" opacity="0.4" />
        <rect x="-45" y="-15" width="90" height="80" rx="6" fill="#0F1525" stroke="#3D5070" strokeWidth="1" />
        <rect x="-3" y="60" width="6" height="22" fill="#3D5070" />
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <line key={i} x1="0" y1="82" x2={Math.cos(deg * Math.PI / 180) * 35} y2={82 + Math.sin(deg * Math.PI / 180) * 8} stroke="#3D5070" strokeWidth="3" />
        ))}
      </g>

      {/* Monitor secundario lateral mostrando dashboards */}
      <g>
        <rect x="280" y="362" width="120" height="80" rx="3" fill="#0A0A0A" stroke="#3D5070" strokeWidth="2" />
        <rect x="284" y="366" width="112" height="72" fill="#0B1224" />
        <rect x="284" y="366" width="112" height="10" fill="#1A2233" />
        <text x="340" y="373" textAnchor="middle" fontSize="6" fill="#60A5FA" fontFamily="ui-monospace, monospace">Risk Dashboard</text>
        {/* Mini gráficos */}
        <polyline points="290,420 305,415 320,418 335,408 350,412 365,398 380,402" fill="none" stroke="#34D399" strokeWidth="1.2" />
        <polyline points="290,432 305,428 320,425 335,420 350,418 365,412 380,408" fill="none" stroke="#60A5FA" strokeWidth="1.2" />
        <text x="340" y="392" textAnchor="middle" fontSize="6" fill="#9CA3AF" fontFamily="ui-monospace, monospace">SLA · 4 servicios</text>
        <rect x="335" y="442" width="20" height="10" fill="#1A2233" />
      </g>

      {/* ════ HOTSPOT 1 · CERTIFICACIONES — estantería con marcos ════ */}
      <Hotspot x={50} y={140} w={150} h={280} label="Certificaciones ISO" {...wrapHotspot('trofeos', props)}>
        <rect x="50" y="140" width="150" height="280" fill="#1A2030" stroke="#3D5070" strokeWidth="3" />
        {[
          { y: 152, txt: 'ISO 27001', sub: 'Information Security' },
          { y: 220, txt: 'ISO 31000', sub: 'Risk Management' },
          { y: 288, txt: 'COSO ERM', sub: 'Enterprise Risk' },
          { y: 356, txt: 'CRISC', sub: 'Cert. in Risk' },
        ].map((c, i) => (
          <g key={i}>
            <rect x="62" y={c.y} width="126" height="56" fill="#FAFAFA" stroke="#293555" strokeWidth="1.5" />
            <rect x="68" y={c.y + 6} width="114" height="3" fill="#60A5FA" />
            <text x="125" y={c.y + 28} textAnchor="middle" fontSize="11" fill="#1A2233" fontFamily="serif" fontWeight="700">{c.txt}</text>
            <text x="125" y={c.y + 42} textAnchor="middle" fontSize="7" fill="#5A6890" fontFamily="serif">{c.sub}</text>
            <circle cx="172" cy={c.y + 42} r="6" fill="#B8860B" opacity="0.7" />
          </g>
        ))}
      </Hotspot>

      {/* ════ HOTSPOT 2 · ORGANIGRAMA — pizarra blanca con métricas ════ */}
      <Hotspot x={420} y={120} w={250} h={170} label="Organigrama y métricas" {...wrapHotspot('organigrama', props)}>
        <rect x="420" y="120" width="250" height="170" fill="#FAFAFA" stroke="#5A6890" strokeWidth="3" />
        <text x="545" y="138" textAnchor="middle" fontSize="9" fill="#1A2233" fontFamily="ui-monospace, monospace" fontWeight="700">ÁREA RIESGOS · 45 PERSONAS</text>
        <rect x="510" y="148" width="70" height="22" fill="none" stroke="#1A2233" strokeWidth="1.5" />
        <text x="545" y="163" textAnchor="middle" fontSize="9" fill="#1A2233" fontFamily="ui-monospace, monospace" fontWeight="600">CRO</text>
        <line x1="545" y1="170" x2="545" y2="182" stroke="#1A2233" />
        <line x1="465" y1="182" x2="625" y2="182" stroke="#1A2233" />
        {[470, 545, 620].map((bx, i) => (
          <g key={i}>
            <line x1={bx} y1="182" x2={bx} y2="192" stroke="#1A2233" />
            <rect x={bx - 28} y="192" width="56" height="20" fill="none" stroke="#1A2233" strokeWidth="1" />
            <text x={bx} y="205" textAnchor="middle" fontSize="7" fill="#1A2233" fontFamily="ui-monospace, monospace">{['Op.Risk', 'Mkt.Risk', 'Cred.Risk'][i]}</text>
          </g>
        ))}
        <text x="435" y="240" fontSize="9" fill="#5A6890" fontFamily="ui-monospace, monospace">Latencia core:</text>
        <text x="435" y="260" fontSize="20" fill="#DC2626" fontFamily="ui-monospace, monospace" fontWeight="700">12,000ms</text>
        <text x="435" y="275" fontSize="7" fill="#DC2626" fontFamily="ui-monospace, monospace">⚠ FUERA DE SLA</text>
        <polyline points="555,272 575,262 595,265 615,245 635,232 655,218" fill="none" stroke="#DC2626" strokeWidth="2" />
      </Hotspot>

      {/* ════ HOTSPOT 3 · DOCUMENTOS — Matriz de Riesgo ════ */}
      <Hotspot x={300} y={500} w={170} h={45} label="Matriz de Riesgo Q4" {...wrapHotspot('documentos', props)}>
        <rect x="300" y="500" width="170" height="45" fill="#FAFAFA" stroke="#5A6890" strokeWidth="1" />
        <rect x="300" y="500" width="170" height="11" fill="#1A2233" />
        <text x="385" y="508" textAnchor="middle" fontSize="7" fill="#FAFAFA" fontFamily="ui-monospace, monospace" fontWeight="700">MATRIZ DE RIESGO Q4</text>
        {[0, 1, 2, 3].map(r =>
          [0, 1, 2, 3].map(c => {
            const v = (r + c) / 6;
            const color = v < 0.3 ? '#34D399' : v < 0.6 ? '#FBBF24' : '#DC2626';
            return <rect key={`${r}-${c}`} x={310 + c * 14} y={515 + r * 7} width="12" height="6" fill={color} opacity="0.85" />;
          })
        )}
        <rect x="368" y="515" width="14" height="14" fill="none" stroke="#DC2626" strokeWidth="1.5" />
        <text x="395" y="525" fontSize="7" fill="#1A2233" fontFamily="ui-monospace, monospace">Disp.Core</text>
        <text x="395" y="535" fontSize="6" fill="#DC2626" fontFamily="ui-monospace, monospace" fontWeight="700">CRÍTICO</text>
      </Hotspot>

      {/* ════ HOTSPOT 4 · CELULAR ════ */}
      <Hotspot x={520} y={502} w={48} h={76} label="Celular" {...wrapHotspot('celular', props)}>
        <rect x="520" y="502" width="48" height="76" rx="6" fill="#0A0A0A" stroke="#2A2A2A" strokeWidth="1.5" />
        <rect x="524" y="510" width="40" height="60" rx="2" fill="#FAFAFA" />
        <text x="544" y="525" textAnchor="middle" fontSize="6" fill="#5A6890" fontFamily="ui-monospace, monospace">CRO</text>
        <text x="544" y="540" textAnchor="middle" fontSize="9" fill="#1A2233" fontFamily="ui-monospace, monospace" fontWeight="700">RCA</text>
        <text x="544" y="552" textAnchor="middle" fontSize="7" fill="#DC2626" fontFamily="ui-monospace, monospace" fontWeight="700">JUEVES</text>
        <rect x="528" y="558" width="32" height="3" fill="#DC2626" opacity="0.3" />
        <rect x="528" y="558" width="22" height="3" fill="#DC2626" />
      </Hotspot>

      {/* ════ HOTSPOT 5 · GRAFANA ════ */}
      <Hotspot x={620} y={395} w={170} h={125} label="Grafana · Latencia" {...wrapHotspot('computador', props)}>
        <rect x="620" y="395" width="170" height="105" rx="4" fill="#0A0A0A" stroke="#2A2A2A" strokeWidth="2" />
        <rect x="624" y="399" width="162" height="97" fill="#0B1224" />
        <rect x="624" y="399" width="162" height="14" fill="#181B1F" />
        <circle cx="634" cy="406" r="3" fill="#F46800" />
        <text x="650" y="409" fontSize="8" fill="#FAFAFA" fontFamily="ui-monospace, monospace">grafana · core latency</text>
        <polyline points="630,470 645,460 660,455 675,440 690,420 705,415 720,395 735,402 750,390 765,375 780,365"
          fill="none" stroke="#F87171" strokeWidth="2" />
        <line x1="624" y1="445" x2="786" y2="445" stroke="#FBBF24" strokeWidth="1" strokeDasharray="3 2" />
        <text x="780" y="442" textAnchor="end" fontSize="6" fill="#FBBF24" fontFamily="ui-monospace, monospace">SLA</text>
        <text x="630" y="486" fontSize="7" fill="#F87171" fontFamily="ui-monospace, monospace">▲ 12,000ms</text>
        <text x="700" y="486" fontSize="7" fill="#F87171" fontFamily="ui-monospace, monospace">peak: 14,200ms</text>
        <rect x="690" y="500" width="30" height="14" fill="#2A2A2A" />
        <rect x="670" y="514" width="70" height="6" fill="#1A1A1A" />
      </Hotspot>

      {/* DECOY · vaso de agua perfectamente alineado */}
      <Decoy x={830} y={500} w={20} h={30} label="Vaso de agua" onDecoyClick={props.onDecoyClick}>
        <path d="M833,503 L847,503 L848,528 L832,528 Z" fill="#60A5FA" opacity="0.3" stroke="#9CA3AF" strokeWidth="0.8" />
        <ellipse cx="840" cy="503" rx="7" ry="1.5" fill="#60A5FA" opacity="0.4" />
      </Decoy>
    </svg>
  );
}

// ============================================================================
//  OFICINA 3 · CASTILLO — Subgerente Político (Cooperativa Sur)
//  Vibe: político tradicional, fotos por todos lados, formal burdeos
// ============================================================================
function CastilloOffice(props) {
  return (
    <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="cs-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A1820" /><stop offset="100%" stopColor="#1A0608" />
        </linearGradient>
        <linearGradient id="cs-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F0F0A" /><stop offset="100%" stopColor="#0C0604" />
        </linearGradient>
        <linearGradient id="cs-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5A2818" /><stop offset="100%" stopColor="#1A0E06" />
        </linearGradient>
        <pattern id="cs-wallpaper" patternUnits="userSpaceOnUse" width="80" height="80">
          <rect width="80" height="80" fill="#3A1418" />
          <path d="M40,15 Q50,30 40,45 Q30,30 40,15 Z" fill="#5A1A20" opacity="0.5" />
          <circle cx="40" cy="30" r="2" fill="#B8860B" opacity="0.4" />
        </pattern>
      </defs>

      <rect width="1200" height="450" fill="url(#cs-wall)" />
      <rect width="1200" height="450" fill="url(#cs-wallpaper)" opacity="0.4" />
      <rect y="450" width="1200" height="225" fill="url(#cs-floor)" />
      <line x1="0" y1="450" x2="1200" y2="450" stroke="#5A2025" strokeWidth="2" />

      {/* Alfombra roja */}
      <ellipse cx="600" cy="640" rx="500" ry="40" fill="#000" opacity="0.5" />
      <rect x="180" y="610" width="840" height="60" fill="#5A1A20" stroke="#B8860B" strokeWidth="2" />
      <rect x="195" y="618" width="810" height="44" fill="none" stroke="#B8860B" strokeWidth="1" opacity="0.6" />

      {/* Cortinas de terciopelo a los lados */}
      <g>
        <path d="M860,40 Q870,200 860,440" fill="#5A1A20" />
        <path d="M875,40 Q885,200 875,440" fill="#6A1F26" />
        <path d="M890,40 Q900,200 890,440" fill="#5A1A20" />
        <path d="M905,40 Q915,200 905,440" fill="#7A2530" />
        <path d="M920,40 Q930,200 920,440" fill="#6A1F26" />
        <path d="M935,40 Q945,200 935,440" fill="#5A1A20" />
        <path d="M950,40 Q960,200 950,440" fill="#7A2530" />
        <ellipse cx="908" cy="240" rx="65" ry="10" fill="#B8860B" opacity="0.7" />
        <circle cx="908" cy="240" r="4" fill="#FBBF24" />
      </g>

      {/* Cuadro grande del fundador en el centro */}
      <g>
        <rect x="490" y="80" width="120" height="160" fill="#B8860B" />
        <rect x="498" y="88" width="104" height="144" fill="#1A0608" />
        {/* Retrato estilizado */}
        <rect x="500" y="90" width="100" height="140" fill="#5A4030" />
        <ellipse cx="550" cy="130" rx="22" ry="26" fill="#9C8060" />
        <ellipse cx="540" cy="125" rx="2" ry="3" fill="#1A0608" />
        <ellipse cx="560" cy="125" rx="2" ry="3" fill="#1A0608" />
        <path d="M540,138 Q550,144 560,138" stroke="#1A0608" strokeWidth="1.5" fill="none" />
        <path d="M520,160 Q550,150 580,160 L580,200 L520,200 Z" fill="#1F1410" />
        <rect x="540" y="170" width="20" height="10" fill="#5A1A20" />
        {/* Placa */}
        <rect x="500" y="232" width="100" height="14" fill="#704510" />
        <text x="550" y="241" textAnchor="middle" fontSize="7" fill="#FBBF24" fontFamily="serif" fontWeight="700">FUNDADOR · 1965</text>
      </g>

      {/* Bandera peruana montada */}
      <g transform="translate(1040, 80)">
        <rect x="0" y="0" width="3" height="200" fill="#5A2025" />
        <rect x="3" y="10" width="48" height="50" fill="#DC2626" />
        <rect x="3" y="60" width="48" height="50" fill="#FAFAFA" />
        <rect x="3" y="110" width="48" height="50" fill="#DC2626" />
        <circle cx="51" cy="2" r="4" fill="#B8860B" />
      </g>

      {/* DECOY · escudo de la cooperativa en pared */}
      <Decoy x={290} y={70} w={80} h={90} label="Escudo cooperativa" onDecoyClick={props.onDecoyClick}>
        <path d="M330,75 L370,90 L370,130 Q370,150 330,160 Q290,150 290,130 L290,90 Z" fill="#5A1A20" stroke="#B8860B" strokeWidth="2.5" />
        <circle cx="330" cy="115" r="22" fill="none" stroke="#B8860B" strokeWidth="1.5" />
        <text x="330" y="118" textAnchor="middle" fontSize="9" fill="#FBBF24" fontFamily="serif" fontWeight="700">CFS</text>
        <text x="330" y="148" textAnchor="middle" fontSize="6" fill="#B8860B" fontFamily="serif">1972</text>
      </Decoy>

      {/* Sillón club extra */}
      <g>
        <rect x="80" y="430" width="120" height="100" rx="8" fill="#3A1418" stroke="#5A1A20" strokeWidth="2" />
        <rect x="86" y="438" width="108" height="76" rx="4" fill="#5A1A20" />
        <rect x="86" y="498" width="108" height="34" fill="#3A1418" />
        {/* Capitoné */}
        {[100, 130, 160, 180].map((x, i) => (
          <circle key={i} cx={x} cy="470" r="2" fill="#B8860B" opacity="0.5" />
        ))}
        <rect x="80" y="525" width="20" height="12" fill="#1A0608" />
        <rect x="180" y="525" width="20" height="12" fill="#1A0608" />
      </g>

      {/* Mesita auxiliar al lado del sillón */}
      <g>
        <rect x="210" y="465" width="60" height="50" fill="#3A2418" stroke="#5A1A20" strokeWidth="1.5" />
        <rect x="215" y="465" width="50" height="6" fill="#5A4030" />
        <rect x="215" y="510" width="6" height="20" fill="#1A0608" />
        <rect x="259" y="510" width="6" height="20" fill="#1A0608" />
      </g>

      {/* DECOY · jarra de agua sobre la mesita */}
      <Decoy x={222} y={430} w={26} h={34} label="Jarra de agua" onDecoyClick={props.onDecoyClick}>
        <path d="M225,440 L225,460 Q225,464 230,464 L240,464 Q245,464 245,460 L245,440 L243,432 L227,432 Z" fill="#FAF6E8" opacity="0.7" stroke="#B8860B" strokeWidth="1" />
        <ellipse cx="235" cy="432" rx="8" ry="1.5" fill="#B8860B" opacity="0.6" />
        <path d="M243,448 Q252,450 252,455" stroke="#B8860B" strokeWidth="1" fill="none" />
      </Decoy>

      {/* Escritorio antiguo con tallados */}
      <polygon points="220,520 980,520 1030,580 180,580" fill="url(#cs-desk)" />
      <rect x="180" y="580" width="850" height="40" fill="#1A0E06" />
      <line x1="200" y1="595" x2="1010" y2="595" stroke="#5A3520" strokeWidth="1" opacity="0.6" />
      <line x1="200" y1="610" x2="1010" y2="610" stroke="#5A3520" strokeWidth="1" opacity="0.4" />
      {/* Tallados decorativos */}
      {[280, 480, 680, 880].map(x => (
        <g key={x}>
          <circle cx={x} cy="600" r="6" fill="none" stroke="#B8860B" strokeWidth="1" opacity="0.6" />
          <circle cx={x} cy="600" r="2" fill="#B8860B" opacity="0.5" />
        </g>
      ))}
      <rect x="200" y="620" width="22" height="50" fill="#0C0604" />
      <rect x="988" y="620" width="22" height="50" fill="#0C0604" />

      {/* Silla de cuero burdeos */}
      <g transform="translate(610, 560)">
        <ellipse cx="0" cy="100" rx="60" ry="13" fill="#000" opacity="0.5" />
        <path d="M-50,-30 Q-55,-50 -45,-50 L45,-50 Q55,-50 50,-30 L50,80 Q50,90 40,90 L-40,90 Q-50,90 -50,80 Z" fill="#5A1A20" stroke="#B8860B" strokeWidth="1.5" />
        {[-25, 0, 25].map(x => [-15, 15, 45].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#B8860B" opacity="0.5" />
        )))}
        <rect x="-3" y="80" width="6" height="22" fill="#3A2410" />
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <line key={i} x1="0" y1="102" x2={Math.cos(deg * Math.PI / 180) * 38} y2={102 + Math.sin(deg * Math.PI / 180) * 9} stroke="#3A2410" strokeWidth="3" />
        ))}
      </g>

      {/* ════ HOTSPOT 1 · MURO DE FOTOS ════ */}
      <Hotspot x={50} y={110} w={170} h={290} label="Pared de fotos" {...wrapHotspot('trofeos', props)}>
        {[
          { x: 60, y: 120, w: 70, h: 50 },
          { x: 145, y: 118, w: 70, h: 65 },
          { x: 60, y: 185, w: 80, h: 55 },
          { x: 155, y: 200, w: 60, h: 60 },
          { x: 65, y: 255, w: 75, h: 55 },
          { x: 150, y: 275, w: 70, h: 65 },
        ].map((f, i) => (
          <g key={i}>
            <rect x={f.x - 3} y={f.y - 3} width={f.w + 6} height={f.h + 6} fill="#B8860B" />
            <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#5A4030" />
            <circle cx={f.x + f.w * 0.35} cy={f.y + f.h * 0.4} r={f.h * 0.15} fill="#9C8060" opacity="0.7" />
            <circle cx={f.x + f.w * 0.65} cy={f.y + f.h * 0.4} r={f.h * 0.15} fill="#9C8060" opacity="0.7" />
            <rect x={f.x + f.w * 0.2} y={f.y + f.h * 0.55} width={f.w * 0.6} height={f.h * 0.4} fill="#7A6040" opacity="0.6" />
          </g>
        ))}
        <rect x="60" y="350" width="155" height="32" fill="#5A1A20" stroke="#B8860B" strokeWidth="1.5" />
        <text x="137" y="367" textAnchor="middle" fontSize="10" fill="#FBBF24" fontFamily="serif" fontWeight="700">COOPERATIVA</text>
        <text x="137" y="378" textAnchor="middle" fontSize="7" fill="#D4A030" fontFamily="serif">del Año 2022</text>
      </Hotspot>

      {/* ════ HOTSPOT 2 · ORGANIGRAMA ════ */}
      <Hotspot x={650} y={100} w={210} h={170} label="Directorio · 9 miembros" {...wrapHotspot('organigrama', props)}>
        <rect x="650" y="100" width="210" height="170" fill="#FAF6E8" stroke="#5A2025" strokeWidth="3" />
        <rect x="650" y="100" width="210" height="18" fill="#5A1A20" />
        <text x="755" y="113" textAnchor="middle" fontSize="9" fill="#FBBF24" fontFamily="serif" fontWeight="700">DIRECTORIO COOP.SUR</text>
        <circle cx="755" cy="142" r="13" fill="#9C8060" stroke="#5A1A20" strokeWidth="1.5" />
        <text x="755" y="166" textAnchor="middle" fontSize="7" fill="#1A0608" fontFamily="serif" fontWeight="700">PRESIDENTE</text>
        {Array.from({ length: 8 }).map((_, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          return (
            <g key={i} transform={`translate(${670 + col * 45}, ${188 + row * 38})`}>
              <circle cx="20" cy="10" r="7" fill="#9C8060" opacity="0.7" />
              <text x="20" y="28" textAnchor="middle" fontSize="6" fill="#1A0608" fontFamily="serif">Director</text>
            </g>
          );
        })}
        <g transform="rotate(5 818 232)">
          <rect x="788" y="217" width="60" height="32" fill="#F5C44A" />
          <text x="818" y="231" textAnchor="middle" fontSize="7" fill="#5A2025" fontFamily="ui-monospace, monospace" fontWeight="700">ASAMBLEA</text>
          <text x="818" y="242" textAnchor="middle" fontSize="8" fill="#5A2025" fontFamily="ui-monospace, monospace" fontWeight="700">15 días</text>
        </g>
      </Hotspot>

      {/* ════ HOTSPOT 3 · CARTA DE RECLAMO ════ */}
      <Hotspot x={300} y={500} w={170} h={50} label="Carta de reclamo" {...wrapHotspot('documentos', props)}>
        <g transform="rotate(-3 385 525)">
          <rect x="300" y="500" width="170" height="50" fill="#FAF6E8" stroke="#5A4030" strokeWidth="1" />
          <text x="308" y="514" fontSize="7" fill="#5A1A20" fontFamily="serif" fontWeight="700">RECLAMO · SOCIO MAYORITARIO</text>
          {Array.from({ length: 4 }).map((_, i) => (
            <line key={i} x1="308" y1={520 + i * 4} x2={450 - i * 12} y2={520 + i * 4} stroke="#5A4030" strokeWidth="0.5" opacity="0.6" />
          ))}
          <rect x="405" y="538" width="60" height="8" fill="#DC2626" opacity="0.5" />
          <text x="435" y="544" textAnchor="middle" fontSize="6" fill="#FAF6E8" fontFamily="ui-monospace, monospace" fontWeight="700">URGENTE</text>
        </g>
      </Hotspot>

      {/* ════ HOTSPOT 4 · WHATSAPP ════ */}
      <Hotspot x={520} y={500} w={48} h={80} label="WhatsApp" {...wrapHotspot('celular', props)}>
        <rect x="520" y="500" width="48" height="80" rx="6" fill="#0A0A0A" stroke="#2A2A2A" strokeWidth="1.5" />
        <rect x="524" y="508" width="40" height="64" rx="2" fill="#FAF6E8" />
        <rect x="524" y="508" width="40" height="10" fill="#075E54" />
        <text x="544" y="515" textAnchor="middle" fontSize="5" fill="#FAFAFA" fontFamily="ui-monospace, monospace" fontWeight="700">WhatsApp</text>
        <text x="527" y="528" fontSize="5" fill="#1A0608" fontFamily="ui-monospace, monospace" fontWeight="700">Pdte:</text>
        <rect x="527" y="532" width="34" height="20" rx="2" fill="#DCF8C6" />
        <text x="544" y="540" textAnchor="middle" fontSize="4" fill="#1A0608" fontFamily="ui-monospace, monospace">Resuelve esto</text>
        <text x="544" y="546" textAnchor="middle" fontSize="4" fill="#1A0608" fontFamily="ui-monospace, monospace">antes de la</text>
        <text x="544" y="552" textAnchor="middle" fontSize="4" fill="#1A0608" fontFamily="ui-monospace, monospace" fontWeight="700">asamblea</text>
        <circle cx="563" cy="510" r="6" fill="#DC2626" />
        <text x="563" y="513" textAnchor="middle" fontSize="6" fill="white" fontWeight="700">!</text>
      </Hotspot>

      {/* ════ HOTSPOT 5 · APP MÓVIL ════ */}
      <Hotspot x={620} y={395} w={150} h={125} label="App móvil · Error 500" {...wrapHotspot('computador', props)}>
        <rect x="620" y="395" width="150" height="105" rx="4" fill="#0A0A0A" stroke="#2A2A2A" strokeWidth="2" />
        <rect x="624" y="399" width="142" height="97" fill="#FAFAFA" />
        <rect x="624" y="399" width="142" height="12" fill="#E5E7EB" />
        <circle cx="630" cy="405" r="2" fill="#F87171" />
        <circle cx="638" cy="405" r="2" fill="#FBBF24" />
        <circle cx="646" cy="405" r="2" fill="#34D399" />
        <rect x="650" y="416" width="80" height="74" rx="4" fill="#1A2233" />
        <text x="690" y="434" textAnchor="middle" fontSize="6" fill="#FAFAFA" fontFamily="ui-monospace, monospace" fontWeight="700">CoopSur App</text>
        <rect x="660" y="441" width="60" height="20" rx="2" fill="#DC2626" opacity="0.2" />
        <text x="690" y="452" textAnchor="middle" fontSize="9" fill="#DC2626" fontFamily="ui-monospace, monospace" fontWeight="700">ERROR 500</text>
        <text x="690" y="476" textAnchor="middle" fontSize="5" fill="#FAFAFA" fontFamily="ui-monospace, monospace">Transferencias</text>
        <text x="690" y="484" textAnchor="middle" fontSize="5" fill="#F87171" fontFamily="ui-monospace, monospace">no disponibles</text>
        <text x="630" y="455" fontSize="10" fill="#FBBF24">★</text>
        <text x="630" y="470" fontSize="6" fill="#5A4030" fontFamily="ui-monospace, monospace">1.2/5</text>
        <text x="630" y="480" fontSize="5" fill="#5A4030" fontFamily="ui-monospace, monospace">847 reviews</text>
        <rect x="685" y="500" width="20" height="14" fill="#2A2A2A" />
        <rect x="665" y="514" width="60" height="6" fill="#1A1A1A" />
      </Hotspot>

      {/* DECOY · pisapapeles tallado */}
      <Decoy x={790} y={552} w={32} h={26} label="Pisapapeles" onDecoyClick={props.onDecoyClick}>
        <ellipse cx="806" cy="572" rx="14" ry="6" fill="#000" opacity="0.4" />
        <ellipse cx="806" cy="566" rx="14" ry="10" fill="#5A4030" stroke="#B8860B" strokeWidth="1" />
        <ellipse cx="806" cy="563" rx="10" ry="6" fill="#704510" />
      </Decoy>

      {/* DECOY · tintero antiguo */}
      <Decoy x={830} y={548} w={26} h={30} label="Tintero" onDecoyClick={props.onDecoyClick}>
        <path d="M833,558 L833,575 L853,575 L853,558 Z" fill="#1A0608" stroke="#B8860B" strokeWidth="1" />
        <ellipse cx="843" cy="558" rx="10" ry="3" fill="#5A1A20" />
        <ellipse cx="843" cy="556" rx="6" ry="2" fill="#1A0608" />
        <line x1="843" y1="556" x2="855" y2="540" stroke="#B8860B" strokeWidth="1.2" />
        <path d="M855,540 L860,535 L862,540" stroke="#B8860B" strokeWidth="1" fill="none" />
      </Decoy>

      {/* DECOY · libreta de actas */}
      <Decoy x={860} y={560} w={70} h={20} label="Libreta de actas" onDecoyClick={props.onDecoyClick}>
        <rect x="860" y="560" width="70" height="20" fill="#5A1A20" stroke="#B8860B" strokeWidth="1" />
        <rect x="864" y="564" width="62" height="12" fill="#FAF6E8" opacity="0.4" />
        <text x="895" y="572" textAnchor="middle" fontSize="6" fill="#FBBF24" fontFamily="serif" fontWeight="700">ACTAS</text>
      </Decoy>

      {/* DECOY · sello cooperativo */}
      <Decoy x={400} y={550} w={30} h={28} label="Sello oficial" onDecoyClick={props.onDecoyClick}>
        <ellipse cx="415" cy="572" rx="14" ry="3" fill="#000" opacity="0.4" />
        <rect x="409" y="556" width="12" height="16" fill="#3A2418" />
        <rect x="406" y="552" width="18" height="6" rx="2" fill="#5A1A20" />
        <circle cx="415" cy="572" r="3" fill="#B8860B" />
      </Decoy>
    </svg>
  );
}

// ============================================================================
//  OFICINA 4 · VEGA — CTO Fintech
//  Vibe: gamer/startup, RGB, monitor curvo, stickers
// ============================================================================
function VegaOffice(props) {
  return (
    <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="vg-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A0F2A" /><stop offset="100%" stopColor="#050310" />
        </linearGradient>
        <linearGradient id="vg-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F0820" /><stop offset="100%" stopColor="#03020A" />
        </linearGradient>
        <linearGradient id="vg-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A1428" /><stop offset="100%" stopColor="#0A0512" />
        </linearGradient>
        <linearGradient id="vg-rgb" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="33%" stopColor="#06B6D4" />
          <stop offset="66%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <radialGradient id="vg-glow-purple" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vg-glow-cyan" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="450" fill="url(#vg-wall)" />
      <rect y="450" width="1200" height="225" fill="url(#vg-floor)" />

      {/* RGB strips en la pared */}
      <rect x="0" y="50" width="1200" height="3" fill="#06B6D4" opacity="0.7">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="0" y="430" width="1200" height="3" fill="#A855F7" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
      </rect>
      <line x1="0" y1="450" x2="1200" y2="450" stroke="url(#vg-rgb)" strokeWidth="2.5" opacity="0.7" />

      {/* Glows ambientales */}
      <ellipse cx="200" cy="200" rx="200" ry="120" fill="url(#vg-glow-purple)" />
      <ellipse cx="900" cy="180" rx="200" ry="120" fill="url(#vg-glow-cyan)" />
      <ellipse cx="700" cy="500" rx="500" ry="80" fill="url(#vg-glow-purple)" opacity="0.5" />

      {/* Patrón de circuitos en la pared (decoración) */}
      <g opacity="0.15" stroke="#A855F7" strokeWidth="0.8" fill="none">
        <path d="M40,200 L40,220 L80,220 L80,260 L120,260" />
        <circle cx="40" cy="220" r="3" />
        <circle cx="80" cy="260" r="3" />
        <circle cx="120" cy="260" r="3" fill="#06B6D4" stroke="none" />
        <path d="M1100,180 L1100,210 L1060,210 L1060,250" />
        <circle cx="1100" cy="210" r="3" />
        <circle cx="1060" cy="250" r="3" fill="#06B6D4" stroke="none" />
        <path d="M250,80 L290,80 L290,120 L330,120" />
        <circle cx="290" cy="80" r="3" />
      </g>

      {/* Stickers en pared (decoración) */}
      {[
        { x: 80, y: 90, txt: 'fail fast', color: '#06B6D4' },
        { x: 200, y: 70, txt: '<dev/>', color: '#FB7185' },
        { x: 320, y: 100, txt: 'k8s', color: '#A855F7' },
        { x: 1050, y: 100, txt: 'rust', color: '#F59E0B' },
        { x: 1130, y: 200, txt: '🚀', color: '#34D399' },
      ].map((s, i) => (
        <g key={i} transform={`translate(${s.x}, ${s.y}) rotate(${(i * 7) - 10})`}>
          <rect x="-22" y="-10" width="44" height="20" rx="3" fill={s.color} opacity="0.85" />
          <text x="0" y="3" textAnchor="middle" fontSize="9" fill="#0A0518" fontFamily="ui-monospace, monospace" fontWeight="700">{s.txt}</text>
        </g>
      ))}

      {/* Whiteboard con código (decoración) */}
      <g>
        <rect x="450" y="100" width="160" height="100" fill="#1A1428" stroke="#A855F7" strokeWidth="1.5" />
        <text x="460" y="118" fontSize="7" fill="#06B6D4" fontFamily="ui-monospace, monospace">// arch v3</text>
        <text x="460" y="130" fontSize="7" fill="#FAFAFA" fontFamily="ui-monospace, monospace">[mobile] → [api]</text>
        <text x="460" y="142" fontSize="7" fill="#FAFAFA" fontFamily="ui-monospace, monospace">  ↓     ↓</text>
        <text x="460" y="154" fontSize="7" fill="#FAFAFA" fontFamily="ui-monospace, monospace">[gateway][cache]</text>
        <text x="460" y="166" fontSize="7" fill="#FAFAFA" fontFamily="ui-monospace, monospace">  ↓</text>
        <text x="460" y="178" fontSize="7" fill="#A855F7" fontFamily="ui-monospace, monospace">[k8s cluster]</text>
        <text x="460" y="192" fontSize="6" fill="#EC4899" fontFamily="ui-monospace, monospace">// scale = 🔥</text>
      </g>

      {/* DECOY · figura action de superhéroe */}
      <Decoy x={920} y={170} w={40} h={70} label="Figura coleccionable" onDecoyClick={props.onDecoyClick}>
        <rect x="930" y="225" width="20" height="14" fill="#3A2410" />
        <rect x="932" y="195" width="16" height="32" fill="#A855F7" />
        <rect x="934" y="180" width="12" height="18" rx="6" fill="#FBBF24" />
        <circle cx="940" cy="184" r="2" fill="#0A0518" />
        <rect x="930" y="200" width="20" height="4" fill="#FB7185" />
        {/* Capa */}
        <path d="M930,200 L926,235 L932,232 L932,202 Z" fill="#06B6D4" opacity="0.85" />
      </Decoy>

      {/* DECOY · cubo de Rubik */}
      <Decoy x={228} y={528} w={32} h={32} label="Cubo de Rubik" onDecoyClick={props.onDecoyClick}>
        <rect x="230" y="530" width="28" height="28" fill="#0A0A0A" stroke="#FAFAFA" strokeWidth="1" />
        {[0, 1, 2].map(r => [0, 1, 2].map(c => (
          <rect key={`${r}-${c}`} x={232 + c * 8} y={532 + r * 8} width="6" height="6"
            fill={['#FB7185', '#34D399', '#FBBF24', '#06B6D4', '#A855F7', '#FAFAFA'][((r * 3 + c) * 7) % 6]} />
        )))}
      </Decoy>

      {/* DECOY · AeroPress */}
      <Decoy x={272} y={500} w={26} h={70} label="AeroPress" onDecoyClick={props.onDecoyClick}>
        <rect x="278" y="540" width="14" height="28" rx="2" fill="#3A2410" />
        <rect x="276" y="510" width="18" height="32" fill="#0A0A0A" stroke="#A855F7" strokeWidth="1" />
        <rect x="280" y="514" width="10" height="22" fill="#5A2810" />
        <rect x="278" y="506" width="14" height="6" rx="2" fill="#0A0A0A" />
      </Decoy>

      {/* DECOY · headphones colgando */}
      <Decoy x={830} y={130} w={42} h={60} label="Headphones" onDecoyClick={props.onDecoyClick}>
        <path d="M838,180 Q838,140 851,140 Q864,140 864,180" fill="none" stroke="#0A0518" strokeWidth="3" />
        <ellipse cx="838" cy="178" rx="6" ry="8" fill="#1A1428" stroke="#A855F7" strokeWidth="1" />
        <ellipse cx="864" cy="178" rx="6" ry="8" fill="#1A1428" stroke="#A855F7" strokeWidth="1" />
        <rect x="836" y="182" width="2" height="8" fill="#A855F7" opacity="0.6" />
        <rect x="864" y="182" width="2" height="8" fill="#06B6D4" opacity="0.6" />
      </Decoy>

      {/* DECOY · planta LED */}
      <Decoy x={1080} y={350} w={50} h={130} label="Planta LED" onDecoyClick={props.onDecoyClick}>
        <rect x="1090" y="450" width="30" height="25" fill="#1A1428" stroke="#A855F7" strokeWidth="1" />
        <ellipse cx="1105" cy="450" rx="15" ry="3" fill="#0A0512" />
        {Array.from({ length: 5 }).map((_, i) => (
          <ellipse key={i} cx={1095 + (i % 3) * 8} cy={400 + (i * 9)} rx="10" ry="4" fill="#34D399" opacity="0.85" transform={`rotate(${i * 15 - 30} ${1095 + (i % 3) * 8} ${400 + (i * 9)})`} />
        ))}
        <rect x="1093" y="448" width="2" height="3" fill="#A855F7">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </rect>
      </Decoy>

      {/* Escritorio gamer */}
      <polygon points="220,520 980,520 1030,580 180,580" fill="url(#vg-desk)" stroke="#A855F7" strokeWidth="1" opacity="0.95" />
      <rect x="180" y="580" width="850" height="40" fill="#0A0512" />
      <rect x="180" y="618" width="850" height="3" fill="url(#vg-rgb)" opacity="0.8">
        <animate attributeName="opacity" values="0.5;0.95;0.5" dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x="200" y="624" width="14" height="46" fill="#1A1428" />
      <rect x="996" y="624" width="14" height="46" fill="#1A1428" />

      {/* Silla gamer */}
      <g transform="translate(610, 555)">
        <ellipse cx="0" cy="105" rx="55" ry="13" fill="#000" opacity="0.5" />
        <path d="M-50,-30 Q-55,-50 -45,-50 L45,-50 Q55,-50 50,-30 L50,80 Q50,90 40,90 L-40,90 Q-50,90 -50,80 Z" fill="#1A0820" stroke="#A855F7" strokeWidth="2" />
        <rect x="-46" y="-25" width="92" height="6" fill="#A855F7" opacity="0.6" />
        <rect x="-46" y="-15" width="92" height="3" fill="#06B6D4" opacity="0.5" />
        <rect x="-3" y="80" width="6" height="22" fill="#06B6D4" opacity="0.7" />
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <line key={i} x1="0" y1="102" x2={Math.cos(deg * Math.PI / 180) * 38} y2={102 + Math.sin(deg * Math.PI / 180) * 9} stroke="#A855F7" strokeWidth="3" opacity="0.7" />
        ))}
      </g>

      {/* ════ HOTSPOT 1 · TROFEOS HACKATHON ════ */}
      <Hotspot x={60} y={170} w={140} h={240} label="Hackathon trophies" {...wrapHotspot('trofeos', props)}>
        <rect x="60" y="170" width="140" height="240" fill="#0A0518" stroke="#A855F7" strokeWidth="2" />
        <line x1="60" y1="240" x2="200" y2="240" stroke="#A855F7" strokeWidth="1.5" opacity="0.6" />
        <line x1="60" y1="310" x2="200" y2="310" stroke="#A855F7" strokeWidth="1.5" opacity="0.6" />
        {[
          { x: 90, y: 200, c: '#06B6D4' }, { x: 150, y: 200, c: '#FB7185' },
          { x: 90, y: 270, c: '#FBBF24' }, { x: 150, y: 270, c: '#A855F7' },
          { x: 90, y: 340, c: '#34D399' }, { x: 150, y: 340, c: '#06B6D4' },
        ].map((t, i) => (
          <g key={i}>
            <ellipse cx={t.x} cy={t.y + 20} rx="14" ry="3" fill={t.c} opacity="0.4" />
            <rect x={t.x - 9} y={t.y - 5} width="18" height="25" fill={t.c} opacity="0.85" />
            <text x={t.x} y={t.y + 11} textAnchor="middle" fontSize="10" fill="#0A0518" fontFamily="ui-monospace, monospace" fontWeight="700">1°</text>
          </g>
        ))}
        <g transform="translate(130, 388) rotate(-8)">
          <rect x="-32" y="-8" width="64" height="16" rx="2" fill="#FBBF24" />
          <text x="0" y="3" textAnchor="middle" fontSize="7" fill="#0A0518" fontFamily="ui-monospace, monospace" fontWeight="700">move fast</text>
        </g>
      </Hotspot>

      {/* ════ HOTSPOT 2 · ORG FLAT ════ */}
      <Hotspot x={680} y={120} w={210} h={150} label="Org flat" {...wrapHotspot('organigrama', props)}>
        <g transform="rotate(-3 785 195)">
          <rect x="680" y="120" width="210" height="150" fill="#FAFAFA" />
          <rect x="760" y="115" width="50" height="14" fill="#06B6D4" opacity="0.5" />
          <text x="785" y="142" textAnchor="middle" fontSize="11" fill="#0A0518" fontFamily="ui-monospace, monospace" fontWeight="700">FLAT ORG</text>
          <ellipse cx="785" cy="162" rx="42" ry="13" fill="none" stroke="#0A0518" strokeWidth="1.5" />
          <text x="785" y="167" textAnchor="middle" fontSize="9" fill="#0A0518" fontFamily="ui-monospace, monospace" fontWeight="600">FOUNDERS</text>
          <line x1="785" y1="175" x2="785" y2="186" stroke="#0A0518" strokeWidth="1.5" />
          <ellipse cx="785" cy="195" rx="32" ry="11" fill="none" stroke="#0A0518" strokeWidth="1.5" />
          <text x="785" y="200" textAnchor="middle" fontSize="9" fill="#0A0518" fontFamily="ui-monospace, monospace" fontWeight="600">CTO</text>
          <line x1="785" y1="206" x2="785" y2="218" stroke="#0A0518" strokeWidth="1.5" />
          {[730, 770, 810, 850].map((bx, i) => (
            <g key={i}>
              <line x1="785" y1="218" x2={bx} y2="225" stroke="#0A0518" strokeWidth="1.2" />
              <circle cx={bx} cy="232" r="7" fill="none" stroke="#0A0518" strokeWidth="1.5" />
            </g>
          ))}
          <text x="785" y="258" textAnchor="middle" fontSize="7" fill="#5A4030" fontFamily="ui-monospace, monospace">break things → ship fast</text>
        </g>
      </Hotspot>

      {/* ════ HOTSPOT 3 · DOCUMENTOS ════ */}
      <Hotspot x={300} y={490} w={170} h={50} label="Eval. proveedores" {...wrapHotspot('documentos', props)}>
        <rect x="300" y="490" width="170" height="50" fill="#FAFAFA" stroke="#A855F7" strokeWidth="1.5" />
        <text x="385" y="504" textAnchor="middle" fontSize="7" fill="#0A0518" fontFamily="ui-monospace, monospace" fontWeight="700">EVAL. PROVEEDORES Q1</text>
        {[
          { y: 510, n: 'Provider A', c: '#34D399' },
          { y: 519, n: 'TU EMPRESA', c: '#FBBF24' },
          { y: 528, n: 'Provider C', c: '#34D399' },
        ].map((r, i) => (
          <g key={i}>
            <text x="308" y={r.y + 6} fontSize="6" fill="#0A0518" fontFamily="ui-monospace, monospace" fontWeight={i === 1 ? '700' : '400'}>{r.n}</text>
            <rect x="405" y={r.y + 1} width="55" height="6" fill={r.c} opacity="0.85" />
          </g>
        ))}
      </Hotspot>

      {/* ════ HOTSPOT 4 · SLACK ════ */}
      <Hotspot x={520} y={500} w={48} h={80} label="Slack 🔥" {...wrapHotspot('celular', props)}>
        <rect x="520" y="500" width="48" height="80" rx="6" fill="#0A0A0A" stroke="#A855F7" strokeWidth="1.5" />
        <rect x="524" y="508" width="40" height="64" rx="2" fill="#1A1A2E" />
        <rect x="524" y="508" width="40" height="11" fill="#4A154B" />
        <text x="544" y="516" textAnchor="middle" fontSize="6" fill="#FAFAFA" fontFamily="ui-monospace, monospace" fontWeight="700">slack · #infra</text>
        {Array.from({ length: 5 }).map((_, i) => (
          <g key={i}>
            <circle cx="528" cy={526 + i * 9} r="2" fill={['#06B6D4', '#FB7185', '#FBBF24', '#34D399', '#A855F7'][i]} />
            <rect x="533" y={524 + i * 9} width={20 + (i * 3) % 10} height="3" fill="#9CA3AF" opacity="0.6" />
          </g>
        ))}
        <text x="544" y="568" textAnchor="middle" fontSize="14">🔥</text>
        <circle cx="563" cy="510" r="8" fill="#DC2626" />
        <text x="563" y="513" textAnchor="middle" fontSize="7" fill="white" fontWeight="700">200</text>
      </Hotspot>

      {/* ════ HOTSPOT 5 · MONITOR CURVO ════ */}
      <Hotspot x={620} y={385} w={170} h={140} label="Terminal · API errors" {...wrapHotspot('computador', props)}>
        <path d="M610,395 Q695,375 780,395 L780,490 Q695,510 610,490 Z" fill="#0A0A0A" stroke="#A855F7" strokeWidth="2" />
        <path d="M615,400 Q695,382 775,400 L775,485 Q695,503 615,485 Z" fill="#0A0518" />
        <text x="625" y="418" fontSize="6" fill="#06B6D4" fontFamily="ui-monospace, monospace">$ curl /v1/products</text>
        <text x="625" y="430" fontSize="6" fill="#F87171" fontFamily="ui-monospace, monospace">429 Rate Limit</text>
        <text x="625" y="441" fontSize="6" fill="#06B6D4" fontFamily="ui-monospace, monospace">$ curl /v1/products</text>
        <text x="625" y="452" fontSize="6" fill="#F87171" fontFamily="ui-monospace, monospace">429 Rate Limit</text>
        <text x="625" y="463" fontSize="6" fill="#06B6D4" fontFamily="ui-monospace, monospace">$ curl /v1/products</text>
        <text x="625" y="474" fontSize="6" fill="#F87171" fontFamily="ui-monospace, monospace">429 Rate Limit</text>
        <rect x="625" y="478" width="6" height="8" fill="#06B6D4">
          <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
        </rect>
        <rect x="615" y="497" width="160" height="2" fill="url(#vg-rgb)" opacity="0.7" />
        <rect x="685" y="510" width="20" height="14" fill="#1A1428" />
        <rect x="660" y="524" width="70" height="6" fill="#0A0512" />
      </Hotspot>

      {/* Mecánico keyboard RGB */}
      <rect x="450" y="555" width="120" height="22" rx="3" fill="#0A0512" stroke="#A855F7" strokeWidth="0.5" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={455 + i * 9.5} y="560" width="7" height="12" rx="1" fill={['#A855F7', '#06B6D4', '#FB7185', '#FBBF24'][i % 4]} opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur={`${1 + (i * 0.1)}s`} repeatCount="indefinite" />
        </rect>
      ))}

      {/* Mouse RGB */}
      <g>
        <ellipse cx="800" cy="568" rx="12" ry="8" fill="#0A0512" stroke="#A855F7" strokeWidth="0.5" />
        <ellipse cx="800" cy="565" rx="2" ry="3" fill="#06B6D4">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
}

// ============================================================================
//  OFICINA 5 · PAREDES — CCO Banco de Inversiones
//  Vibe: biblioteca jurídica, sobrio, marrón profundo + bordó
// ============================================================================
function ParedesOffice(props) {
  return (
    <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="pr-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A1A14" /><stop offset="100%" stopColor="#0E0805" />
        </linearGradient>
        <linearGradient id="pr-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A100A" /><stop offset="100%" stopColor="#080503" />
        </linearGradient>
        <linearGradient id="pr-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A2818" /><stop offset="100%" stopColor="#1A0F08" />
        </linearGradient>
        <pattern id="pr-rug" patternUnits="userSpaceOnUse" width="50" height="50">
          <rect width="50" height="50" fill="#3A1A18" />
          <path d="M25,8 L42,25 L25,42 L8,25 Z" fill="none" stroke="#5A2418" strokeWidth="0.8" />
          <circle cx="25" cy="25" r="3" fill="#5A2418" opacity="0.6" />
        </pattern>
      </defs>

      <rect width="1200" height="450" fill="url(#pr-wall)" />
      <rect y="450" width="1200" height="225" fill="url(#pr-floor)" />
      <line x1="0" y1="450" x2="1200" y2="450" stroke="#3A2418" strokeWidth="2" />

      {/* Alfombra oriental */}
      <ellipse cx="600" cy="640" rx="500" ry="40" fill="#000" opacity="0.5" />
      <rect x="180" y="610" width="840" height="60" fill="url(#pr-rug)" />
      <rect x="180" y="610" width="840" height="60" fill="none" stroke="#704510" strokeWidth="2" />

      {/* Boiserie en pared (paneles madera) */}
      {[150, 380, 1010].map(x => (
        <g key={x}>
          <rect x={x - 70} y="60" width="140" height="380" fill="none" stroke="#5A3520" strokeWidth="1.5" opacity="0.6" />
          <rect x={x - 60} y="70" width="120" height="360" fill="none" stroke="#5A3520" strokeWidth="0.8" opacity="0.4" />
        </g>
      ))}

      {/* Estantería gigante de libros legales */}
      <g>
        <rect x="280" y="60" width="320" height="380" fill="#1A0F08" stroke="#5A3520" strokeWidth="3" />
        {[140, 220, 300, 380].map(y => (
          <line key={y} x1="285" y1={y} x2="595" y2={y} stroke="#5A3520" strokeWidth="2" />
        ))}
        {Array.from({ length: 30 }).map((_, i) => {
          const row = Math.floor(i / 10);
          const col = i % 10;
          const colors = ['#5A1A20', '#3A2410', '#2A1A0E', '#5A4030', '#3A2418', '#5A1A20'];
          const widths = [22, 26, 24, 28, 22, 26, 24];
          return (
            <rect key={i} x={295 + col * 30 + (i * 3) % 5} y={62 + row * 80 + 5}
              width={widths[i % widths.length]} height={70}
              fill={colors[i % colors.length]} stroke="#704510" strokeWidth="0.5" />
          );
        })}
        <rect x="295" y="385" width="290" height="50" fill="#3A2418" />
        <text x="440" y="406" textAnchor="middle" fontSize="9" fill="#B8860B" fontFamily="serif" fontWeight="700">CÓDIGO CIVIL</text>
        <text x="440" y="422" textAnchor="middle" fontSize="7" fill="#9C6F1A" fontFamily="serif">Tomos I-VIII · 2026</text>
      </g>

      {/* Columna jurídica decorativa */}
      <g>
        <rect x="1080" y="60" width="60" height="380" fill="#3A2418" />
        <rect x="1075" y="60" width="70" height="20" fill="#5A4030" />
        <rect x="1075" y="430" width="70" height="20" fill="#5A4030" />
        {[1085, 1100, 1115, 1130].map((x, i) => (
          <line key={i} x1={x} y1="80" x2={x} y2="430" stroke="#1A0F08" strokeWidth="1" />
        ))}
        <text x="1110" y="250" textAnchor="middle" fontSize="9" fill="#B8860B" fontFamily="serif" opacity="0.6" transform="rotate(-90 1110 250)">LEX</text>
      </g>

      {/* DECOY · busto griego sobre pedestal */}
      <Decoy x={70} y={300} w={70} h={130} label="Busto clásico" onDecoyClick={props.onDecoyClick}>
        <rect x="80" y="380" width="50" height="50" fill="#3A2418" stroke="#5A3520" strokeWidth="1.5" />
        <rect x="75" y="376" width="60" height="6" fill="#5A4030" />
        <rect x="80" y="430" width="50" height="6" fill="#5A4030" />
        {/* Busto */}
        <ellipse cx="105" cy="345" rx="22" ry="20" fill="#FAEDD7" stroke="#9C8060" strokeWidth="1" />
        <ellipse cx="98" cy="340" rx="2" ry="3" fill="#3A2418" />
        <ellipse cx="112" cy="340" rx="2" ry="3" fill="#3A2418" />
        <path d="M97,352 Q105,357 113,352" stroke="#3A2418" strokeWidth="1" fill="none" />
        <path d="M85,360 Q105,375 125,360 L125,378 L85,378 Z" fill="#FAEDD7" stroke="#9C8060" strokeWidth="1" />
        {/* Cabello/laurel */}
        <path d="M85,330 Q90,315 98,322" fill="#FAEDD7" stroke="#9C8060" strokeWidth="1" />
        <path d="M125,330 Q120,315 112,322" fill="#FAEDD7" stroke="#9C8060" strokeWidth="1" />
      </Decoy>

      {/* DECOY · balanza de la justicia */}
      <Decoy x={170} y={210} w={80} h={130} label="Balanza de la justicia" onDecoyClick={props.onDecoyClick}>
        <rect x="205" y="320" width="10" height="20" fill="#B8860B" />
        <rect x="195" y="338" width="30" height="6" fill="#704510" />
        <rect x="207" y="220" width="6" height="100" fill="#B8860B" />
        <line x1="170" y1="220" x2="250" y2="220" stroke="#B8860B" strokeWidth="2.5" />
        <line x1="180" y1="220" x2="180" y2="240" stroke="#B8860B" strokeWidth="1" />
        <line x1="240" y1="220" x2="240" y2="240" stroke="#B8860B" strokeWidth="1" />
        <ellipse cx="180" cy="244" rx="14" ry="5" fill="#B8860B" stroke="#704510" strokeWidth="1" />
        <ellipse cx="240" cy="244" rx="14" ry="5" fill="#B8860B" stroke="#704510" strokeWidth="1" />
        <circle cx="210" cy="216" r="4" fill="#FBBF24" />
      </Decoy>

      {/* DECOY · pluma estilográfica con tintero */}
      <Decoy x={770} y={500} w={50} h={45} label="Pluma y tintero" onDecoyClick={props.onDecoyClick}>
        <path d="M775,540 L775,520 L795,520 L795,540 Z" fill="#1A0608" stroke="#B8860B" strokeWidth="1" />
        <ellipse cx="785" cy="520" rx="10" ry="3" fill="#5A1A20" />
        <ellipse cx="785" cy="518" rx="6" ry="2" fill="#1A0608" />
        <line x1="785" y1="518" x2="810" y2="500" stroke="#B8860B" strokeWidth="1.5" />
        <path d="M810,500 L818,494 L820,500 L815,505" fill="#FAEDD7" stroke="#B8860B" strokeWidth="1" />
        <path d="M815,505 L820,500" stroke="#1A0608" strokeWidth="0.5" />
      </Decoy>

      {/* DECOY · libros antiguos apilados sobre el escritorio */}
      <Decoy x={830} y={490} w={70} h={42} label="Libros antiguos" onDecoyClick={props.onDecoyClick}>
        <rect x="832" y="510" width="66" height="22" fill="#5A1A20" stroke="#B8860B" strokeWidth="1" />
        <rect x="836" y="514" width="58" height="14" fill="#704510" />
        <text x="865" y="524" textAnchor="middle" fontSize="6" fill="#FAEDD7" fontFamily="serif">JURISPRUDENCIA</text>
        <rect x="836" y="494" width="62" height="18" fill="#3A2418" stroke="#B8860B" strokeWidth="1" />
        <text x="867" y="506" textAnchor="middle" fontSize="6" fill="#B8860B" fontFamily="serif">CÓDIGO PENAL</text>
      </Decoy>

      {/* DECOY · cofre cerrado */}
      <Decoy x={930} y={500} w={56} h={32} label="Cofre archivo" onDecoyClick={props.onDecoyClick}>
        <rect x="932" y="510" width="52" height="22" fill="#3A2418" stroke="#B8860B" strokeWidth="1.5" />
        <path d="M932,510 Q932,500 942,500 L974,500 Q984,500 984,510" fill="#5A4030" stroke="#B8860B" strokeWidth="1.5" />
        <rect x="954" y="514" width="8" height="10" fill="#B8860B" />
        <circle cx="958" cy="519" r="1.5" fill="#1A0608" />
      </Decoy>

      {/* DECOY · mapamundi antiguo en pared */}
      <Decoy x={760} y={80} w={120} h={90} label="Mapamundi antiguo" onDecoyClick={props.onDecoyClick}>
        <rect x="760" y="80" width="120" height="90" fill="#FAEDD7" stroke="#B8860B" strokeWidth="2" />
        <ellipse cx="820" cy="125" rx="55" ry="40" fill="#704510" opacity="0.3" />
        <path d="M775,110 Q795,100 815,115 Q840,108 855,128 Q860,140 845,150 Q820,148 800,140 Q780,135 775,110 Z" fill="#5A4030" opacity="0.7" />
        <path d="M790,125 Q800,135 815,130" stroke="#1A0608" strokeWidth="0.5" fill="none" />
        <text x="820" y="160" textAnchor="middle" fontSize="6" fill="#5A1A20" fontFamily="serif">ORBIS TERRARUM</text>
      </Decoy>

      {/* Escritorio formal de madera oscura */}
      <polygon points="220,520 980,520 1030,580 180,580" fill="url(#pr-desk)" />
      <rect x="180" y="580" width="850" height="40" fill="#1A0F08" />
      <line x1="200" y1="595" x2="1010" y2="595" stroke="#5A3520" strokeWidth="0.5" opacity="0.6" />
      <rect x="200" y="620" width="22" height="50" fill="#0E0805" />
      <rect x="988" y="620" width="22" height="50" fill="#0E0805" />

      {/* Lámpara de banca verde */}
      <g>
        <ellipse cx="490" cy="500" rx="42" ry="4" fill="#FBBF24" opacity="0.2" />
        <rect x="465" y="486" width="50" height="10" rx="3" fill="#0A4A1A" stroke="#3A6020" strokeWidth="1" />
        <rect x="485" y="450" width="10" height="38" fill="#3A2418" />
        <rect x="475" y="448" width="30" height="4" fill="#3A2418" />
      </g>

      {/* Silla formal */}
      <g transform="translate(610, 560)">
        <ellipse cx="0" cy="100" rx="58" ry="13" fill="#000" opacity="0.5" />
        <path d="M-48,-25 Q-52,-45 -42,-45 L42,-45 Q52,-45 48,-25 L48,80 Q48,90 38,90 L-38,90 Q-48,90 -48,80 Z" fill="#3A2418" stroke="#B8860B" strokeWidth="1.5" />
        {[-25, 0, 25].map(x => [-10, 20, 50].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#B8860B" opacity="0.4" />
        )))}
        <rect x="-3" y="80" width="6" height="22" fill="#3A2418" />
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <line key={i} x1="0" y1="102" x2={Math.cos(deg * Math.PI / 180) * 38} y2={102 + Math.sin(deg * Math.PI / 180) * 9} stroke="#3A2418" strokeWidth="3" />
        ))}
      </g>

      {/* ════ HOTSPOT 1 · DIPLOMAS ════ */}
      <Hotspot x={50} y={120} w={180} h={170} label="Diplomas" {...wrapHotspot('trofeos', props)}>
        {[
          { y: 130, txt: 'DERECHO', sub: 'Univ. Nacional · 2008' },
          { y: 215, txt: 'MBA', sub: 'INSEAD · 2012' },
        ].map((d, i) => (
          <g key={i}>
            <rect x="62" y={d.y} width="156" height="76" fill="#B8860B" />
            <rect x="68" y={d.y + 6} width="144" height="64" fill="#FAF6E8" />
            <circle cx="200" cy={d.y + 38} r="12" fill="none" stroke="#5A1A20" strokeWidth="1.2" />
            <circle cx="200" cy={d.y + 38} r="8" fill="none" stroke="#5A1A20" strokeWidth="0.8" />
            <text x="200" y={d.y + 41} textAnchor="middle" fontSize="6" fill="#5A1A20" fontFamily="serif" fontWeight="700">EP</text>
            <text x="135" y={d.y + 32} textAnchor="middle" fontSize="11" fill="#5A1A20" fontFamily="serif" fontWeight="700">{d.txt}</text>
            <text x="135" y={d.y + 48} textAnchor="middle" fontSize="6" fill="#5A4030" fontFamily="serif" fontStyle="italic">{d.sub}</text>
            <line x1="80" y1={d.y + 56} x2="180" y2={d.y + 56} stroke="#B8860B" strokeWidth="0.5" />
            <text x="135" y={d.y + 64} textAnchor="middle" fontSize="6" fill="#704510" fontFamily="serif">Eduardo Paredes</text>
          </g>
        ))}
      </Hotspot>

      {/* ════ HOTSPOT 2 · ORGANIGRAMA Board Compliance ════ */}
      <Hotspot x={620} y={180} w={210} h={170} label="Board Compliance" {...wrapHotspot('organigrama', props)}>
        <rect x="620" y="180" width="210" height="170" fill="#FAF6E8" stroke="#5A1A20" strokeWidth="3" />
        <rect x="620" y="180" width="210" height="22" fill="#5A1A20" />
        <text x="725" y="195" textAnchor="middle" fontSize="9" fill="#FBBF24" fontFamily="serif" fontWeight="700">BOARD OF COMPLIANCE</text>
        <rect x="685" y="215" width="80" height="22" fill="#5A1A20" stroke="#B8860B" strokeWidth="1" />
        <text x="725" y="230" textAnchor="middle" fontSize="9" fill="#FBBF24" fontFamily="serif" fontWeight="700">CCO</text>
        <line x1="725" y1="238" x2="725" y2="250" stroke="#5A1A20" strokeWidth="1.5" />
        <line x1="650" y1="250" x2="800" y2="250" stroke="#5A1A20" strokeWidth="1.5" />
        {[660, 725, 790].map((bx, i) => (
          <g key={i}>
            <line x1={bx} y1="250" x2={bx} y2="260" stroke="#5A1A20" strokeWidth="1.5" />
            <rect x={bx - 25} y="260" width="50" height="20" fill="none" stroke="#5A1A20" strokeWidth="1.5" />
            <text x={bx} y="273" textAnchor="middle" fontSize="7" fill="#5A1A20" fontFamily="serif" fontWeight="600">{['AML', 'KYC', 'AUDIT'][i]}</text>
          </g>
        ))}
        <g transform="rotate(3 798 320)">
          <rect x="768" y="305" width="60" height="34" fill="#F5C44A" />
          <text x="798" y="320" textAnchor="middle" fontSize="7" fill="#5A1A20" fontFamily="ui-monospace, monospace" fontWeight="700">SBS</text>
          <text x="798" y="332" textAnchor="middle" fontSize="6" fill="#5A1A20" fontFamily="ui-monospace, monospace" fontWeight="700">30 DÍAS</text>
        </g>
      </Hotspot>

      {/* ════ HOTSPOT 3 · CIRCULAR SBS ════ */}
      <Hotspot x={300} y={500} w={170} h={50} label="Circular SBS" {...wrapHotspot('documentos', props)}>
        <rect x="300" y="500" width="170" height="50" fill="#FAF6E8" stroke="#5A1A20" strokeWidth="1.5" />
        <rect x="300" y="500" width="170" height="11" fill="#5A1A20" />
        <text x="385" y="508" textAnchor="middle" fontSize="6" fill="#FBBF24" fontFamily="serif" fontWeight="700">SUPERINTENDENCIA DE BANCA Y SEGUROS</text>
        <text x="308" y="523" fontSize="7" fill="#5A1A20" fontFamily="serif" fontWeight="700">CIRCULAR N° 2026-001</text>
        {Array.from({ length: 3 }).map((_, i) => (
          <line key={i} x1="308" y1={529 + i * 4} x2={425 - i * 8} y2={529 + i * 4} stroke="#5A4030" strokeWidth="0.5" opacity="0.6" />
        ))}
        <circle cx="440" cy="535" r="12" fill="none" stroke="#5A1A20" strokeWidth="1.2" opacity="0.85" />
        <text x="440" y="538" textAnchor="middle" fontSize="6" fill="#5A1A20" fontFamily="serif" fontWeight="700" opacity="0.85">URG.</text>
      </Hotspot>

      {/* ════ HOTSPOT 4 · TELÉFONO FIJO ════ */}
      <Hotspot x={520} y={490} w={70} h={50} label="Teléfono fijo" {...wrapHotspot('celular', props)}>
        <rect x="520" y="510" width="70" height="30" rx="4" fill="#1A0F08" stroke="#3A2418" strokeWidth="1.5" />
        <path d="M530,498 Q535,490 545,492 L565,494 Q575,492 580,498 L578,510 Q550,508 524,510 Z" fill="#0E0805" stroke="#3A2418" strokeWidth="1.5" />
        {[0, 1, 2].map(c =>
          [0, 1, 2].map(r => (
            <rect key={`${c}-${r}`} x={530 + c * 12} y={518 + r * 6} width="9" height="4" rx="1" fill="#3A2418" />
          ))
        )}
        <circle cx="578" cy="520" r="3" fill="#DC2626">
          <animate attributeName="opacity" values="1;0.2;1" dur="0.7s" repeatCount="indefinite" />
        </circle>
        <text x="578" y="538" textAnchor="middle" fontSize="5" fill="#9C6F1A" fontFamily="ui-monospace, monospace">SBS</text>
      </Hotspot>

      {/* ════ HOTSPOT 5 · SISTEMA AML ════ */}
      <Hotspot x={620} y={400} w={150} h={120} label="Sistema AML" {...wrapHotspot('computador', props)}>
        <rect x="620" y="400" width="150" height="100" rx="3" fill="#0A0A0A" stroke="#3A2418" strokeWidth="2" />
        <rect x="624" y="404" width="142" height="92" fill="#FAF6E8" />
        <rect x="624" y="404" width="142" height="14" fill="#5A1A20" />
        <text x="695" y="414" textAnchor="middle" fontSize="8" fill="#FBBF24" fontFamily="serif" fontWeight="700">SISTEMA AML · ALERTAS</text>
        <text x="695" y="445" textAnchor="middle" fontSize="22" fill="#DC2626" fontFamily="serif" fontWeight="700">847</text>
        <text x="695" y="458" textAnchor="middle" fontSize="7" fill="#5A1A20" fontFamily="serif">alertas pendientes</text>
        <rect x="630" y="467" width="130" height="22" fill="#FAFAFA" stroke="#9C6F1A" strokeWidth="0.5" />
        {[
          { y: 472, t: 'Operaciones sospechosas', n: '247', c: '#DC2626' },
          { y: 480, t: 'Transferencias intl.', n: '600', c: '#FBBF24' },
        ].map((r, i) => (
          <g key={i}>
            <text x="635" y={r.y + 6} fontSize="5" fill="#5A1A20" fontFamily="ui-monospace, monospace">{r.t}</text>
            <text x="755" y={r.y + 6} textAnchor="end" fontSize="6" fill={r.c} fontFamily="ui-monospace, monospace" fontWeight="700">{r.n}</text>
          </g>
        ))}
        <rect x="690" y="500" width="20" height="14" fill="#3A2418" />
        <rect x="670" y="514" width="60" height="6" fill="#1A0F08" />
      </Hotspot>

      {/* DECOY · pergamino enrollado sobre el escritorio */}
      <Decoy x={400} y={555} w={56} h={20} label="Pergamino" onDecoyClick={props.onDecoyClick}>
        <ellipse cx="406" cy="565" rx="6" ry="8" fill="#FAEDD7" stroke="#B8860B" strokeWidth="1" />
        <ellipse cx="450" cy="565" rx="6" ry="8" fill="#FAEDD7" stroke="#B8860B" strokeWidth="1" />
        <rect x="406" y="557" width="44" height="16" fill="#FAEDD7" stroke="#B8860B" strokeWidth="0.5" />
        <line x1="412" y1="563" x2="446" y2="563" stroke="#5A4030" strokeWidth="0.5" />
        <line x1="412" y1="568" x2="440" y2="568" stroke="#5A4030" strokeWidth="0.5" />
      </Decoy>
    </svg>
  );
}

// ============================================================================
//  WRAPPER HELPER + EXPORT
// ============================================================================
function wrapHotspot(key, { discoveredKeys, activeClueKey, onClueClick }) {
  return {
    isDiscovered: discoveredKeys?.includes(key) || false,
    isActive: activeClueKey === key,
    onClick: () => onClueClick?.(key),
  };
}

const SCENES = {
  'director-agresivo': MendozaOffice,
  'directora-analitica': HerreraOffice,
  'gerente-politico': CastilloOffice,
  'cto-tecnico': VegaOffice,
  'compliance-officer': ParedesOffice,
};

export default function OfficeScene({
  clientId = 'director-agresivo',
  discoveredKeys = [],
  activeClueKey = null,
  onClueClick,
}) {
  const [decoyMessage, setDecoyMessage] = useState(null);
  const Scene = SCENES[clientId] || MendozaOffice;

  const handleDecoyClick = useCallback((label) => {
    setDecoyMessage(label || 'objeto sin información');
    setTimeout(() => setDecoyMessage(null), 2000);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%', maxWidth: 1200, margin: '0 auto',
      aspectRatio: '16 / 9',
      background: '#0A0E14', borderRadius: 10, overflow: 'hidden',
    }}>
      <style>{`
        @keyframes os-toast-in { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
      <Scene
        discoveredKeys={discoveredKeys}
        activeClueKey={activeClueKey}
        onClueClick={onClueClick}
        onDecoyClick={handleDecoyClick}
      />
      <DecoyToast message={decoyMessage} />
    </div>
  );
}
