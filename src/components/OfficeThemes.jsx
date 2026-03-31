// OfficeThemes.jsx — 3 entornos visuales para la oficina del Client Director
// Cada tema exporta solo el FONDO + MOBILIARIO (no los objetos interactivos)
// Los objetos interactivos se renderizan encima por ClientDirectorStation.jsx
//
// Uso: import { officeThemes } from './OfficeThemes';
//      const theme = officeThemes[Math.floor(Math.random() * officeThemes.length)];
//      <theme.Background />  ← renderiza paredes, muebles, ambiente
//      <theme.objects>       ← posiciones de objetos ajustadas al layout

import { useState, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════
// TEMA 1 — BIBLIOTECA OSCURA (basado en refs 1-2: madera, libros, cálido)
// ═══════════════════════════════════════════════════════════════════════
const BibliotecaBackground = () => (
  <>
    <defs>
      <linearGradient id="bib-bg" x1="0" y1="0" x2="0.1" y2="1">
        <stop offset="0%" stopColor="#14110d" />
        <stop offset="100%" stopColor="#0a0806" />
      </linearGradient>
      <linearGradient id="bib-wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3d3020" />
        <stop offset="100%" stopColor="#261c10" />
      </linearGradient>
      <linearGradient id="bib-desk" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0%" stopColor="#4a3a28" />
        <stop offset="50%" stopColor="#3d3020" />
        <stop offset="100%" stopColor="#352818" />
      </linearGradient>
      <radialGradient id="bib-lamp1" cx="20%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="bib-lamp2" cx="80%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Room */}
    <rect width="800" height="520" fill="url(#bib-bg)" />

    {/* Back wall — dark wood paneling */}
    <rect x="0" y="0" width="800" height="280" fill="#18140e" />
    {/* Wainscoting panels */}
    {[0,160,320,480,640].map((px,i) => (
      <rect key={`wp-${i}`} x={px+5} y="5" width="150" height="270" fill="none" stroke="#2a2218" strokeWidth="1" rx="2" />
    ))}
    {/* Crown molding */}
    <rect x="0" y="275" width="800" height="8" fill="#2a2218" />
    <line x1="0" y1="275" x2="800" y2="275" stroke="#3a3020" strokeWidth="1" />

    {/* Floor — dark hardwood */}
    <rect x="0" y="283" width="800" height="237" fill="#110e0a" />
    {Array.from({length:12}).map((_,i) => (
      <line key={`fl-${i}`} x1="0" y1={283+i*20} x2="800" y2={283+i*20} stroke="#1a1610" strokeWidth="0.3" />
    ))}

    {/* LEFT BOOKSHELF — floor to ceiling */}
    <rect x="0" y="0" width="120" height="280" fill="url(#bib-wood)" stroke="#3a3020" strokeWidth="1" />
    {[0,1,2,3,4,5].map(i => (
      <g key={`ls-${i}`}>
        <rect x="4" y={8+i*45} width="112" height="3" fill="#4a3a28" />
        {/* Books — varied colors, heights */}
        {Array.from({length:6}).map((_,j) => {
          const bw = 6 + (j*3+i*2)%8;
          const bh = 28 + (j*5+i*7)%14;
          const colors = ['#7f1d1d','#1e3a5f','#365314','#4a1d7a','#713f12','#1a3a3a','#5c1d5c','#3a2510'];
          return <rect key={`lb-${i}-${j}`} x={8+j*18} y={8+i*45+42-bh} width={bw} height={bh} fill={colors[(i+j)%8]} opacity={0.3+j*0.05} rx="0.5" />;
        })}
      </g>
    ))}

    {/* RIGHT BOOKSHELF — floor to ceiling */}
    <rect x="680" y="0" width="120" height="280" fill="url(#bib-wood)" stroke="#3a3020" strokeWidth="1" />
    {[0,1,2,3,4,5].map(i => (
      <g key={`rs-${i}`}>
        <rect x="684" y={8+i*45} width="112" height="3" fill="#4a3a28" />
        {Array.from({length:6}).map((_,j) => {
          const bw = 5 + (j*4+i*3)%9;
          const bh = 25 + (j*7+i*5)%16;
          const colors = ['#713f12','#1e3a5f','#7f1d1d','#365314','#4a1d7a','#2a1a10','#1a3a3a','#5c1d5c'];
          return <rect key={`rb-${i}-${j}`} x={688+j*18} y={8+i*45+42-bh} width={bw} height={bh} fill={colors[(i+j+3)%8]} opacity={0.25+j*0.05} rx="0.5" />;
        })}
      </g>
    ))}

    {/* PAINTINGS on back wall */}
    <rect x="220" y="30" width="90" height="70" fill="#1a1610" rx="2" stroke="#4a3a28" strokeWidth="2" />
    <rect x="225" y="35" width="80" height="60" fill="#1a2530" opacity="0.4" rx="1" />
    <rect x="490" y="25" width="80" height="65" fill="#1a1610" rx="2" stroke="#4a3a28" strokeWidth="2" />
    <rect x="495" y="30" width="70" height="55" fill="#2a1a10" opacity="0.3" rx="1" />

    {/* HEAVY DESK — center */}
    <polygon points="160,310 640,310 660,328 140,328" fill="url(#bib-desk)" stroke="#4a3a28" strokeWidth="0.8" />
    <rect x="140" y="328" width="520" height="55" fill="#2a2014" stroke="#3a3020" strokeWidth="0.5" rx="2" />
    {/* Desk drawers */}
    <rect x="160" y="335" width="80" height="40" fill="#231a10" rx="1" stroke="#3a3020" strokeWidth="0.3" />
    <ellipse cx="200" cy="355" rx="6" ry="2.5" fill="#b8860b" opacity="0.3" />
    <rect x="460" y="335" width="80" height="40" fill="#231a10" rx="1" stroke="#3a3020" strokeWidth="0.3" />
    <ellipse cx="500" cy="355" rx="6" ry="2.5" fill="#b8860b" opacity="0.3" />
    {/* Desk legs */}
    <rect x="150" y="383" width="10" height="30" fill="#1a1610" />
    <rect x="640" y="383" width="10" height="30" fill="#1a1610" />

    {/* TUFTED CHAIR */}
    <g pointerEvents="none">
      <ellipse cx="400" cy="455" rx="42" ry="8" fill="#000" opacity="0.15" />
      {[0,72,144,216,288].map((a,i) => <line key={`bcl-${i}`} x1="400" y1="448" x2={400+Math.cos(a*Math.PI/180)*22} y2={448+Math.sin(a*Math.PI/180)*6} stroke="#2a2014" strokeWidth="1.5" />)}
      <rect x="396" y="418" width="8" height="30" fill="#2a2014" />
      <ellipse cx="400" cy="418" rx="30" ry="9" fill="#2a2520" stroke="#3a3020" strokeWidth="0.5" />
      <rect x="370" y="350" width="60" height="70" fill="#2a2520" rx="6" stroke="#3a3020" strokeWidth="0.5" />
      {/* Tufting dots */}
      {[380,395,410,425].map((tx,i) => [358,372,386,400].map((ty,j) => (
        <circle key={`tf-${i}-${j}`} cx={tx} cy={ty} r="1" fill="#3a3020" opacity="0.3" />
      )))}
    </g>

    {/* WARM LAMP LIGHT — left */}
    <g pointerEvents="none">
      <circle cx="145" cy="15" r="8" fill="#fbbf24" opacity="0.08" />
      <line x1="145" y1="23" x2="145" y2="30" stroke="#3a3020" strokeWidth="1" />
      <rect x="0" y="0" width="800" height="520" fill="url(#bib-lamp1)" opacity="0.4" />
    </g>
    {/* WARM LAMP LIGHT — right */}
    <g pointerEvents="none">
      <circle cx="655" cy="15" r="8" fill="#fbbf24" opacity="0.08" />
      <line x1="655" y1="23" x2="655" y2="30" stroke="#3a3020" strokeWidth="1" />
      <rect x="0" y="0" width="800" height="520" fill="url(#bib-lamp2)" opacity="0.3" />
    </g>

    {/* Display case — left shelf alcove */}
    <rect x="130" y="120" width="70" height="90" fill="#14110d" rx="2" stroke="#3a3020" strokeWidth="0.8" />
    <rect x="133" y="123" width="64" height="84" fill="#0a0806" rx="1" />
    {/* Glass shelves in case */}
    <line x1="133" y1="152" x2="197" y2="152" stroke="#3a3020" strokeWidth="0.3" opacity="0.5" />
    <line x1="133" y1="180" x2="197" y2="180" stroke="#3a3020" strokeWidth="0.3" opacity="0.5" />

    {/* Rug under desk */}
    <ellipse cx="400" cy="400" rx="200" ry="30" fill="#1a1610" opacity="0.4" stroke="#2a2218" strokeWidth="0.5" />
  </>
);

const bibliotecaObjectPositions = {
  computador: { x: 340, y: 225, w: 120, h: 85 },
  documentos: { x: 250, y: 296, w: 60, h: 18 },
  celular: { x: 510, y: 298, w: 28, h: 16 },
  trofeos: { x: 133, y: 125, w: 60, h: 80 },
  organigrama: { x: 490, y: 25, w: 82, h: 67 },
  fakes: {
    lamp: { x: 185, y: 280, w: 35, h: 30 },
    painting: { x: 220, y: 30, w: 92, h: 72 },
    books1: { x: 8, y: 55, w: 105, h: 40 },
    books2: { x: 688, y: 55, w: 105, h: 40 },
    mug: { x: 440, y: 298, w: 18, h: 15 },
    drawer: { x: 160, y: 335, w: 80, h: 40 },
    pen: { x: 318, y: 296, w: 14, h: 16 },
    photo: { x: 140, y: 160, w: 50, h: 20 },
    clock: { x: 360, y: 18, w: 40, h: 40 },
    notebook: { x: 560, y: 300, w: 35, h: 12 },
    plant: { x: 620, y: 290, w: 25, h: 80 },
    drawer2: { x: 460, y: 335, w: 80, h: 40 },
  }
};

// ═══════════════════════════════════════════════════════════════════════
// TEMA 2 — CENTRO DE COMANDO (basado en ref 3: monitors, LED, gaming)
// ═══════════════════════════════════════════════════════════════════════
const ComandoBackground = () => (
  <>
    <defs>
      <linearGradient id="cmd-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0c0a08" />
        <stop offset="100%" stopColor="#060504" />
      </linearGradient>
      <linearGradient id="cmd-desk" x1="0" y1="0" x2="1" y2="0.2">
        <stop offset="0%" stopColor="#1a1818" />
        <stop offset="100%" stopColor="#141212" />
      </linearGradient>
      <linearGradient id="cmd-led" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#f97316" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="cmd-ceil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f97316" stopOpacity="0.06" />
        <stop offset="30%" stopColor="#f97316" stopOpacity="0.02" />
        <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
      </linearGradient>
    </defs>

    <rect width="800" height="520" fill="url(#cmd-bg)" />

    {/* Ceiling with LED accent */}
    <rect x="0" y="0" width="800" height="25" fill="#0e0c0a" />
    <rect x="30" y="22" width="740" height="3" fill="#f97316" opacity="0.08">
      <animate attributeName="opacity" values="0.06;0.12;0.06" dur="4s" repeatCount="indefinite" />
    </rect>
    <rect x="0" y="0" width="800" height="80" fill="url(#cmd-ceil)" pointerEvents="none" />

    {/* Back wall */}
    <rect x="0" y="25" width="800" height="260" fill="#0e0c0a" />
    {/* Accent strip on wall */}
    <line x1="0" y1="282" x2="800" y2="282" stroke="#1e1a18" strokeWidth="0.5" />

    {/* Floor — dark with subtle carpet texture */}
    <rect x="0" y="285" width="800" height="235" fill="#0a0908" />

    {/* PROJECTOR/LARGE SCREEN — right wall */}
    <rect x="480" y="35" width="290" height="175" fill="#09090b" rx="3" stroke="#1a1818" strokeWidth="1.5" />
    <rect x="485" y="40" width="280" height="165" fill="#060810" rx="2" />
    {/* Screen content — abstract dark scene */}
    <rect x="486" y="41" width="278" height="163" fill="#0a1020" rx="1.5" />
    {/* Abstract shapes on screen */}
    <rect x="560" y="80" width="3" height="80" fill="#3b82f6" opacity="0.08" />
    <rect x="620" y="60" width="3" height="100" fill="#3b82f6" opacity="0.06" />
    <circle cx="625" cy="120" r="30" fill="#1e3a5f" opacity="0.06" />
    {/* Screen glow on wall */}
    <rect x="480" y="35" width="290" height="175" fill="#3b82f6" opacity="0.008" pointerEvents="none" />

    {/* SHELF with collectibles — upper wall */}
    <rect x="30" y="40" width="420" height="6" fill="#1a1818" stroke="#222020" strokeWidth="0.3" />
    {/* LED strip under shelf */}
    <rect x="35" y="46" width="410" height="1.5" fill="#f97316" opacity="0.06" />
    {/* Items on shelf */}
    {Array.from({length:14}).map((_,i) => {
      const sx = 40 + i * 30;
      const sh = 10 + (i*7)%18;
      const colors = ['#7f1d1d','#1e3a5f','#f97316','#22c55e','#a855f7','#eab308','#3b82f6'];
      return <rect key={`si-${i}`} x={sx} y={40-sh} width={8+(i%3)*4} height={sh} fill={colors[i%7]} opacity={0.12+(i%4)*0.04} rx="1" />;
    })}

    {/* L-SHAPED DESK */}
    {/* Main desk */}
    <polygon points="130,310 550,310 560,325 120,325" fill="url(#cmd-desk)" stroke="#222020" strokeWidth="0.5" />
    <rect x="120" y="325" width="440" height="50" fill="#141212" stroke="#1a1818" strokeWidth="0.4" rx="1" />
    {/* Side extension */}
    <polygon points="550,290 700,290 710,305 540,305" fill="url(#cmd-desk)" stroke="#222020" strokeWidth="0.5" />
    <rect x="540" y="305" width="170" height="70" fill="#141212" stroke="#1a1818" strokeWidth="0.4" rx="1" />
    {/* LED underglow on desk */}
    <rect x="125" y="375" width="430" height="2" fill="#f97316" opacity="0.06">
      <animate attributeName="opacity" values="0.04;0.1;0.04" dur="3s" repeatCount="indefinite" />
    </rect>
    <rect x="545" y="375" width="160" height="2" fill="#ef4444" opacity="0.05">
      <animate attributeName="opacity" values="0.03;0.08;0.03" dur="3.5s" repeatCount="indefinite" />
    </rect>
    {/* Desk legs */}
    <rect x="128" y="375" width="4" height="25" fill="#141212" />
    <rect x="550" y="375" width="4" height="25" fill="#141212" />
    <rect x="700" y="375" width="4" height="25" fill="#141212" />

    {/* GAMING CHAIR */}
    <g pointerEvents="none">
      <ellipse cx="340" cy="448" rx="30" ry="6" fill="#000" opacity="0.12" />
      {[0,72,144,216,288].map((a,i) => <line key={`gcl-${i}`} x1="340" y1="443" x2={340+Math.cos(a*Math.PI/180)*18} y2={443+Math.sin(a*Math.PI/180)*5} stroke="#141212" strokeWidth="1.5" />)}
      <rect x="337" y="413" width="6" height="30" fill="#141212" />
      <ellipse cx="340" cy="413" rx="25" ry="8" fill="#1a1818" stroke="#222020" strokeWidth="0.4" />
      <rect x="315" y="345" width="50" height="70" fill="#141416" rx="4" stroke="#ef4444" strokeWidth="0.3" opacity="0.8" />
      <rect x="320" y="335" width="40" height="14" fill="#141416" rx="6" stroke="#ef4444" strokeWidth="0.3" opacity="0.8" />
      {/* Red accent on chair */}
      <line x1="316" y1="350" x2="316" y2="410" stroke="#ef4444" strokeWidth="0.5" opacity="0.25" />
      <line x1="364" y1="350" x2="364" y2="410" stroke="#ef4444" strokeWidth="0.5" opacity="0.25" />
    </g>

    {/* HEADPHONES on wall hook */}
    <g pointerEvents="none" transform="translate(760, 100)">
      <rect x="-2" y="0" width="4" height="8" fill="#222020" rx="1" />
      <path d="M-8,10 Q-8,0 0,-2 Q8,0 8,10" fill="none" stroke="#222020" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="-10" y="8" width="7" height="5" fill="#1a1818" rx="1.5" />
      <rect x="3" y="8" width="7" height="5" fill="#1a1818" rx="1.5" />
    </g>

    {/* COUCH — right side */}
    <g pointerEvents="none">
      <rect x="620" y="400" width="150" height="50" fill="#1a1618" rx="5" stroke="#222020" strokeWidth="0.5" />
      <rect x="618" y="395" width="154" height="10" fill="#1e1a1c" rx="3" />
      <rect x="615" y="385" width="12" height="65" fill="#1e1a1c" rx="3" />
      <rect x="762" y="385" width="12" height="65" fill="#1e1a1c" rx="3" />
    </g>

    {/* Ambient LED glow from floor */}
    <rect x="0" y="370" width="800" height="150" fill="url(#cmd-led)" opacity="0.5" pointerEvents="none" />
  </>
);

const comandoObjectPositions = {
  computador: { x: 230, y: 200, w: 130, h: 100 },
  documentos: { x: 400, y: 296, w: 55, h: 18 },
  celular: { x: 480, y: 300, w: 26, h: 14 },
  trofeos: { x: 40, y: 20, w: 60, h: 25 },
  organigrama: { x: 580, y: 280, w: 110, h: 50 },
  fakes: {
    bigscreen: { x: 480, y: 35, w: 292, h: 177 },
    headphones: { x: 748, y: 96, w: 24, h: 18 },
    shelf1: { x: 110, y: 18, w: 50, h: 28 },
    shelf2: { x: 250, y: 18, w: 50, h: 28 },
    shelf3: { x: 350, y: 18, w: 50, h: 28 },
    keyboard: { x: 260, y: 303, w: 70, h: 10 },
    mouse: { x: 340, y: 306, w: 16, h: 10 },
    couch: { x: 620, y: 385, w: 152, h: 67 },
    lamp: { x: 140, y: 270, w: 30, h: 35 },
    mug: { x: 520, y: 298, w: 16, h: 14 },
    notebook: { x: 460, y: 298, w: 30, h: 12 },
    charger: { x: 550, y: 300, w: 18, h: 8 },
  }
};

// ═══════════════════════════════════════════════════════════════════════
// TEMA 3 — CORPORATIVA MODERNA (ya existente, positions only)
// El SVG background ya está en ClientDirectorStation.jsx
// ═══════════════════════════════════════════════════════════════════════
const modernaObjectPositions = {
  computador: { x: 372, y: 196, w: 116, h: 88 },
  documentos: { x: 293, y: 267, w: 60, h: 18 },
  celular: { x: 613, y: 268, w: 26, h: 16 },
  trofeos: { x: 50, y: 168, w: 55, h: 25 },
  organigrama: { x: 590, y: 192, w: 118, h: 52 },
  fakes: {
    lamp: { x: 242, y: 247, w: 32, h: 38 },
    mon2: { x: 498, y: 208, w: 58, h: 60 },
    kb: { x: 383, y: 278, w: 80, h: 10 },
    nb: { x: 562, y: 272, w: 38, h: 12 },
    mug: { x: 645, y: 270, w: 18, h: 15 },
    water: { x: 355, y: 260, w: 10, h: 22 },
    succ: { x: 536, y: 264, w: 18, h: 18 },
    pens: { x: 260, y: 268, w: 12, h: 16 },
    photo: { x: 112, y: 170, w: 20, h: 22 },
    books: { x: 143, y: 174, w: 28, h: 18 },
    chrg: { x: 247, y: 278, w: 18, h: 8 },
    art: { x: 256, y: 196, w: 52, h: 40 },
    clock: { x: 510, y: 192, w: 32, h: 32 },
    plant: { x: 726, y: 305, w: 32, h: 85 },
    tab: { x: 40, y: 292, w: 35, h: 14 },
    hp: { x: 157, y: 290, w: 28, h: 14 },
    sticky: { x: 483, y: 196, w: 16, h: 14 },
  }
};

// ═══════════════════════════════════════════════════════════════════════
// EXPORT — Array de temas
// ═══════════════════════════════════════════════════════════════════════
export const officeThemes = [
  {
    id: 'biblioteca',
    name: 'Biblioteca Oscura',
    Background: BibliotecaBackground,
    positions: bibliotecaObjectPositions
  },
  {
    id: 'comando',
    name: 'Centro de Comando',
    Background: ComandoBackground,
    positions: comandoObjectPositions
  },
  {
    id: 'moderna',
    name: 'Corporativa Moderna',
    Background: null, // usa el SVG inline existente en ClientDirectorStation
    positions: modernaObjectPositions
  }
];

export default officeThemes;