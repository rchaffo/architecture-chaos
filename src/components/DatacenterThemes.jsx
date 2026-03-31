// DatacenterThemes.jsx — 2 entornos visuales para el Escape Room del Analista
// Tema 1: Pasillo de Racks (vista corredor, ref foto 4)
// Tema 2: Sala de Servidores (vista amplia, ref foto 5)
//
// Uso: import { datacenterThemes } from './DatacenterThemes';

// ═══════════════════════════════════════════════════════════════════════
// TEMA 1 — PASILLO DE RACKS (corredor angosto, perspectiva 1era persona)
// Basado en ref 4: pasillo entre racks altos, cables azules, muchos LEDs
// ═══════════════════════════════════════════════════════════════════════
const PasilloBackground = () => (
  <>
    <defs>
      <linearGradient id="pas-bg" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#0c0e12" />
        <stop offset="100%" stopColor="#060708" />
      </linearGradient>
      <linearGradient id="pas-rack" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e2028" />
        <stop offset="50%" stopColor="#16181e" />
        <stop offset="100%" stopColor="#101218" />
      </linearGradient>
      <linearGradient id="pas-floor" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#1a1c22" />
        <stop offset="100%" stopColor="#0e1014" />
      </linearGradient>
      <linearGradient id="pas-ceil-light" x1="0.5" y1="1" x2="0.5" y2="0">
        <stop offset="0%" stopColor="#e0e8f0" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#e0e8f0" stopOpacity="0" />
      </linearGradient>
    </defs>

    <rect width="800" height="520" fill="url(#pas-bg)" />

    {/* ═══ PERSPECTIVE CORRIDOR ═══ */}
    {/* Vanishing point at center (~400, 180) */}

    {/* Ceiling */}
    <polygon points="0,0 800,0 580,120 220,120" fill="#0a0c10" />
    {/* Ceiling panels */}
    <polygon points="50,0 200,0 260,120 230,120" fill="#0c0e14" stroke="#14161c" strokeWidth="0.3" />
    <polygon points="200,0 400,0 400,120 260,120" fill="#0e1016" stroke="#14161c" strokeWidth="0.3" />
    <polygon points="400,0 600,0 540,120 400,120" fill="#0e1016" stroke="#14161c" strokeWidth="0.3" />
    <polygon points="600,0 750,0 570,120 540,120" fill="#0c0e14" stroke="#14161c" strokeWidth="0.3" />

    {/* Ceiling fluorescent lights */}
    {[300, 400, 500].map((lx, i) => {
      const lx1 = lx - 80 + i * 10, lx2 = lx + 80 - i * 10;
      const ly = 60 + i * 20;
      return (
        <g key={`cfl-${i}`} pointerEvents="none">
          <line x1={lx1} y1={ly} x2={lx2} y2={ly} stroke="#c8d4e0" strokeWidth={3 - i * 0.5} opacity={0.12 - i * 0.02} />
          <line x1={lx1} y1={ly} x2={lx2} y2={ly} stroke="#fff" strokeWidth={1.5 - i * 0.3} opacity={0.06 - i * 0.01} />
        </g>
      );
    })}
    {/* Light glow down */}
    <rect x="220" y="120" width="360" height="60" fill="url(#pas-ceil-light)" pointerEvents="none" />

    {/* Floor — perspective tiles */}
    <polygon points="0,520 800,520 580,340 220,340" fill="url(#pas-floor)" />
    {/* Floor tile lines */}
    {[360, 380, 400, 430, 470, 520].map((fy, i) => {
      const spread = (fy - 340) / 180;
      const lx = 220 - spread * 220;
      const rx = 580 + spread * 220;
      return <line key={`ftl-${i}`} x1={lx} y1={fy} x2={rx} y2={fy} stroke="#1e2028" strokeWidth={0.3 + spread * 0.5} opacity={0.2 + spread * 0.2} />;
    })}
    {/* Floor center line */}
    <line x1="400" y1="340" x2="400" y2="520" stroke="#1a1c22" strokeWidth="0.5" opacity="0.3" />
    {/* Floor reflection */}
    <polygon points="350,340 450,340 500,520 300,520" fill="#c8d4e0" opacity="0.008" />

    {/* ═══ LEFT RACK ROW ═══ */}
    {/* Each rack gets smaller toward vanishing point */}
    {[0, 1, 2, 3, 4].map(i => {
      const x = 30 + i * 42;
      const w = 80 - i * 10;
      const y1 = 30 + i * 20;
      const h = 320 - i * 40;
      const y2 = y1 + h;
      return (
        <g key={`lr-${i}`}>
          {/* Rack frame */}
          <rect x={x} y={y1} width={w} height={h} fill="url(#pas-rack)" stroke="#222630" strokeWidth={1 - i * 0.1} rx="1" />
          {/* Server units */}
          {Array.from({length: Math.max(3, 8 - i)}).map((_, j) => {
            const uy = y1 + 8 + j * (h / (9 - i));
            const uh = h / (11 - i);
            return (
              <g key={`lu-${i}-${j}`}>
                <rect x={x + 4} y={uy} width={w - 8} height={uh} fill="#0a0c12" rx="1" stroke="#181a20" strokeWidth="0.3" />
                {/* LEDs — multiple colors */}
                {Array.from({length: Math.max(2, 4 - i)}).map((_, k) => {
                  const colors = ['#22c55e', '#22c55e', '#3b82f6', '#ef4444', '#eab308', '#22c55e'];
                  const ledColor = colors[(j + k + i) % 6];
                  return (
                    <circle key={`ll-${i}-${j}-${k}`} cx={x + w - 8 - k * (4 - i * 0.5)} cy={uy + uh / 2} r={1.5 - i * 0.2} fill={ledColor} opacity={0.3 + (j * 3 + k * 7) % 4 * 0.1}>
                      {(j + k) % 3 === 0 && <animate attributeName="opacity" values={`${0.2};${0.5};${0.2}`} dur={`${0.5 + k * 0.3}s`} repeatCount="indefinite" />}
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </g>
      );
    })}

    {/* ═══ RIGHT RACK ROW ═══ */}
    {[0, 1, 2, 3, 4].map(i => {
      const x = 690 - i * 42;
      const w = 80 - i * 10;
      const y1 = 30 + i * 20;
      const h = 320 - i * 40;
      return (
        <g key={`rr-${i}`}>
          <rect x={x} y={y1} width={w} height={h} fill="url(#pas-rack)" stroke="#222630" strokeWidth={1 - i * 0.1} rx="1" />
          {Array.from({length: Math.max(3, 8 - i)}).map((_, j) => {
            const uy = y1 + 8 + j * (h / (9 - i));
            const uh = h / (11 - i);
            return (
              <g key={`ru-${i}-${j}`}>
                <rect x={x + 4} y={uy} width={w - 8} height={uh} fill="#0a0c12" rx="1" stroke="#181a20" strokeWidth="0.3" />
                {Array.from({length: Math.max(2, 4 - i)}).map((_, k) => {
                  const colors = ['#22c55e', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#22c55e'];
                  const ledColor = colors[(j + k + i + 2) % 6];
                  return (
                    <circle key={`rl-${i}-${j}-${k}`} cx={x + 8 + k * (4 - i * 0.5)} cy={uy + uh / 2} r={1.5 - i * 0.2} fill={ledColor} opacity={0.3 + (j * 5 + k * 3) % 4 * 0.1}>
                      {(j + k + 1) % 3 === 0 && <animate attributeName="opacity" values={`${0.15};${0.45};${0.15}`} dur={`${0.4 + k * 0.2}s`} repeatCount="indefinite" />}
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </g>
      );
    })}

    {/* ═══ BACK RACK (vanishing point) ═══ */}
    <rect x="310" y="140" width="180" height="200" fill="#0e1018" stroke="#1e2028" strokeWidth="1" rx="1" />
    {Array.from({length: 6}).map((_, j) => (
      <g key={`br-${j}`}>
        <rect x="320" y={150 + j * 30} width="160" height="22" fill="#080a10" rx="1" stroke="#14161c" strokeWidth="0.3" />
        {Array.from({length: 6}).map((_, k) => (
          <circle key={`bl-${j}-${k}`} cx={330 + k * 26} cy={161 + j * 30} r="1.2" fill={['#3b82f6','#22c55e','#22c55e','#eab308','#22c55e','#ef4444'][k]} opacity={0.25 + (j * k) % 3 * 0.08} />
        ))}
      </g>
    ))}

    {/* ═══ CABLE BUNDLES ═══ */}
    {/* Blue cables from back rack to floor */}
    <path d="M380,340 Q370,300 360,260 Q355,240 365,200 Q375,170 380,150" fill="none" stroke="#3b82f6" strokeWidth="3" opacity="0.2" strokeLinecap="round" />
    <path d="M385,340 Q380,310 375,270 Q372,250 378,210 Q385,175 390,155" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.15" strokeLinecap="round" />
    <path d="M420,340 Q425,300 430,260 Q432,230 425,190 Q420,170 418,155" fill="none" stroke="#eab308" strokeWidth="2.5" opacity="0.12" strokeLinecap="round" />
    {/* Cables on floor */}
    <path d="M340,400 Q380,395 420,400 Q460,405 500,398" fill="none" stroke="#3b82f6" strokeWidth="2.5" opacity="0.12" />
    <path d="M320,420 Q370,415 430,422" fill="none" stroke="#eab308" strokeWidth="2" opacity="0.08" />

    {/* Ambient blue tint */}
    <rect x="0" y="0" width="800" height="520" fill="#3b82f6" opacity="0.008" pointerEvents="none" />
  </>
);

const pasilloObjectPositions = {
  servidor: { x: 34, y: 38, w: 72, h: 150 },
  terminal: { x: 310, y: 360, w: 80, h: 55 },
  postit: { x: 395, y: 380, w: 40, h: 25 },
  carpeta: { x: 450, y: 370, w: 50, h: 20 },
  monitor: { x: 310, y: 140, w: 180, h: 50 },
  fakes: {
    rack2: { x: 694, y: 38, w: 72, h: 150 },
    rack3: { x: 72, y: 58, w: 62, h: 120 },
    rack4: { x: 632, y: 58, w: 62, h: 120 },
    cables: { x: 360, y: 260, w: 60, h: 80 },
    floorCable: { x: 320, y: 395, w: 180, h: 30 },
    backRack: { x: 320, y: 200, w: 160, h: 130 },
    ceilLight: { x: 280, y: 50, w: 240, h: 20 },
    floorTile: { x: 350, y: 340, w: 100, h: 30 },
  }
};

// ═══════════════════════════════════════════════════════════════════════
// TEMA 2 — SALA DE SERVIDORES (vista amplia con filas)
// Ya existe en EscapeRoomStation.jsx, solo exportamos positions
// ═══════════════════════════════════════════════════════════════════════
const salaObjectPositions = {
  servidor: { x: 43, y: 53, w: 92, h: 334 },
  terminal: { x: 543, y: 243, w: 80, h: 75 },
  postit: { x: 550, y: 315, w: 58, h: 35 },
  carpeta: { x: 265, y: 286, w: 65, h: 25 },
  monitor: { x: 260, y: 215, w: 280, h: 100 },
  fakes: {
    rack5: { x: 630, y: 70, w: 72, h: 310 },
    rack6: { x: 718, y: 70, w: 72, h: 310 },
    chair: { x: 398, y: 370, w: 44, h: 30 },
    extinguisher: { x: 614, y: 278, w: 16, h: 37 },
    door: { x: 770, y: 90, w: 25, h: 280 },
    floorTile: { x: 350, y: 395, w: 48, h: 24 },
    cableTray: { x: 50, y: 32, w: 700, h: 6 },
    rack2: { x: 140, y: 55, w: 90, h: 330 },
  }
};

// ═══════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════
export const datacenterThemes = [
  {
    id: 'pasillo',
    name: 'Pasillo de Racks',
    Background: PasilloBackground,
    positions: pasilloObjectPositions
  },
  {
    id: 'sala',
    name: 'Sala de Servidores',
    Background: null, // usa el SVG existente en EscapeRoomStation
    positions: salaObjectPositions
  }
];

export default datacenterThemes;