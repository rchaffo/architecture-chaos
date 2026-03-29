// EscapeRoomStation.jsx — Analista Escape Room
// Architecture Chaos — Fase 2
// Requiere: React, Zustand (gameStore), Socket.io (socketSingleton)
// Estilo: Tailwind + zinc-950 dark theme

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── ESCAPE ROOM DATA ────────────────────────────────────────────────
const MAPS = {
  datacenter: {
    id: 'datacenter',
    name: 'Datacenter Bancario',
    subtitle: 'Nivel B2 — Acceso Restringido',
    ambiance: 'Luces de emergencia. Humo saliendo del rack 7. El aire acondicionado falló hace 2 horas.',
    objects: [
      {
        id: 'servidor-humeante',
        label: 'Servidor Humeante',
        icon: '🔥',
        x: 15, y: 25, w: 18, h: 30,
        description: 'Rack 7 — Servidor Legacy',
        detail: 'Logs muestran procesos COBOL ejecutándose sobre SOAP wrappers. El protocolo de comunicación con el core falla intermitentemente. Último reinicio exitoso: hace 47 días.',
        bianClue: {
          isBianRelevant: true,
          clueText: 'El servidor legacy usa COBOL/SOAP — el Service Domain afectado opera con Functional Pattern OPERATE. La integración legacy es la causa raíz.',
          clueTag: 'LEGACY_INTEGRATION',
          serviceDomain: 'System Administration'
        }
      },
      {
        id: 'computadora-bloqueada',
        label: 'Terminal Bloqueada',
        icon: '🖥️',
        x: 55, y: 20, w: 15, h: 22,
        description: 'Terminal de administración — BLOQUEADA',
        detail: 'Pantalla muestra: "ACCESO DENEGADO — Ingrese clave de 4 dígitos". Pista: la clave está en algún lugar de esta sala.',
        bianClue: null,
        requiresCode: true,
        code: '2497',
        unlockedDetail: 'Terminal desbloqueada. Logs del sistema muestran que el Service Domain de Payment Execution procesó 0 transacciones en las últimas 3 horas. Cola de transacciones pendientes: 1,247.',
        unlockedBianClue: {
          isBianRelevant: true,
          clueText: 'Payment Execution lleva 3 horas sin procesar. 1,247 transacciones en cola. Functional Pattern: TRANSACT.',
          clueTag: 'PAYMENT_BLOCKED',
          serviceDomain: 'Payment Execution'
        }
      },
      {
        id: 'postit-teclado',
        label: 'Post-it bajo el teclado',
        icon: '📝',
        x: 60, y: 45, w: 10, h: 8,
        description: 'Nota adhesiva medio despegada',
        detail: 'Escrito a mano con marcador: "pwd: _ 4 _ 7" y debajo "2 _ 9 _". La clave completa sería: 2497.',
        bianClue: null
      },
      {
        id: 'carpeta-escritorio',
        label: 'Carpeta de Arquitectura',
        icon: '📁',
        x: 72, y: 55, w: 12, h: 14,
        description: 'Carpeta manila: "ARQUITECTURA — CONFIDENCIAL"',
        detail: 'Diagrama de arquitectura del sistema de pagos. Un componente está tachado con marcador rojo y dice "DEPRECADO — migrar Q3". El componente tachado conectaba el core COBOL con el API Gateway moderno.',
        bianClue: {
          isBianRelevant: true,
          clueText: 'El componente de integración legacy-moderno fue deprecado sin reemplazo. La arquitectura necesita un Service Domain de mediación entre el core y los canales.',
          clueTag: 'ARCHITECTURE_GAP',
          serviceDomain: 'Integration Gateway'
        }
      },
      {
        id: 'log-errores',
        label: 'Pantalla de Monitoreo',
        icon: '📊',
        x: 35, y: 15, w: 16, h: 25,
        description: 'Monitor de 42" — Dashboard de errores en tiempo real',
        detail: 'ERROR RATE: 98.7% | LATENCY: 14,200ms | UPTIME: 12.3%\nÚltimos errores:\n[CRITICAL] Payment Execution — Gateway Timeout\n[CRITICAL] Transaction Authorization — Connection Refused\n[WARNING] Compliance Reporting — Queue Full (847 items)\n[ERROR] Current Account — Read Timeout',
        bianClue: {
          isBianRelevant: true,
          clueText: 'Múltiples Service Domains afectados en cascada: Payment Execution (timeout), Transaction Authorization (conexión rechazada), Current Account (timeout de lectura). El fallo es sistémico.',
          clueTag: 'CASCADE_FAILURE',
          serviceDomain: 'Multiple — Cascade'
        }
      }
    ]
  },
  sala_reuniones: {
    id: 'sala_reuniones',
    name: 'Sala de Reuniones Ejecutiva',
    subtitle: 'Piso 18 — Dirección General',
    ambiance: 'La sala huele a café frío. Alguien salió apurado y dejó todo abierto.',
    objects: [
      {
        id: 'proyector',
        label: 'Proyector Encendido',
        icon: '📽️',
        x: 10, y: 12, w: 25, h: 30,
        description: 'Presentación abierta en la última slide',
        detail: 'Slide final: "IMPACTO FINANCIERO DEL INCIDENTE"\n• Pérdida estimada por hora: USD $45,000\n• Transacciones no procesadas: 1,247\n• Clientes afectados: 3,200\n• Multa regulatoria potencial: USD $2.1M\n• Reputación: NPS cayó 15 puntos',
        bianClue: {
          isBianRelevant: true,
          clueText: 'Impacto financiero: USD $45K/hora, 3,200 clientes afectados, multa potencial de $2.1M. La prioridad de resolución es CRÍTICA.',
          clueTag: 'FINANCIAL_IMPACT',
          serviceDomain: 'Financial Analysis'
        }
      },
      {
        id: 'archivos-confidenciales',
        label: 'Archivos Confidenciales',
        icon: '🔒',
        x: 70, y: 10, w: 14, h: 20,
        description: 'Carpeta roja: "SLA & PRESUPUESTO — USO INTERNO"',
        detail: 'Contrato de SLA:\n• Disponibilidad comprometida: 99.95%\n• Latencia máxima: 200ms\n• Tiempo de respuesta a incidentes P1: 15 minutos\n• Presupuesto anual de TI: USD $3.2M\n• Penalidad por incumplimiento SLA: 5% del contrato mensual',
        bianClue: {
          isBianRelevant: true,
          clueText: 'SLA comprometido: 99.95% disponibilidad, 200ms latencia máxima. Actualmente en 12.3% uptime y 14,200ms. Incumplimiento masivo con penalidades contractuales.',
          clueTag: 'SLA_BREACH',
          serviceDomain: 'Service Level Agreement'
        }
      },
      {
        id: 'foto-organigrama',
        label: 'Organigrama Enmarcado',
        icon: '👥',
        x: 40, y: 5, w: 20, h: 18,
        description: 'Organigrama del banco en la pared',
        detail: 'CEO: Martín Delgado\n↳ CTO: (VACANTE desde hace 2 meses)\n  ↳ Dir. Infraestructura: Ana López\n  ↳ Dir. Desarrollo: Roberto Sánchez (de licencia)\n↳ CFO: Patricia Ramos\n↳ CCO: Eduardo Paredes\n\nNota al margen: "¿Quién aprueba el cambio de arquitectura sin CTO?"',
        bianClue: {
          isBianRelevant: true,
          clueText: 'El banco no tiene CTO desde hace 2 meses y el Dir. de Desarrollo está de licencia. Nadie autoriza cambios de arquitectura — esto explica el componente deprecado sin reemplazo.',
          clueTag: 'GOVERNANCE_GAP',
          serviceDomain: 'Corporate Governance'
        }
      },
      {
        id: 'telefono-mensajes',
        label: 'Teléfono con Mensajes',
        icon: '📱',
        x: 60, y: 50, w: 10, h: 15,
        description: 'Teléfono de escritorio — buzón lleno',
        detail: 'Mensaje 1: "Soy Ricardo Mendoza. Tercer día que llamo. Si no me devuelven la llamada, cambio de proveedor."\nMensaje 2: "Habla Carmen Herrera de Riesgos. Necesito el RCA antes del jueves. Es para la SBS."\nMensaje 3: "Fernando Castillo. La app sigue caída. Los socios me van a crucificar en la asamblea."',
        bianClue: {
          isBianRelevant: true,
          clueText: 'Tres clientes diferentes afectados simultáneamente: Pagos (Mendoza), Core/Riesgo (Herrera), App/Canales (Castillo). El incidente impacta múltiples capas del landscape BIAN.',
          clueTag: 'MULTI_CLIENT_IMPACT',
          serviceDomain: 'Customer Relationship Management'
        }
      },
      {
        id: 'caja-fuerte',
        label: 'Caja Fuerte Entreabierta',
        icon: '🗄️',
        x: 80, y: 40, w: 12, h: 20,
        description: 'Caja fuerte abierta — alguien olvidó cerrarla',
        detail: 'Dentro hay un USB etiquetado: "CONTRATO MAESTRO — BANCO CONTINENTAL"\nEl contrato especifica:\n• Alcance: Transformación digital core bancario\n• Fase 1: Migración COBOL → microservicios (completada parcialmente)\n• Fase 2: API Gateway + nuevos canales (NO iniciada)\n• Deadline original: Q2 2025 (vencido)\n• El banco pagó el 60% por adelantado',
        bianClue: {
          isBianRelevant: true,
          clueText: 'El proyecto de transformación está atrasado. Fase 1 incompleta dejó el componente de integración roto. Fase 2 nunca inició. El banco ya pagó 60% — máxima presión financiera y contractual.',
          clueTag: 'PROJECT_CONTEXT',
          serviceDomain: 'Project Management'
        }
      }
    ]
  }
};

// ─── CINEMATIC HIT AREA HELPER ────────────────────────────────────────
const HitArea = ({ id, x, y, w, h, discoveredIds, activeObjectId, onObjectClick }) => {
  const isDiscovered = discoveredIds.includes(id);
  const isActive = activeObjectId === id;
  return (
    <g onClick={() => onObjectClick(id)} className="cursor-pointer">
      <rect x={x} y={y} width={w} height={h} fill="transparent" />
      {!isDiscovered && (
        <rect x={x-2} y={y-2} width={w+4} height={h+4} rx="4" fill="#f59e0b" opacity="0.05">
          <animate attributeName="opacity" values="0.03;0.1;0.03" dur="2.8s" repeatCount="indefinite" />
        </rect>
      )}
      {isActive && (
        <rect x={x-3} y={y-3} width={w+6} height={h+6} rx="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.85">
          <animate attributeName="stroke-dashoffset" values="0;16" dur="1.2s" repeatCount="indefinite" />
        </rect>
      )}
      {isDiscovered && <rect x={x} y={y} width={w} height={h} rx="3" fill="#09090b" opacity="0.35" />}
    </g>
  );
};

// ─── SVG DATACENTER ILLUSTRATION — CINEMATIC ─────────────────────────
const DatacenterSVG = ({ objects, discoveredIds, onObjectClick, activeObjectId }) => (
  <svg viewBox="0 0 800 520" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.12))' }}>
    <defs>
      <linearGradient id="dc-bg" x1="0" y1="0" x2="0.1" y2="1">
        <stop offset="0%" stopColor="#110f0d" />
        <stop offset="100%" stopColor="#080706" />
      </linearGradient>
      <linearGradient id="dc-ceiling" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0a0908" />
        <stop offset="100%" stopColor="#131110" />
      </linearGradient>
      <linearGradient id="rack-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2a2a2e" />
        <stop offset="40%" stopColor="#1e1e22" />
        <stop offset="100%" stopColor="#141416" />
      </linearGradient>
      <linearGradient id="rack-side" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#18181c" />
        <stop offset="100%" stopColor="#222226" />
      </linearGradient>
      <linearGradient id="hot-glow" cx="30%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="desk-dc" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0%" stopColor="#2a2520" />
        <stop offset="100%" stopColor="#1e1a16" />
      </linearGradient>
      <filter id="dc-smoke">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3">
          <animate attributeName="seed" values="3;8;3" dur="5s" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" scale="6" />
      </filter>
      <filter id="dc-glow-r">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <pattern id="raised-floor" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse" patternTransform="skewY(-2) scale(1.1, 0.5)">
        <rect width="50" height="50" fill="#131214" />
        <rect x="1" y="1" width="48" height="48" fill="#16161a" />
        <line x1="0" y1="0" x2="50" y2="0" stroke="#1e1e22" strokeWidth="0.5" />
        <line x1="0" y1="0" x2="0" y2="50" stroke="#1e1e22" strokeWidth="0.5" />
      </pattern>
      <pattern id="dc-vent" x="0" y="0" width="6" height="3" patternUnits="userSpaceOnUse">
        <rect width="6" height="3" fill="#111114" />
        <rect y="1" width="6" height="1" fill="#1a1a1e" />
      </pattern>
    </defs>

    {/* ═══ ROOM STRUCTURE ═══ */}
    <rect width="800" height="520" fill="url(#dc-bg)" />

    {/* Ceiling */}
    <rect x="0" y="0" width="800" height="35" fill="url(#dc-ceiling)" />
    {/* Ceiling tiles */}
    {Array.from({length: 8}).map((_, i) => (
      <rect key={`ct-${i}`} x={i*100+2} y="2" width="96" height="30" fill="#0e0e10" stroke="#1a1a1e" strokeWidth="0.3" rx="1" />
    ))}

    {/* Emergency light strips on ceiling */}
    {[0, 1].map(row => (
      <g key={`strip-${row}`}>
        <rect x="15" y={8 + row*15} width="770" height="2" fill="#ef4444" opacity="0.04">
          <animate attributeName="opacity" values="0.03;0.12;0.03" dur={1.8 + row*0.4 + 's'} repeatCount="indefinite" />
        </rect>
      </g>
    ))}

    {/* Ceiling-mounted cable trays */}
    <rect x="50" y="32" width="700" height="6" fill="#1a1a1e" stroke="#222226" strokeWidth="0.5" />
    {Array.from({length: 15}).map((_, i) => (
      <line key={`ctray-${i}`} x1={80+i*45} y1="32" x2={80+i*45} y2="38" stroke="#27272c" strokeWidth="1.5" />
    ))}
    {/* Cables hanging from tray */}
    <path d="M80,38 Q85,55 90,70" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.3" />
    <path d="M80,38 Q90,58 88,75" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.25" />
    <path d="M170,38 Q175,50 172,65" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.2" />
    <path d="M400,38 Q398,55 405,72" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.2" />

    {/* Raised floor */}
    <rect x="0" y="380" width="800" height="140" fill="url(#raised-floor)" />
    {/* Floor shadow from above */}
    <rect x="0" y="378" width="800" height="15" fill="url(#dc-bg)" opacity="0.7" />

    {/* Floor cables — thick bundles running between racks */}
    <path d="M60,410 C150,405 180,425 280,415 C380,405 420,430 520,420 C620,410 680,425 740,418" fill="none" stroke="#eab308" strokeWidth="4" opacity="0.25" strokeLinecap="round" />
    <path d="M60,412 C150,407 180,427 280,417" fill="none" stroke="#eab308" strokeWidth="2" opacity="0.15" strokeLinecap="round" />
    <path d="M100,430 C200,425 300,440 400,432 C500,424 550,438 650,430" fill="none" stroke="#3b82f6" strokeWidth="3" opacity="0.2" strokeLinecap="round" />
    <path d="M200,445 C280,440 350,450 450,442" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.12" strokeLinecap="round" />
    {/* Lifted floor tile revealing underfloor */}
    <g transform="translate(350, 395)">
      <rect x="0" y="0" width="48" height="24" fill="#0a0a0c" stroke="#1e1e22" strokeWidth="0.5" />
      <rect x="2" y="-4" width="46" height="5" fill="#1e1e22" stroke="#27272c" strokeWidth="0.5" transform="rotate(-5, 25, -1)" />
      {/* Cables visible below */}
      <path d="M5,5 Q15,12 25,8 Q35,4 45,10" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.4" />
      <path d="M8,12 Q20,18 35,14" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.3" />
    </g>

    {/* ═══ SERVER RACKS — Detailed ═══ */}
    {/* Rack Row 1 (left — includes SMOKING SERVER) */}
    {[45, 140].map((rx, rackIdx) => (
      <g key={`rk1-${rackIdx}`}>
        {/* Rack shadow */}
        <rect x={rx+5} y="385" width="78" height="12" fill="#000" opacity="0.3" rx="2" />
        {/* Rack body */}
        <rect x={rx} y="55" width="82" height="330" fill="url(#rack-body)" rx="2" stroke="#2a2a2e" strokeWidth="1" />
        {/* Rack side depth */}
        <rect x={rx+82} y="57" width="8" height="326" fill="url(#rack-side)" />
        {/* Ventilation top */}
        <rect x={rx+3} y="58" width="76" height="12" fill="url(#dc-vent)" rx="1" />
        {/* Server units */}
        {Array.from({length: 7}).map((_, j) => (
          <g key={`u1-${rackIdx}-${j}`}>
            {/* Unit chassis */}
            <rect x={rx+6} y={78+j*40} width="70" height="32" fill="#0a0a0e" rx="2" stroke="#1e1e22" strokeWidth="0.5" />
            {/* Face detail — drive bays */}
            {Array.from({length: 4}).map((_, d) => (
              <rect key={`db-${d}`} x={rx+10+d*16} y={82+j*40} width="12" height="24" fill="#08080c" rx="1" stroke="#1a1a1e" strokeWidth="0.3" />
            ))}
            {/* Status LEDs */}
            <circle cx={rx+72} cy={88+j*40} r="2.5" fill={rackIdx===0 && j===2 ? '#ef4444' : '#22c55e'} opacity="0.7">
              {rackIdx===0 && j===2 && <animate attributeName="opacity" values="0.8;0.15;0.8" dur="0.6s" repeatCount="indefinite" />}
            </circle>
            <circle cx={rx+72} cy={96+j*40} r="1.5" fill="#3b82f6" opacity="0.3" />
            {/* Activity LED */}
            <circle cx={rx+72} cy={102+j*40} r="1.5" fill={rackIdx===0 && j<4 ? '#ef4444' : '#22c55e'} opacity="0.2">
              <animate attributeName="opacity" values="0.1;0.5;0.1" dur={0.3+j*0.1+'s'} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
        {/* Rack label */}
        <rect x={rx+25} y="370" width="32" height="10" fill="#1a1a1e" rx="1" />
        <text x={rx+41} y="378" textAnchor="middle" fill="#52525b" fontSize="5" fontFamily="monospace">RK-{rackIdx+1}</text>
      </g>
    ))}

    {/* ═══ SMOKING SERVER — Rack 1 click area ═══ */}
    <g onClick={() => onObjectClick('servidor-humeante')} className="cursor-pointer">
      {/* Fire glow on the rack */}
      <rect x="48" y="150" width="76" height="40" fill="#ef4444" opacity="0.06" rx="2">
        <animate attributeName="opacity" values="0.04;0.12;0.04;0.08;0.04" dur="1.8s" repeatCount="indefinite" />
      </rect>
      {/* Smoke columns rising */}
      <ellipse cx="75" cy="40" rx="35" ry="20" fill="#78716c" opacity="0.08" filter="url(#dc-smoke)">
        <animate attributeName="ry" values="18;30;18" dur="4s" repeatCount="indefinite" />
        <animate attributeName="cy" values="42;30;42" dur="4s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="95" cy="32" rx="25" ry="18" fill="#a8a29e" opacity="0.05" filter="url(#dc-smoke)">
        <animate attributeName="cy" values="34;18;34" dur="5s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="80" cy="50" rx="20" ry="12" fill="#57534e" opacity="0.06" filter="url(#dc-smoke)">
        <animate attributeName="ry" values="10;18;10" dur="3s" repeatCount="indefinite" />
      </ellipse>
      {/* Orange ember glow at base of smoke */}
      <ellipse cx="82" cy="58" rx="15" ry="4" fill="#f97316" opacity="0.08">
        <animate attributeName="opacity" values="0.05;0.15;0.05" dur="2s" repeatCount="indefinite" />
      </ellipse>
    </g>
    <HitArea id="servidor-humeante" x={43} y={53} w={92} h={334} discoveredIds={discoveredIds} activeObjectId={activeObjectId} onObjectClick={onObjectClick} />

    {/* ═══ CENTER AISLE with workstation ═══ */}
    {/* Workstation desk */}
    <polygon points="260,310 560,310 575,325 245,325" fill="url(#desk-dc)" stroke="#2a2520" strokeWidth="0.5" />
    <rect x="245" y="325" width="330" height="50" fill="#1e1a16" stroke="#2a2520" strokeWidth="0.5" />
    {/* Desk legs */}
    <rect x="252" y="375" width="6" height="10" fill="#1a1610" />
    <rect x="562" y="375" width="6" height="10" fill="#1a1610" />

    {/* ═══ MONITORING SCREENS (clickeable) ═══ */}
    <g onClick={() => onObjectClick('log-errores')} className="cursor-pointer">
      {/* Large center monitor */}
      <rect x="320" y="215" width="160" height="95" fill="#111116" rx="4" stroke="#27272c" strokeWidth="1.5" />
      <rect x="325" y="220" width="150" height="82" fill="#0a0f18" rx="2" />
      {/* Screen glow */}
      <rect x="325" y="220" width="150" height="82" fill="#ef4444" opacity="0.02" rx="2" />
      {/* Header bar */}
      <rect x="326" y="221" width="148" height="10" fill="#1a1420" rx="1" />
      <text x="400" y="229" textAnchor="middle" fill="#ef4444" fontSize="5" fontFamily="monospace" fontWeight="bold">⚠ MONITORING — CRITICAL ALERTS</text>
      {/* Error entries */}
      <text x="332" y="244" fill="#ef4444" fontSize="5.5" fontFamily="monospace">ERROR RATE ████████████ 98.7%</text>
      <text x="332" y="254" fill="#ef4444" fontSize="5" fontFamily="monospace">[CRIT] Payment Execution — Timeout</text>
      <text x="332" y="263" fill="#f59e0b" fontSize="5" fontFamily="monospace">[WARN] Compliance Queue — 847 items</text>
      <text x="332" y="272" fill="#ef4444" fontSize="5" fontFamily="monospace">[CRIT] Transaction Auth — Refused</text>
      <text x="332" y="281" fill="#ef4444" fontSize="5" fontFamily="monospace">[ERR]  Current Account — Timeout</text>
      {/* Blinking cursor */}
      <rect x="332" y="288" width="4" height="7" fill="#ef4444" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0;0.6" dur="1s" repeatCount="indefinite" />
      </rect>
      {/* Progress bar */}
      <rect x="326" y="296" width="148" height="3" fill="#1a0505" rx="1" />
      <rect x="326" y="296" width="145" height="3" fill="#ef4444" opacity="0.4" rx="1">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
      </rect>
      {/* Monitor stand */}
      <rect x="390" y="310" width="20" height="6" fill="#222226" />
      {/* Side monitor left */}
      <rect x="265" y="230" width="48" height="72" fill="#111116" rx="3" stroke="#222226" strokeWidth="0.8" transform="rotate(8, 289, 266)" />
      <rect x="268" y="233" width="42" height="64" fill="#0a1018" rx="1.5" transform="rotate(8, 289, 266)" />
      <text x="289" y="258" textAnchor="middle" fill="#22c55e" fontSize="4" fontFamily="monospace" transform="rotate(8, 289, 266)">UPTIME</text>
      <text x="289" y="272" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="bold" transform="rotate(8, 289, 266)">12.3%</text>
      {/* Side monitor right */}
      <rect x="487" y="230" width="48" height="72" fill="#111116" rx="3" stroke="#222226" strokeWidth="0.8" transform="rotate(-8, 511, 266)" />
      <rect x="490" y="233" width="42" height="64" fill="#0a1018" rx="1.5" transform="rotate(-8, 511, 266)" />
      <text x="511" y="258" textAnchor="middle" fill="#f59e0b" fontSize="4" fontFamily="monospace" transform="rotate(-8, 511, 266)">LATENCY</text>
      <text x="511" y="272" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold" transform="rotate(-8, 511, 266)">14.2s</text>
    </g>
    <HitArea id="log-errores" x={260} y={215} w={280} h={100} discoveredIds={discoveredIds} activeObjectId={activeObjectId} onObjectClick={onObjectClick} />

    {/* ═══ TERMINAL BLOQUEADA (clickeable) ═══ */}
    <g onClick={() => onObjectClick('computadora-bloqueada')} className="cursor-pointer">
      {/* Terminal on desk right side */}
      <rect x="545" y="245" width="72" height="55" fill="#111116" rx="3" stroke="#222226" strokeWidth="1" />
      <rect x="549" y="249" width="64" height="44" fill="#0c0810" rx="2" />
      {/* Lock screen */}
      <rect x="560" y="260" width="14" height="16" fill="none" stroke="#ef4444" strokeWidth="1" rx="2" opacity="0.7" />
      <circle cx="567" cy="266" r="3" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.7" />
      <line x1="567" y1="269" x2="567" y2="273" stroke="#ef4444" strokeWidth="1" opacity="0.7" />
      <text x="581" y="267" textAnchor="middle" fill="#ef4444" fontSize="4" fontFamily="monospace">ACCESO</text>
      <text x="581" y="274" textAnchor="middle" fill="#ef4444" fontSize="4" fontFamily="monospace">DENEGADO</text>
      <text x="581" y="285" textAnchor="middle" fill="#3f3f46" fontSize="5" fontFamily="monospace">_ _ _ _</text>
      {/* Keyboard below */}
      <rect x="548" y="305" width="65" height="10" fill="#141418" rx="1.5" stroke="#1e1e22" strokeWidth="0.3" />
      {Array.from({length: 8}).map((_, i) => (
        <rect key={`tk-${i}`} x={551+i*7.5} y={307} width="5.5" height="5" fill="#1a1a1e" rx="0.5" />
      ))}
    </g>
    <HitArea id="computadora-bloqueada" x={543} y={243} w={80} h={75} discoveredIds={discoveredIds} activeObjectId={activeObjectId} onObjectClick={onObjectClick} />

    {/* ═══ POST-IT BAJO TECLADO (clickeable) ═══ */}
    <g onClick={() => onObjectClick('postit-teclado')} className="cursor-pointer">
      <rect x="555" y="318" width="48" height="28" fill="#fbbf24" opacity={discoveredIds.includes('postit-teclado') ? 0.25 : 0.75} rx="1" transform="rotate(-4, 579, 332)" />
      <text x="561" y="330" fill="#1a1710" fontSize="5" fontFamily="monospace" transform="rotate(-4, 579, 332)">pwd:</text>
      <text x="561" y="340" fill="#1a1710" fontSize="7.5" fontFamily="monospace" fontWeight="bold" transform="rotate(-4, 579, 332)">_ 4 _ 7</text>
    </g>
    <HitArea id="postit-teclado" x={550} y={315} w={58} h={35} discoveredIds={discoveredIds} activeObjectId={activeObjectId} onObjectClick={onObjectClick} />

    {/* ═══ CARPETA DE ARQUITECTURA (clickeable) ═══ */}
    <g onClick={() => onObjectClick('carpeta-escritorio')} className="cursor-pointer">
      {/* Folder on desk */}
      <rect x="270" y="296" width="55" height="12" fill="#92400e" opacity={discoveredIds.includes('carpeta-escritorio') ? 0.35 : 0.7} rx="1" transform="rotate(3, 297, 302)" />
      <rect x="272" y="294" width="50" height="12" fill="#b45309" opacity="0.5" rx="1" transform="rotate(3, 297, 300)" />
      {/* Tab */}
      <rect x="275" y="290" width="22" height="6" fill="#b45309" opacity="0.6" rx="1" transform="rotate(3, 286, 293)" />
      {/* Label */}
      <text x="297" y="304" textAnchor="middle" fill="#fbbf24" fontSize="3.5" fontFamily="monospace" opacity="0.7" transform="rotate(3, 297, 304)">ARQUITECTURA</text>
      {/* Red stamp */}
      <rect x="310" y="296" width="12" height="6" fill="none" stroke="#ef4444" strokeWidth="0.5" opacity="0.5" transform="rotate(3, 316, 299)" rx="1" />
      <text x="316" y="301" textAnchor="middle" fill="#ef4444" fontSize="3" fontFamily="monospace" opacity="0.5" transform="rotate(3, 316, 299)">CONF</text>
    </g>
    <HitArea id="carpeta-escritorio" x={265} y={286} w={65} h={25} discoveredIds={discoveredIds} activeObjectId={activeObjectId} onObjectClick={onObjectClick} />

    {/* ═══ RIGHT SIDE RACKS ═══ */}
    {[630, 718].map((rx, rackIdx) => (
      <g key={`rk-r-${rackIdx}`} opacity={0.55 + rackIdx * 0.1}>
        <rect x={rx} y="70" width="72" height="310" fill="url(#rack-body)" rx="2" stroke="#2a2a2e" strokeWidth="0.5" />
        {Array.from({length: 7}).map((_, j) => (
          <g key={`ru-r-${rackIdx}-${j}`}>
            <rect x={rx+5} y={83+j*40} width="62" height="32" fill="#0a0a0e" rx="1.5" stroke="#1a1a1e" strokeWidth="0.3" />
            <circle cx={rx+62} cy={95+j*40} r="2" fill="#22c55e" opacity="0.35" />
            <circle cx={rx+62} cy={103+j*40} r="1.2" fill="#3b82f6" opacity="0.15">
              <animate attributeName="opacity" values="0.1;0.35;0.1" dur={0.4+j*0.15+'s'} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
        <text x={rx+36} y="392" textAnchor="middle" fill="#3f3f46" fontSize="4.5" fontFamily="monospace">RK-{rackIdx+5}</text>
      </g>
    ))}

    {/* ═══ ENVIRONMENT DETAILS ═══ */}
    {/* Fire extinguisher on wall */}
    <g transform="translate(620, 280)">
      <rect x="-4" y="-2" width="8" height="3" fill="#ef4444" opacity="0.6" rx="1" />
      <rect x="-6" y="0" width="12" height="35" fill="#dc2626" opacity="0.5" rx="3" />
      <rect x="-3" y="-5" width="6" height="5" fill="#27272a" rx="1" />
      <text x="0" y="22" textAnchor="middle" fill="#fca5a5" fontSize="4" fontFamily="monospace" opacity="0.4">🔥</text>
    </g>

    {/* Door on right wall */}
    <rect x="770" y="90" width="25" height="280" fill="#1a1a1e" rx="2" stroke="#27272c" strokeWidth="1" />
    <circle cx="778" cy="230" r="3" fill="#3f3f46" />
    <text x="782" y="180" textAnchor="middle" fill="#3f3f46" fontSize="4" fontFamily="monospace" transform="rotate(90, 782, 180)">EMERGENCY EXIT</text>

    {/* Rolling chair at desk */}
    <g transform="translate(420, 390)">
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <line key={`dcl-${i}`} x1="0" y1="0" x2={Math.cos(angle*Math.PI/180)*15} y2={Math.sin(angle*Math.PI/180)*5} stroke="#1e1e22" strokeWidth="1.5" />
      ))}
      <rect x="-3" y="-20" width="6" height="20" fill="#1e1e22" />
      <ellipse cx="0" cy="-20" rx="22" ry="7" fill="#1a1a1e" stroke="#222226" strokeWidth="0.5" />
      <rect x="-20" y="-55" width="40" height="36" fill="#1e1e22" rx="5" stroke="#27272c" strokeWidth="0.5" />
    </g>

    {/* ═══ EMERGENCY LIGHTING ═══ */}
    {[130, 350, 570].map((lx, i) => (
      <g key={`elight-${i}`}>
        {/* Light fixture */}
        <rect x={lx-12} y="35" width="24" height="5" fill="#1e1e22" rx="1" />
        {/* Red emergency LED */}
        <circle cx={lx} cy="42" r="4" fill="#ef4444" opacity="0.45">
          <animate attributeName="opacity" values="0.45;0.08;0.45" dur={1.4+i*0.3+'s'} repeatCount="indefinite" />
        </circle>
        {/* Light cone */}
        <polygon points={`${lx},46 ${lx-45},160 ${lx+45},160`} fill="#ef4444" opacity="0.012">
          <animate attributeName="opacity" values="0.01;0.03;0.01" dur={1.4+i*0.3+'s'} repeatCount="indefinite" />
        </polygon>
      </g>
    ))}

    {/* ═══ AMBIENT RED OVERLAY ═══ */}
    <rect x="0" y="0" width="800" height="520" fill="#ef4444" opacity="0.015" />

    {/* Progress */}
    <g transform="translate(620, 460)">
      <text x="0" y="0" fill="#52525b" fontSize="8" fontFamily="monospace" letterSpacing="0.5">OBJETOS: {discoveredIds.filter(id => MAPS.datacenter.objects.find(o => o.id === id)).length}/{MAPS.datacenter.objects.length}</text>
      <rect x="0" y="10" width="140" height="3" fill="#1e1e22" rx="1.5" />
      <rect x="0" y="10" width={140*(discoveredIds.filter(id => MAPS.datacenter.objects.find(o => o.id === id)).length/MAPS.datacenter.objects.length)} height="3" fill="#22c55e" rx="1.5">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.5s" repeatCount="indefinite" />
      </rect>
    </g>
  </svg>
);

// ─── SVG SALA DE REUNIONES — CINEMATIC ───────────────────────────────
const SalaReunionesSVG = ({ objects, discoveredIds, onObjectClick, activeObjectId }) => (
  <svg viewBox="0 0 800 520" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.08))' }}>
    <defs>
      <linearGradient id="sr-bg" x1="0" y1="0" x2="0.15" y2="1">
        <stop offset="0%" stopColor="#14130f" />
        <stop offset="100%" stopColor="#0a0908" />
      </linearGradient>
      <linearGradient id="sr-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1c1b17" />
        <stop offset="100%" stopColor="#141310" />
      </linearGradient>
      <linearGradient id="sr-table" x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0%" stopColor="#3d3428" />
        <stop offset="40%" stopColor="#4a3f30" />
        <stop offset="100%" stopColor="#352e22" />
      </linearGradient>
      <linearGradient id="sr-table-side" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#352e22" />
        <stop offset="100%" stopColor="#231e16" />
      </linearGradient>
      <linearGradient id="sr-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#162240" />
        <stop offset="50%" stopColor="#0d1728" />
        <stop offset="100%" stopColor="#080e1a" />
      </linearGradient>
      <linearGradient id="sr-chair" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#28231e" />
        <stop offset="100%" stopColor="#1a1610" />
      </linearGradient>
      <linearGradient id="sr-projbeam" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
      </linearGradient>
      <pattern id="sr-carpet" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#12110e" />
        <rect x="1" y="1" width="18" height="18" fill="#14130f" />
      </pattern>
      <filter id="sr-glow">
        <feGaussianBlur stdDeviation="3" />
        <feComposite in="SourceGraphic" />
      </filter>
      <pattern id="sr-woodgrain" x="0" y="0" width="200" height="6" patternUnits="userSpaceOnUse">
        <line x1="0" y1="2" x2="200" y2="2.3" stroke="#4a3f30" strokeWidth="0.2" opacity="0.25" />
        <line x1="0" y1="4.5" x2="200" y2="4.2" stroke="#3d3428" strokeWidth="0.15" opacity="0.15" />
      </pattern>
    </defs>

    {/* ═══ ROOM ═══ */}
    <rect width="800" height="520" fill="url(#sr-bg)" />

    {/* Back wall */}
    <rect x="15" y="10" width="770" height="250" fill="url(#sr-wall)" />
    {/* Wall molding */}
    <line x1="18" y1="14" x2="782" y2="14" stroke="#22201a" strokeWidth="1" />
    <rect x="15" y="255" width="770" height="8" fill="#1a1810" />
    <line x1="15" y1="255" x2="785" y2="255" stroke="#27241e" strokeWidth="0.5" />

    {/* Floor - carpet */}
    <rect x="0" y="260" width="800" height="260" fill="url(#sr-carpet)" />

    {/* ═══ PANORAMIC WINDOWS ═══ */}
    <g>
      {/* Window frames */}
      {[25, 195, 365, 535, 625].map((wx, i) => {
        const ww = i < 4 ? 160 : 155;
        return (
          <g key={`win-${i}`}>
            <rect x={wx} y="20" width={ww} height="140" fill="url(#sr-sky)" stroke="#2a2720" strokeWidth="2.5" rx="1" />
            {/* Window divider */}
            <line x1={wx+ww/2} y1="20" x2={wx+ww/2} y2="160" stroke="#2a2720" strokeWidth="2" />
          </g>
        );
      })}
      {/* City skyline across all windows */}
      {Array.from({length: 30}).map((_, i) => {
        const bx = 35 + i * 25 + (i%3)*5;
        const bh = 30 + (i*17)%50 + (i*7)%30;
        const by = 160 - bh;
        return bx < 770 ? (
          <rect key={`sb-${i}`} x={bx} y={by} width={10+(i%4)*6} height={bh} fill="#0b1220" opacity={0.5 + (i%3)*0.15} />
        ) : null;
      })}
      {/* Building windows lit */}
      {Array.from({length: 60}).map((_, i) => {
        const bx = 40 + (i*13)%720;
        const by = 80 + (i*11)%65;
        return by < 155 && bx < 775 ? (
          <rect key={`bwl-${i}`} x={bx} y={by} width="3" height="2" fill="#fbbf24" opacity={0.08 + (i%5)*0.06} rx="0.3" />
        ) : null;
      })}
      {/* Curtain edges */}
      <rect x="18" y="16" width="8" height="148" fill="#1a1810" opacity="0.6" />
      <rect x="774" y="16" width="8" height="148" fill="#1a1810" opacity="0.6" />
    </g>

    {/* ═══ PROJECTOR SCREEN (clickeable) ═══ */}
    <g onClick={() => onObjectClick('proyector')} className="cursor-pointer">
      {/* Screen mount */}
      <rect x="60" y="15" width="4" height="10" fill="#27241e" />
      <rect x="236" y="15" width="4" height="10" fill="#27241e" />
      {/* Screen frame */}
      <rect x="50" y="24" width="200" height="140" fill="#0a0908" rx="2" stroke="#2a2720" strokeWidth="2" />
      <rect x="55" y="29" width="190" height="128" fill="#0c0e18" rx="1" />
      {/* Content — financial dashboard */}
      <rect x="56" y="30" width="188" height="14" fill="#1a0808" rx="1" />
      <text x="150" y="40" textAnchor="middle" fill="#ef4444" fontSize="6" fontFamily="monospace" fontWeight="bold">⚠ IMPACTO FINANCIERO DEL INCIDENTE</text>
      {/* Chart area */}
      <rect x="62" y="50" width="80" height="50" fill="#0a0f18" rx="1" stroke="#1a1e2a" strokeWidth="0.3" />
      {/* Bar chart */}
      {[0,1,2,3,4,5].map((b, i) => (
        <rect key={`pbar-${i}`} x={68+i*12} y={95-[40,35,25,15,8,3][i]} width="8" height={[40,35,25,15,8,3][i]} fill={i<2?'#22c55e':i<4?'#f59e0b':'#ef4444'} opacity="0.6" rx="1" />
      ))}
      <text x="102" y="106" textAnchor="middle" fill="#52525b" fontSize="3.5" fontFamily="monospace">Últimas 6 horas</text>
      {/* Stats panel */}
      <text x="150" y="60" fill="#f59e0b" fontSize="5" fontFamily="monospace">Pérdida/hora:</text>
      <text x="230" y="60" textAnchor="end" fill="#ef4444" fontSize="5.5" fontFamily="monospace" fontWeight="bold">$45,000</text>
      <text x="150" y="72" fill="#94a3b8" fontSize="5" fontFamily="monospace">Tx pendientes:</text>
      <text x="230" y="72" textAnchor="end" fill="#ef4444" fontSize="5.5" fontFamily="monospace">1,247</text>
      <text x="150" y="84" fill="#94a3b8" fontSize="5" fontFamily="monospace">Clientes:</text>
      <text x="230" y="84" textAnchor="end" fill="#f59e0b" fontSize="5.5" fontFamily="monospace">3,200</text>
      <text x="150" y="96" fill="#94a3b8" fontSize="5" fontFamily="monospace">Multa potencial:</text>
      <text x="230" y="96" textAnchor="end" fill="#ef4444" fontSize="6" fontFamily="monospace" fontWeight="bold">$2.1M</text>
      <line x1="150" y1="101" x2="230" y2="101" stroke="#ef4444" strokeWidth="0.3" opacity="0.4" />
      <text x="150" y="110" fill="#94a3b8" fontSize="5" fontFamily="monospace">NPS drop:</text>
      <text x="230" y="110" textAnchor="end" fill="#ef4444" fontSize="5.5" fontFamily="monospace">-15 pts</text>
      {/* Projector beam */}
      <polygon points="150,170 110,30 190,30" fill="url(#sr-projbeam)" />
      {/* Ceiling projector */}
      <rect x="135" y="8" width="30" height="14" fill="#1e1e22" rx="2" stroke="#27272c" strokeWidth="0.5" />
      <circle cx="150" cy="20" r="4" fill="#60a5fa" opacity="0.15" />
    </g>
    <HitArea id="proyector" x={48} y={22} w={206} h={145} discoveredIds={discoveredIds} activeObjectId={activeObjectId} onObjectClick={onObjectClick} />

    {/* ═══ ORGANIGRAMA ON WALL (clickeable) ═══ */}
    <g onClick={() => onObjectClick('foto-organigrama')} className="cursor-pointer">
      {/* Frame */}
      <rect x="350" y="170" width="140" height="80" fill="#14130f" rx="2" stroke="#2a2720" strokeWidth="1.5" />
      <rect x="355" y="175" width="130" height="68" fill="#f5f0e6" opacity="0.06" rx="1" />
      {/* Org boxes */}
      <rect x="398" y="182" width="44" height="12" fill="#1e3a5f" opacity="0.45" rx="1.5" />
      <text x="420" y="191" textAnchor="middle" fill="#60a5fa" fontSize="5" fontFamily="monospace" opacity="0.7">CEO</text>
      <line x1="420" y1="194" x2="420" y2="200" stroke="#3f3f46" strokeWidth="0.6" />
      <line x1="385" y1="200" x2="455" y2="200" stroke="#3f3f46" strokeWidth="0.6" />
      {[385, 408, 431, 454].map((bx, i) => (
        <g key={`org-${i}`}>
          <line x1={bx} y1="200" x2={bx} y2="206" stroke="#3f3f46" strokeWidth="0.5" />
          <rect x={bx-10} y="206" width="20" height="9" fill={i===0?'#7f1d1d':'#1e3a5f'} opacity="0.35" rx="1" />
          <text x={bx} y="213" textAnchor="middle" fill={i===0?'#fca5a5':'#94a3b8'} fontSize="3.5" fontFamily="monospace">{['CTO?','CFO','COO','CCO'][i]}</text>
        </g>
      ))}
      {/* Subordinates */}
      {Array.from({length: 6}).map((_, i) => (
        <rect key={`sub-${i}`} x={370+i*18} y="224" width="14" height="7" fill="#1a1a1e" opacity="0.3" rx="0.5" />
      ))}
      {/* Post-it */}
      <rect x="472" y="174" width="24" height="22" fill="#fbbf24" opacity="0.55" rx="0.5" transform="rotate(6, 484, 185)" />
      <text x="484" y="184" textAnchor="middle" fill="#1a1710" fontSize="3.5" fontFamily="monospace" transform="rotate(6, 484, 185)">¿Quién</text>
      <text x="484" y="190" textAnchor="middle" fill="#92400e" fontSize="3.5" fontFamily="monospace" fontWeight="bold" transform="rotate(6, 484, 185)">aprueba?</text>
    </g>
    <HitArea id="foto-organigrama" x={348} y={168} w={155} h={85} discoveredIds={discoveredIds} activeObjectId={activeObjectId} onObjectClick={onObjectClick} />

    {/* ═══ CONFERENCE TABLE ═══ */}
    <g>
      {/* Table shadow */}
      <ellipse cx="400" cy="400" rx="270" ry="20" fill="#000" opacity="0.25" />
      {/* Table top — perspective */}
      <polygon points="130,340 670,340 700,360 100,360" fill="url(#sr-table)" stroke="#3a352a" strokeWidth="0.8" />
      <polygon points="132,341 668,341 698,359 102,359" fill="url(#sr-woodgrain)" opacity="0.3" />
      {/* Table side */}
      <rect x="100" y="360" width="600" height="30" fill="url(#sr-table-side)" rx="1" />
      <line x1="105" y1="362" x2="695" y2="362" stroke="#3a352a" strokeWidth="0.3" opacity="0.4" />
      {/* Table legs */}
      <rect x="120" y="390" width="8" height="30" fill="#231e16" />
      <rect x="672" y="390" width="8" height="30" fill="#231e16" />
      <rect x="390" y="390" width="8" height="25" fill="#231e16" opacity="0.5" />
    </g>

    {/* ═══ CHAIRS ═══ */}
    {[150, 260, 370, 480, 590].map((cx, i) => (
      <g key={`sch-${i}`} transform={`translate(${cx}, ${i%2===0?405:410})`}>
        {/* Chair shadow */}
        <ellipse cx="0" cy="22" rx="16" ry="4" fill="#000" opacity="0.15" />
        {/* Base */}
        {[0, 72, 144, 216, 288].map((angle, j) => (
          <line key={`scl-${j}`} x1="0" y1="18" x2={Math.cos(angle*Math.PI/180)*12} y2={18+Math.sin(angle*Math.PI/180)*3.5} stroke="#1a1610" strokeWidth="1" />
        ))}
        <rect x="-2" y="2" width="4" height="16" fill="#1a1610" />
        <ellipse cx="0" cy="2" rx="15" ry="5" fill="url(#sr-chair)" stroke="#2a2520" strokeWidth="0.3" />
        <rect x="-14" y="-25" width="28" height="28" fill="url(#sr-chair)" rx="4" stroke="#2a2520" strokeWidth="0.3" />
        {/* Cushion lines */}
        <line x1="-6" y1="-22" x2="-6" y2="0" stroke="#22201a" strokeWidth="0.3" opacity="0.3" />
        <line x1="6" y1="-22" x2="6" y2="0" stroke="#22201a" strokeWidth="0.3" opacity="0.3" />
      </g>
    ))}

    {/* ═══ ITEMS ON TABLE ═══ */}
    {/* Water bottles */}
    <rect x="250" y="340" width="6" height="15" fill="#1e3a5f" opacity="0.4" rx="2" />
    <rect x="260" y="342" width="6" height="13" fill="#1e3a5f" opacity="0.3" rx="2" />
    {/* Papers */}
    <rect x="350" y="336" width="30" height="20" fill="#e8e0d0" opacity="0.08" rx="0.5" transform="rotate(-5, 365, 346)" />
    <rect x="354" y="334" width="30" height="20" fill="#e8e0d0" opacity="0.1" rx="0.5" transform="rotate(2, 369, 344)" />
    {/* Pens */}
    <rect x="390" y="342" width="25" height="2" fill="#1e3a5f" opacity="0.4" rx="1" transform="rotate(12, 402, 343)" />
    {/* Coffee cups */}
    <g transform="translate(520, 348)">
      <ellipse cx="0" cy="0" rx="7" ry="2.5" fill="#1a1710" stroke="#2a2520" strokeWidth="0.3" />
      <rect x="-7" y="-7" width="14" height="7" fill="#1a1710" rx="1" stroke="#2a2520" strokeWidth="0.3" />
      <ellipse cx="0" cy="-7" rx="7" ry="2.5" fill="#251e14" stroke="#2a2520" strokeWidth="0.3" />
      <ellipse cx="0" cy="-7" rx="4.5" ry="1.5" fill="#3d2e1a" opacity="0.5" />
    </g>

    {/* ═══ ARCHIVOS CONFIDENCIALES (clickeable) ═══ */}
    <g onClick={() => onObjectClick('archivos-confidenciales')} className="cursor-pointer">
      {/* Red folder/binder on credenza */}
      <rect x="620" y="205" width="80" height="48" fill="#1a1810" rx="2" stroke="#27241e" strokeWidth="1" />
      <rect x="625" y="200" width="70" height="8" fill="#27241e" rx="1" />
      {/* Files inside */}
      <rect x="628" y="210" width="30" height="38" fill="#7f1d1d" opacity={discoveredIds.includes('archivos-confidenciales')?0.3:0.65} rx="1.5" />
      <rect x="625" y="210" width="30" height="38" fill="#991b1b" opacity={discoveredIds.includes('archivos-confidenciales')?0.25:0.55} rx="1.5" transform="rotate(-3, 640, 229)" />
      <text x="640" y="227" textAnchor="middle" fill="#fca5a5" fontSize="3.5" fontFamily="monospace" opacity="0.6" transform="rotate(-3, 640, 229)">SLA</text>
      <text x="640" y="234" textAnchor="middle" fill="#fca5a5" fontSize="3" fontFamily="monospace" opacity="0.5" transform="rotate(-3, 640, 229)">BUDGET</text>
      {/* Lock icon */}
      <rect x="665" y="220" width="22" height="18" fill="#1a0505" rx="1.5" stroke="#7f1d1d" strokeWidth="0.5" opacity="0.7" />
      <text x="676" y="233" textAnchor="middle" fill="#ef4444" fontSize="5" fontFamily="monospace" opacity="0.5">🔒</text>
    </g>
    <HitArea id="archivos-confidenciales" x={618} y={198} w={85} h={58} discoveredIds={discoveredIds} activeObjectId={activeObjectId} onObjectClick={onObjectClick} />

    {/* ═══ TELÉFONO (clickeable) ═══ */}
    <g onClick={() => onObjectClick('telefono-mensajes')} className="cursor-pointer">
      {/* Conference phone on table */}
      <polygon points="440,340 470,335 500,340 480,348 460,348" fill="#18181b" stroke="#27272c" strokeWidth="0.8" />
      <ellipse cx="470" cy="341" rx="16" ry="4" fill="#111114" stroke="#222226" strokeWidth="0.3" />
      {/* Speaker holes */}
      {Array.from({length: 5}).map((_, i) => (
        <circle key={`ph-${i}`} cx={460+i*5} cy="341" r="1" fill="#0a0a0c" />
      ))}
      {/* LED ring */}
      <ellipse cx="470" cy="341" rx="12" ry="3" fill="none" stroke="#ef4444" strokeWidth="0.5" opacity="0.4">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
      </ellipse>
      {/* Notification badge */}
      <circle cx="492" cy="333" r="5" fill="#ef4444" opacity="0.85">
        <animate attributeName="opacity" values="0.85;0.4;0.85" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <text x="492" y="336" textAnchor="middle" fill="#fff" fontSize="5" fontWeight="bold">3</text>
    </g>
    <HitArea id="telefono-mensajes" x={435} y={328} w={65} h={25} discoveredIds={discoveredIds} activeObjectId={activeObjectId} onObjectClick={onObjectClick} />

    {/* ═══ CAJA FUERTE (clickeable) ═══ */}
    <g onClick={() => onObjectClick('caja-fuerte')} className="cursor-pointer">
      {/* Wall-mounted safe */}
      <rect x="720" y="175" width="55" height="70" fill="#222226" rx="3" stroke="#2a2a2e" strokeWidth="1.5" />
      <rect x="724" y="179" width="47" height="62" fill="#1a1a1e" rx="2" stroke="#27272c" strokeWidth="0.5" />
      {/* Dial */}
      <circle cx="755" cy="210" r="10" fill="#111114" stroke="#3f3f46" strokeWidth="1" />
      <circle cx="755" cy="210" r="7" fill="none" stroke="#52525b" strokeWidth="0.5" />
      <line x1="755" y1="203" x2="755" y2="208" stroke="#a8a29e" strokeWidth="1" strokeLinecap="round" />
      {/* Handle */}
      <rect x="735" y="222" width="18" height="4" fill="#3f3f46" rx="2" />
      {/* Door ajar */}
      <rect x="718" y="181" width="10" height="58" fill="#1e1e22" rx="1.5" stroke="#27272c" strokeWidth="0.5" transform="rotate(-10, 718, 210)" />
      {/* Light coming from inside */}
      <rect x="726" y="185" width="3" height="50" fill="#fbbf24" opacity="0.04">
        <animate attributeName="opacity" values="0.03;0.07;0.03" dur="3s" repeatCount="indefinite" />
      </rect>
      {/* USB visible inside */}
      <rect x="740" y="228" width="12" height="5" fill="#3b82f6" opacity="0.3" rx="1" />
      <text x="746" y="232" textAnchor="middle" fill="#60a5fa" fontSize="3" fontFamily="monospace" opacity="0.4">USB</text>
    </g>
    <HitArea id="caja-fuerte" x={715} y={172} w={62} h={76} discoveredIds={discoveredIds} activeObjectId={activeObjectId} onObjectClick={onObjectClick} />

    {/* ═══ ENVIRONMENT DETAILS ═══ */}
    {/* Whiteboard */}
    <rect x="510" y="170" width="95" height="60" fill="#f5f0e6" opacity="0.05" rx="2" stroke="#27241e" strokeWidth="1" />
    <text x="557" y="195" textAnchor="middle" fill="#3f3f46" fontSize="5" fontFamily="monospace">ACTION ITEMS</text>
    <line x1="520" y1="200" x2="595" y2="200" stroke="#3f3f46" strokeWidth="0.3" opacity="0.3" />
    {[205, 212, 219].map((ly, i) => (
      <line key={`wb-${i}`} x1="520" y1={ly} x2={570-i*10} y2={ly} stroke="#ef4444" strokeWidth="0.3" opacity="0.2" />
    ))}

    {/* Plant in corner */}
    <g transform="translate(30, 300)">
      <rect x="-10" y="10" width="20" height="25" fill="#292218" rx="3" stroke="#3a352a" strokeWidth="0.5" />
      <ellipse cx="0" cy="10" rx="10" ry="4" fill="#1e3314" opacity="0.5" />
      <path d="M0,8 Q-8,-5 -5,-20" fill="none" stroke="#365314" strokeWidth="1.5" />
      <path d="M0,8 Q5,-10 10,-18" fill="none" stroke="#365314" strokeWidth="1.5" />
      <path d="M0,6 Q-3,-12 3,-25" fill="none" stroke="#365314" strokeWidth="1.5" />
      <ellipse cx="-6" cy="-19" rx="6" ry="3.5" fill="#365314" opacity="0.4" transform="rotate(-15, -6, -19)" />
      <ellipse cx="9" cy="-17" rx="5" ry="3" fill="#365314" opacity="0.4" transform="rotate(10, 9, -17)" />
      <ellipse cx="2" cy="-24" rx="6" ry="3" fill="#2d4a15" opacity="0.35" />
    </g>

    {/* Ceiling light panels */}
    {[200, 400, 600].map((lx, i) => (
      <g key={`cpl-${i}`}>
        <rect x={lx-30} y="0" width="60" height="8" fill="#1e1e22" rx="1" stroke="#27272c" strokeWidth="0.3" />
        <rect x={lx-25} y="3" width="50" height="3" fill="#fbbf24" opacity="0.03" />
      </g>
    ))}

    {/* ═══ AMBIENT ═══ */}
    <rect x="0" y="0" width="800" height="520" fill="#3b82f6" opacity="0.008" />

    {/* Progress */}
    <g transform="translate(620, 470)">
      <text x="0" y="0" fill="#52525b" fontSize="8" fontFamily="monospace" letterSpacing="0.5">OBJETOS: {discoveredIds.filter(id => MAPS.sala_reuniones.objects.find(o => o.id === id)).length}/{MAPS.sala_reuniones.objects.length}</text>
      <rect x="0" y="10" width="140" height="3" fill="#1e1e22" rx="1.5" />
      <rect x="0" y="10" width={140*(discoveredIds.filter(id => MAPS.sala_reuniones.objects.find(o => o.id === id)).length/MAPS.sala_reuniones.objects.length)} height="3" fill="#3b82f6" rx="1.5" />
    </g>
  </svg>
);

// ─── OBJECT DETAIL POPUP ─────────────────────────────────────────────
const ObjectPopup = ({ object, onClose, onSendClue, onEnterCode, codeInput, setCodeInput, codeError, isUnlocked }) => {
  const detail = isUnlocked && object.unlockedDetail ? object.unlockedDetail : object.detail;
  const clue = isUnlocked && object.unlockedBianClue ? object.unlockedBianClue : object.bianClue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg mx-4 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden animate-in"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'popIn 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/80 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">{object.icon}</span>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 font-mono">{object.label}</h3>
              <p className="text-xs text-zinc-500 font-mono">{object.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg">✕</button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-line">{detail}</p>

          {/* Code input for locked terminals */}
          {object.requiresCode && !isUnlocked && (
            <div className="mt-3 p-3 bg-zinc-800 rounded border border-zinc-700">
              <p className="text-xs text-zinc-400 font-mono mb-2">Ingrese código de 4 dígitos:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-center text-lg font-mono text-green-400 tracking-[0.5em] focus:outline-none focus:border-green-500"
                  placeholder="____"
                  autoFocus
                />
                <button
                  onClick={onEnterCode}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-mono rounded transition-colors"
                >
                  ENTER
                </button>
              </div>
              {codeError && (
                <p className="text-xs text-red-400 font-mono mt-2 animate-pulse">⚠ CÓDIGO INCORRECTO — Intente de nuevo</p>
              )}
            </div>
          )}

          {/* BIAN Clue button */}
          {clue && clue.isBianRelevant && (
            <div className="mt-3 p-3 bg-emerald-950/50 border border-emerald-800/50 rounded">
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-sm mt-0.5">⚡</span>
                <div className="flex-1">
                  <p className="text-xs text-emerald-300 font-mono font-bold mb-1">PISTA BIAN DETECTADA</p>
                  <p className="text-xs text-emerald-200/80 font-mono leading-relaxed">{clue.clueText}</p>
                  <p className="text-xs text-emerald-500 font-mono mt-1">Service Domain: {clue.serviceDomain}</p>
                </div>
              </div>
              <button
                onClick={() => onSendClue(clue)}
                className="mt-2 w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono rounded transition-all hover:shadow-lg hover:shadow-emerald-900/50 active:scale-95"
              >
                📡 ENVIAR AL BUSCADOR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── CLUE SENT NOTIFICATION ──────────────────────────────────────────
const ClueSentToast = ({ clue, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-emerald-900 border border-emerald-600 rounded-lg px-4 py-3 shadow-xl animate-slide-in max-w-sm"
      style={{ animation: 'slideIn 0.3s ease-out, fadeOut 0.3s ease-in 2.2s' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">📡</span>
        <div>
          <p className="text-xs text-emerald-300 font-mono font-bold">PISTA ENVIADA</p>
          <p className="text-xs text-emerald-200/70 font-mono">{clue.serviceDomain}</p>
        </div>
      </div>
    </div>
  );
};

// ─── RESULTS SCREEN ──────────────────────────────────────────────────
const ResultsScreen = ({ discoveredObjects, sentClues, totalObjects, timeUsed, maxTime, onRestart, onExit }) => {
  const totalClues = MAPS.datacenter.objects.filter(o => o.bianClue?.isBianRelevant || o.unlockedBianClue?.isBianRelevant).length +
    MAPS.sala_reuniones.objects.filter(o => o.bianClue?.isBianRelevant).length;
  const pct = Math.round((sentClues.length / totalClues) * 100);
  const grade = pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
  const gradeColors = { S: 'text-yellow-400', A: 'text-green-400', B: 'text-blue-400', C: 'text-orange-400', D: 'text-red-400' };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-6 bg-zinc-800/50 border-b border-zinc-700 text-center">
          <p className="text-xs text-zinc-500 font-mono mb-1">ESCAPE ROOM — RESULTADOS</p>
          <div className={`text-6xl font-bold font-mono ${gradeColors[grade]}`}>{grade}</div>
          <p className="text-sm text-zinc-400 font-mono mt-2">{pct}% de pistas BIAN encontradas</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-zinc-800/50 rounded p-3">
              <p className="text-2xl font-bold text-zinc-100 font-mono">{discoveredObjects.length}</p>
              <p className="text-xs text-zinc-500 font-mono">Objetos descubiertos</p>
            </div>
            <div className="bg-zinc-800/50 rounded p-3">
              <p className="text-2xl font-bold text-emerald-400 font-mono">{sentClues.length}/{totalClues}</p>
              <p className="text-xs text-zinc-500 font-mono">Pistas BIAN enviadas</p>
            </div>
            <div className="bg-zinc-800/50 rounded p-3">
              <p className="text-2xl font-bold text-zinc-100 font-mono">{Math.floor(timeUsed / 60)}:{String(timeUsed % 60).padStart(2, '0')}</p>
              <p className="text-xs text-zinc-500 font-mono">Tiempo usado</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-mono">PISTAS ENCONTRADAS:</p>
            {sentClues.map((clue, i) => (
              <div key={i} className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-900/30 rounded px-3 py-2">
                <span className="text-green-400 text-xs">✓</span>
                <span className="text-xs text-emerald-200 font-mono flex-1">{clue.clueTag}</span>
                <span className="text-xs text-emerald-500 font-mono">{clue.serviceDomain}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={onRestart} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-mono rounded transition-colors">
              🔄 Reintentar
            </button>
            <button onClick={onExit} className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-mono rounded transition-colors">
              ✓ Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────
export default function EscapeRoomStation({ socket = null, gameStore = null, soloMode = false, onComplete = null }) {
  const [currentMap, setCurrentMap] = useState('datacenter');
  const [discoveredIds, setDiscoveredIds] = useState([]);
  const [sentClues, setSentClues] = useState([]);
  const [activeObject, setActiveObject] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [unlockedTerminals, setUnlockedTerminals] = useState([]);
  const [showToast, setShowToast] = useState(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [gamePhase, setGamePhase] = useState('playing'); // playing | results
  const [totalTimeUsed, setTotalTimeUsed] = useState(0);
  const timerRef = useRef(null);

  // Timer
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGamePhase('results');
          setTotalTimeUsed(180);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gamePhase]);

  const handleObjectClick = useCallback((objectId) => {
    if (gamePhase !== 'playing') return;
    const map = MAPS[currentMap];
    const obj = map.objects.find(o => o.id === objectId);
    if (!obj) return;

    if (!discoveredIds.includes(objectId)) {
      setDiscoveredIds(prev => [...prev, objectId]);
    }
    setActiveObject(obj);
    setCodeInput('');
    setCodeError(false);
  }, [currentMap, discoveredIds, gamePhase]);

  const handleEnterCode = useCallback(() => {
    if (!activeObject?.requiresCode) return;
    if (codeInput === activeObject.code) {
      setUnlockedTerminals(prev => [...prev, activeObject.id]);
      setCodeError(false);
    } else {
      setCodeError(true);
      setCodeInput('');
    }
  }, [activeObject, codeInput]);

  const handleSendClue = useCallback((clue) => {
    if (sentClues.find(c => c.clueTag === clue.clueTag)) return;
    setSentClues(prev => [...prev, clue]);
    setShowToast(clue);
    setActiveObject(null);

    // Emit via Socket.io in team mode
    if (socket && !soloMode) {
      socket.emit('analystClue', {
        clueTag: clue.clueTag,
        clueText: clue.clueText,
        serviceDomain: clue.serviceDomain,
        timestamp: Date.now()
      });
    }
  }, [sentClues, socket, soloMode]);

  const switchMap = useCallback((mapId) => {
    setCurrentMap(mapId);
    setActiveObject(null);
  }, []);

  const handleRestart = useCallback(() => {
    setDiscoveredIds([]);
    setSentClues([]);
    setActiveObject(null);
    setUnlockedTerminals([]);
    setCurrentMap('datacenter');
    setTimeLeft(180);
    setGamePhase('playing');
    setTotalTimeUsed(0);
  }, []);

  const handleExit = useCallback(() => {
    if (onComplete) onComplete({ sentClues, discoveredIds });
  }, [onComplete, sentClues, discoveredIds]);

  // Results screen
  if (gamePhase === 'results') {
    return (
      <ResultsScreen
        discoveredObjects={discoveredIds}
        sentClues={sentClues}
        totalObjects={MAPS.datacenter.objects.length + MAPS.sala_reuniones.objects.length}
        timeUsed={totalTimeUsed || 180 - timeLeft}
        maxTime={180}
        onRestart={handleRestart}
        onExit={handleExit}
      />
    );
  }

  const map = MAPS[currentMap];
  const MapSVG = currentMap === 'datacenter' ? DatacenterSVG : SalaReunionesSVG;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <style>{`
        @keyframes popIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; }
        }
        @keyframes scanline {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-mono font-bold">ESCAPE ROOM</span>
          </div>
          <span className="text-zinc-600 font-mono text-xs">|</span>
          <span className="text-xs text-zinc-400 font-mono">{map.name}</span>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded font-mono text-sm ${timeLeft <= 30 ? 'bg-red-950 text-red-400' : timeLeft <= 60 ? 'bg-orange-950 text-orange-400' : 'bg-zinc-800 text-zinc-300'}`}>
          <span className="text-lg">⏱</span>
          <span className="font-bold tabular-nums">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>

        {/* Sent clues count */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 font-mono">📡 {sentClues.length} pistas enviadas</span>
          <button
            onClick={() => { setTotalTimeUsed(180 - timeLeft); setGamePhase('results'); }}
            className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-mono rounded transition-colors"
          >
            Finalizar
          </button>
        </div>
      </div>

      {/* Map tabs */}
      <div className="flex border-b border-zinc-800">
        {Object.entries(MAPS).map(([key, m]) => (
          <button
            key={key}
            onClick={() => switchMap(key)}
            className={`flex-1 py-2 text-xs font-mono transition-all ${currentMap === key
              ? 'bg-zinc-800 text-zinc-100 border-b-2 border-emerald-500'
              : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Ambiance text */}
      <div className="px-4 py-2 bg-zinc-900/50">
        <p className="text-xs text-zinc-600 font-mono italic">{map.ambiance}</p>
      </div>

      {/* SVG Map */}
      <div className="flex-1 relative bg-zinc-950 overflow-hidden">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-[0.03]">
          <div className="absolute left-0 right-0 h-[2px] bg-emerald-400" style={{ animation: 'scanline 4s linear infinite' }} />
        </div>

        <MapSVG
          objects={map.objects}
          discoveredIds={discoveredIds}
          onObjectClick={handleObjectClick}
          activeObjectId={activeObject?.id}
        />
      </div>

      {/* Bottom clue bar */}
      {sentClues.length > 0 && (
        <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 overflow-x-auto">
          <div className="flex gap-2">
            {sentClues.map((clue, i) => (
              <div key={i} className="flex-shrink-0 px-2 py-1 bg-emerald-950/50 border border-emerald-900/30 rounded text-xs font-mono text-emerald-400">
                {clue.clueTag}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Object Popup */}
      {activeObject && (
        <ObjectPopup
          object={activeObject}
          onClose={() => setActiveObject(null)}
          onSendClue={handleSendClue}
          onEnterCode={handleEnterCode}
          codeInput={codeInput}
          setCodeInput={setCodeInput}
          codeError={codeError}
          isUnlocked={unlockedTerminals.includes(activeObject.id)}
        />
      )}

      {/* Toast */}
      {showToast && <ClueSentToast clue={showToast} onDone={() => setShowToast(null)} />}
    </div>
  );
}
