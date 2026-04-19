// src/components/EscapeRoomStation.jsx
// Rediseño v2 · Analista Escape Room
// Usa ImageBasedDatacenter con imágenes 4K reales + mapa random al iniciar.
// Mantiene toda la lógica de socket (emit 'analystClue'), timer y resultados.

import { useState, useEffect, useCallback, useRef } from 'react';
import ImageBasedDatacenter from './ImageBasedDatacenter';

// ============================================================================
//  PALETA Y ANIMACIONES
// ============================================================================
const C = {
  base: '#0A0E14', surface: '#14181F', raised: '#1C212B',
  border: '#1C212B', borderStrong: '#3A414F',
  text: '#E6E8EC', muted: '#9CA3AF', hint: '#6B7280',
  // Analista: ámbar
  role: '#FBBF24', roleDark: '#412402',
  // Buscador (para el botón "enviar al Buscador")
  buscador: '#34D399', buscadorDark: '#04342C',
  // Estados
  success: '#34D399', danger: '#F87171', info: '#60A5FA',
};

const ANIM = `
@keyframes er-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes er-pop { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
@keyframes er-slidein-right { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
@keyframes er-slideout-right { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(24px); } }
@keyframes er-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.12); opacity: .75; } }
@keyframes er-pulse-ring { 0% { transform: scale(.8); opacity: .7; } 100% { transform: scale(2); opacity: 0; } }
@keyframes er-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(2px); } }
.er-fadein { animation: er-fadein .35s ease-out both; }
.er-pop { animation: er-pop .25s cubic-bezier(.2,.9,.3,1.1) both; }
.er-slidein { animation: er-slidein-right .35s ease-out both; }
.er-slideout { animation: er-slideout-right .35s ease-in both; }
.er-pulse { animation: er-pulse 1.4s ease-in-out infinite; }
.er-pulse-ring { animation: er-pulse-ring 1.8s ease-out infinite; }
.er-shake { animation: er-shake .45s ease-in-out; }
.er-btn { transition: opacity .15s ease, transform .12s ease, background .15s ease, border-color .15s ease; cursor: pointer; }
.er-btn:hover:not(:disabled) { opacity: .92; }
.er-btn:active:not(:disabled) { transform: scale(.98); }
.er-btn:disabled { cursor: not-allowed; opacity: .5; }
.er-tab { transition: color .15s ease, border-color .15s ease; }
`;

// ============================================================================
//  RANDOM — Generadores que cambian cada partida
// ============================================================================

// Genera un código de 4 dígitos distintos (ej "7385", "2946")
function generateRandomCode() {
  const d = () => Math.floor(Math.random() * 10);
  let code = '';
  while (code.length < 4) {
    const digit = String(d());
    if (!code.includes(digit)) code += digit; // evita dígitos repetidos para que se lea bien
  }
  return code;
}

// 4 variantes de incidente — cada partida se elige una random
// Cada variante tiene su propio log, sus 3 SDs correctas, y su pista BIAN resultante
const LOG_VARIANTS = [
  {
    name: 'Payments Outage',
    intro: 'Analiza el log y clickea los 3 Service Domains que están fallando',
    correctAnswers: ['Payment Execution', 'Transaction Authorization', 'Current Account'],
    logLines: [
      { tokens: [{ text: '[02:34] ' }, { text: 'System', isDistractor: true }, { text: ' startup · boot sequence OK' }] },
      { tokens: [{ text: '[08:15] ' }, { text: '[CRITICAL] ', color: 'danger' }, { text: 'Payment Execution', isAnswer: true }, { text: ' — Gateway Timeout' }] },
      { tokens: [{ text: '[08:15] ' }, { text: '[INFO] Memory usage ' }, { text: '87%', isDistractor: true }] },
      { tokens: [{ text: '[08:16] ' }, { text: '[CRITICAL] ', color: 'danger' }, { text: 'Transaction Authorization', isAnswer: true }, { text: ' — Connection Refused' }] },
      { tokens: [{ text: '[08:17] ' }, { text: '[WARNING] ', color: 'warning' }, { text: 'Compliance Queue', isDistractor: true }, { text: ' — 847 items queued' }] },
      { tokens: [{ text: '[08:18] ' }, { text: '[DEBUG] Thread ' }, { text: 'pool', isDistractor: true }, { text: ' active · 127 threads' }] },
      { tokens: [{ text: '[08:19] ' }, { text: '[ERROR] ', color: 'danger' }, { text: 'Current Account', isAnswer: true }, { text: ' — Read Timeout' }] },
      { tokens: [{ text: '[08:19] ' }, { text: '[INFO] Heartbeat ' }, { text: 'check', isDistractor: true }, { text: ' · interval 30s' }] },
    ],
    clue: {
      isBianRelevant: true,
      clueText: 'Múltiples Service Domains afectados en cascada: Payment Execution (timeout), Transaction Authorization (conexión rechazada), Current Account (timeout de lectura). El fallo es sistémico.',
      clueTag: 'CASCADE_FAILURE',
      serviceDomain: 'Multiple · Cascade',
    },
  },
  {
    name: 'Risk & Compliance Blackout',
    intro: 'El regulador exige respuesta. Identifica los 3 Service Domains que fallaron',
    correctAnswers: ['Compliance Reporting', 'Fraud Evaluation', 'Financial Transaction Analysis'],
    logLines: [
      { tokens: [{ text: '[07:02] ' }, { text: '[INFO] Disk ', }, { text: 'rotation', isDistractor: true }, { text: ' completed · 142GB freed' }] },
      { tokens: [{ text: '[07:45] ' }, { text: '[CRITICAL] ', color: 'danger' }, { text: 'Compliance Reporting', isAnswer: true }, { text: ' — SBS submission failed' }] },
      { tokens: [{ text: '[07:46] ' }, { text: '[INFO] ' }, { text: 'SMTP queue', isDistractor: true }, { text: ' · 12 pending' }] },
      { tokens: [{ text: '[07:50] ' }, { text: '[CRITICAL] ', color: 'danger' }, { text: 'Fraud Evaluation', isAnswer: true }, { text: ' — Alert pipeline halted' }] },
      { tokens: [{ text: '[08:01] ' }, { text: '[WARNING] ', color: 'warning' }, { text: 'Backup rotation', isDistractor: true }, { text: ' · skipped window' }] },
      { tokens: [{ text: '[08:12] ' }, { text: '[ERROR] ', color: 'danger' }, { text: 'Financial Transaction Analysis', isAnswer: true }, { text: ' — anomaly engine offline' }] },
      { tokens: [{ text: '[08:15] ' }, { text: '[DEBUG] Network ' }, { text: 'ping', isDistractor: true }, { text: ' · all routes OK' }] },
      { tokens: [{ text: '[08:18] ' }, { text: '[ERROR] AML batch export · 0 records sent' }] },
    ],
    clue: {
      isBianRelevant: true,
      clueText: 'Capa de Risk & Compliance colapsada: no se reporta al regulador, no se procesan alertas de fraude, y el análisis de anomalías está offline. La banca está ciega a fraude y en incumplimiento regulatorio.',
      clueTag: 'RISK_BLACKOUT',
      serviceDomain: 'Multiple · Risk & Compliance',
    },
  },
  {
    name: 'Customer Channel Failure',
    intro: 'Los clientes no pueden operar. Identifica los 3 Service Domains caídos',
    correctAnswers: ['Channel Activity Management', 'Customer Offer', 'Customer Relationship Management'],
    logLines: [
      { tokens: [{ text: '[09:12] ' }, { text: '[INFO] ' }, { text: 'Redis cache', isDistractor: true }, { text: ' warmup complete' }] },
      { tokens: [{ text: '[09:30] ' }, { text: '[CRITICAL] ', color: 'danger' }, { text: 'Channel Activity Management', isAnswer: true }, { text: ' — mobile app offline' }] },
      { tokens: [{ text: '[09:31] ' }, { text: '[DEBUG] ' }, { text: 'JVM heap', isDistractor: true }, { text: ' · 64% utilization' }] },
      { tokens: [{ text: '[09:34] ' }, { text: '[ERROR] ', color: 'danger' }, { text: 'Customer Offer', isAnswer: true }, { text: ' — personalization engine timeout' }] },
      { tokens: [{ text: '[09:40] ' }, { text: '[WARNING] ', color: 'warning' }, { text: 'DNS lookup', isDistractor: true }, { text: ' · secondary resolver slow' }] },
      { tokens: [{ text: '[09:45] ' }, { text: '[CRITICAL] ', color: 'danger' }, { text: 'Customer Relationship Management', isAnswer: true }, { text: ' — CRM disconnected' }] },
      { tokens: [{ text: '[09:47] ' }, { text: '[INFO] ' }, { text: 'Firewall rule', isDistractor: true }, { text: ' · policy reloaded' }] },
      { tokens: [{ text: '[09:50] ' }, { text: '[ERROR] 3,200 active sessions dropped' }] },
    ],
    clue: {
      isBianRelevant: true,
      clueText: 'Customer journey roto en 3 puntos: canales digitales caídos, motor de ofertas sin respuesta y CRM desconectado. Los clientes no pueden operar en ningún canal de atención.',
      clueTag: 'CUSTOMER_JOURNEY_BROKEN',
      serviceDomain: 'Multiple · Sales & Service',
    },
  },
  {
    name: 'Legacy Integration Chaos',
    intro: 'La capa de integración está colapsando. Identifica los 3 Service Domains afectados',
    correctAnswers: ['Integration Gateway', 'System Administration', 'Service Level Agreement'],
    logLines: [
      { tokens: [{ text: '[10:05] ' }, { text: '[INFO] ' }, { text: 'Cron job', isDistractor: true }, { text: ' · nightly ETL started' }] },
      { tokens: [{ text: '[10:18] ' }, { text: '[CRITICAL] ', color: 'danger' }, { text: 'Integration Gateway', isAnswer: true }, { text: ' — SOAP/REST bridge down' }] },
      { tokens: [{ text: '[10:19] ' }, { text: '[DEBUG] ' }, { text: 'CPU idle', isDistractor: true }, { text: ' · 23% avg' }] },
      { tokens: [{ text: '[10:22] ' }, { text: '[ERROR] ', color: 'danger' }, { text: 'System Administration', isAnswer: true }, { text: ' — cluster health unknown' }] },
      { tokens: [{ text: '[10:25] ' }, { text: '[WARNING] ', color: 'warning' }, { text: 'Log rotation', isDistractor: true }, { text: ' · archive slow' }] },
      { tokens: [{ text: '[10:28] ' }, { text: '[CRITICAL] ', color: 'danger' }, { text: 'Service Level Agreement', isAnswer: true }, { text: ' — 99.95% breached' }] },
      { tokens: [{ text: '[10:30] ' }, { text: '[INFO] ' }, { text: 'Router interface', isDistractor: true }, { text: ' · eth0 stable' }] },
      { tokens: [{ text: '[10:32] ' }, { text: '[ERROR] Penalty clause triggered · 5% contract value' }] },
    ],
    clue: {
      isBianRelevant: true,
      clueText: 'La capa de integración y operación colapsó: el gateway legacy-moderno está caído, los sistemas no reportan salud, y ya se gatilló el SLA. Penalidades contractuales activadas.',
      clueTag: 'INTEGRATION_COLLAPSE',
      serviceDomain: 'Multiple · Business Support',
    },
  },
];

// ============================================================================
//  DATA — Objetos con detalles y pistas BIAN
//  (IDs coinciden con los hotspots de ImageBasedDatacenter)
// ============================================================================
const MAPS = {
  datacenter: {
    id: 'datacenter',
    name: 'Datacenter Bancario',
    subtitle: 'Nivel B2 · Acceso Restringido',
    ambiance: 'Luces de emergencia. Humo saliendo del rack 7. El aire acondicionado falló hace 2 horas.',
    objects: [
      {
        id: 'servidor-humeante',
        label: 'Servidor Humeante',
        description: 'Rack 7 — Servidor Legacy',
        detail: 'Logs muestran procesos COBOL ejecutándose sobre SOAP wrappers. El protocolo de comunicación con el core falla intermitentemente. Último reinicio exitoso: hace 47 días.',
        bianClue: {
          isBianRelevant: true,
          clueText: 'El servidor legacy usa COBOL/SOAP — el Service Domain afectado opera con Functional Pattern OPERATE. La integración legacy es la causa raíz.',
          clueTag: 'LEGACY_INTEGRATION',
          serviceDomain: 'System Administration',
        },
      },
      {
        id: 'computadora-bloqueada',
        label: 'Terminal Bloqueada',
        description: 'Terminal de administración · BLOQUEADA',
        detail: 'Pantalla muestra: "ACCESO DENEGADO — Ingrese clave de 4 dígitos".',
        bianClue: null,
        requiresCode: true,
        code: '2497',
        // PUZZLE: los fragmentos del código están repartidos en post-it + carpeta
        codeHint: 'Pista: el post-it debajo del teclado y la carpeta de arquitectura tienen fragmentos distintos del código.',
        unlockedDetail: 'Terminal desbloqueada. Logs del sistema muestran que el Service Domain de Payment Execution procesó 0 transacciones en las últimas 3 horas. Cola de transacciones pendientes: 1,247.',
        unlockedBianClue: {
          isBianRelevant: true,
          clueText: 'Payment Execution lleva 3 horas sin procesar. 1,247 transacciones en cola. Functional Pattern: TRANSACT.',
          clueTag: 'PAYMENT_BLOCKED',
          serviceDomain: 'Payment Execution',
        },
      },
      {
        id: 'postit-teclado',
        label: 'Post-it bajo el teclado',
        description: 'Nota adhesiva medio despegada',
        // DISTRIBUCIÓN DEL CÓDIGO: solo la PRIMERA mitad aquí
        detail: 'Escrito apurado con marcador amarillo:\n\n"pwd: _ 4 _ 7"\n\nLa nota está rota a la mitad. Falta la otra parte del código.',
        bianClue: null,
        // Esta flag le dice al puzzle de código que ya viste este fragmento
        codeFragment: { position: 'primera_mitad', hint: '_ 4 _ 7' },
      },
      {
        id: 'carpeta-escritorio',
        label: 'Carpeta de Arquitectura',
        description: 'Carpeta manila: "ARQUITECTURA · CONFIDENCIAL"',
        // DISTRIBUCIÓN DEL CÓDIGO: la SEGUNDA mitad está al final del detalle
        detail: 'Diagrama de arquitectura del sistema de pagos. Un componente está tachado con marcador rojo y dice "DEPRECADO — migrar Q3". El componente tachado conectaba el core COBOL con el API Gateway moderno.\n\nAl reverso, garabateado con lápiz:\n"...la otra mitad del pwd: 2 _ 9 _"',
        bianClue: {
          isBianRelevant: true,
          clueText: 'El componente de integración legacy-moderno fue deprecado sin reemplazo. La arquitectura necesita un Service Domain de mediación entre el core y los canales.',
          clueTag: 'ARCHITECTURE_GAP',
          serviceDomain: 'Integration Gateway',
        },
        codeFragment: { position: 'segunda_mitad', hint: '2 _ 9 _' },
      },
      {
        id: 'log-errores',
        label: 'Pantalla de Monitoreo',
        description: 'Monitor de 42" · Dashboard de errores en tiempo real',
        detail: 'ERROR RATE: 98.7% | LATENCY: 14,200ms | UPTIME: 12.3%\n\nEl log muestra un flood de errores en tiempo real. Analiza qué Service Domains están fallando.',
        // PUZZLE: analizar el log y clickear los 3 SDs afectados
        puzzle: {
          type: 'log-analysis',
          intro: 'Analiza el log y clickea los 3 Service Domains que están fallando',
          logLines: [
            { type: 'line', tokens: [{ text: '[02:34] ' }, { text: 'System', isDistractor: true }, { text: ' startup · boot sequence OK' }] },
            { type: 'line', tokens: [{ text: '[08:15] ' }, { text: '[CRITICAL] ', color: 'danger' }, { text: 'Payment Execution', isAnswer: true }, { text: ' — Gateway Timeout' }] },
            { type: 'line', tokens: [{ text: '[08:15] ' }, { text: '[INFO] Memory usage ' }, { text: '87%', isDistractor: true }] },
            { type: 'line', tokens: [{ text: '[08:16] ' }, { text: '[CRITICAL] ', color: 'danger' }, { text: 'Transaction Authorization', isAnswer: true }, { text: ' — Connection Refused' }] },
            { type: 'line', tokens: [{ text: '[08:17] ' }, { text: '[WARNING] ', color: 'warning' }, { text: 'Compliance Queue', isDistractor: true }, { text: ' — 847 items queued' }] },
            { type: 'line', tokens: [{ text: '[08:18] ' }, { text: '[DEBUG] Thread ', isDistractor: false }, { text: 'pool', isDistractor: true }, { text: ' active · 127 threads' }] },
            { type: 'line', tokens: [{ text: '[08:19] ' }, { text: '[ERROR] ', color: 'danger' }, { text: 'Current Account', isAnswer: true }, { text: ' — Read Timeout' }] },
            { type: 'line', tokens: [{ text: '[08:19] ' }, { text: '[INFO] Heartbeat ', isDistractor: false }, { text: 'check', isDistractor: true }, { text: ' · interval 30s' }] },
          ],
          correctAnswers: ['Payment Execution', 'Transaction Authorization', 'Current Account'],
        },
        bianClue: {
          isBianRelevant: true,
          clueText: 'Múltiples Service Domains afectados en cascada: Payment Execution (timeout), Transaction Authorization (conexión rechazada), Current Account (timeout de lectura). El fallo es sistémico.',
          clueTag: 'CASCADE_FAILURE',
          serviceDomain: 'Multiple · Cascade',
        },
      },
    ],
  },
  sala_reuniones: {
    id: 'sala_reuniones',
    name: 'Sala Ejecutiva',
    subtitle: 'Piso 18 · Dirección General',
    ambiance: 'La sala huele a café frío. Alguien salió apurado y dejó todo abierto.',
    objects: [
      {
        id: 'proyector',
        label: 'Proyector Encendido',
        description: 'Presentación abierta en la última slide',
        detail: 'Slide final: "IMPACTO FINANCIERO DEL INCIDENTE"\n\n• Pérdida estimada por hora: USD $45,000\n• Transacciones no procesadas: 1,247\n• Clientes afectados: 3,200\n• Multa regulatoria potencial: USD $2.1M\n• Reputación: NPS cayó 15 puntos',
        bianClue: {
          isBianRelevant: true,
          clueText: 'Impacto financiero: USD $45K/hora, 3,200 clientes afectados, multa potencial de $2.1M. La prioridad de resolución es CRÍTICA.',
          clueTag: 'FINANCIAL_IMPACT',
          serviceDomain: 'Financial Analysis',
        },
      },
      {
        id: 'archivos-confidenciales',
        label: 'Archivos Confidenciales',
        description: 'Carpeta roja: "SLA & PRESUPUESTO · USO INTERNO"',
        detail: 'Contrato de SLA:\n\n• Disponibilidad comprometida: 99.95%\n• Latencia máxima: 200ms\n• Tiempo de respuesta a incidentes P1: 15 minutos\n• Presupuesto anual de TI: USD $3.2M\n• Penalidad por incumplimiento SLA: 5% del contrato mensual',
        bianClue: {
          isBianRelevant: true,
          clueText: 'SLA comprometido: 99.95% disponibilidad, 200ms latencia máxima. Actualmente en 12.3% uptime y 14,200ms. Incumplimiento masivo con penalidades contractuales.',
          clueTag: 'SLA_BREACH',
          serviceDomain: 'Service Level Agreement',
        },
      },
      {
        id: 'foto-organigrama',
        label: 'Organigrama Enmarcado',
        description: 'Organigrama del banco en la pared',
        detail: 'CEO: Martín Delgado\n↳ CTO: (VACANTE desde hace 2 meses)\n  ↳ Dir. Infraestructura: Ana López\n  ↳ Dir. Desarrollo: Roberto Sánchez (de licencia)\n↳ CFO: Patricia Ramos\n↳ CCO: Eduardo Paredes\n\nNota al margen: "¿Quién aprueba el cambio de arquitectura sin CTO?"',
        bianClue: {
          isBianRelevant: true,
          clueText: 'El banco no tiene CTO desde hace 2 meses y el Dir. de Desarrollo está de licencia. Nadie autoriza cambios de arquitectura — esto explica el componente deprecado sin reemplazo.',
          clueTag: 'GOVERNANCE_GAP',
          serviceDomain: 'Corporate Governance',
        },
      },
      {
        id: 'telefono-mensajes',
        label: 'Teléfono con Mensajes',
        description: 'Teléfono de escritorio · buzón lleno',
        detail: 'Mensaje 1: "Soy Ricardo Mendoza. Tercer día que llamo. Si no me devuelven la llamada, cambio de proveedor."\n\nMensaje 2: "Habla Carmen Herrera de Riesgos. Necesito el RCA antes del jueves. Es para la SBS."\n\nMensaje 3: "Fernando Castillo. La app sigue caída. Los socios me van a crucificar en la asamblea."',
        // PUZZLE: el teléfono pide un PIN para escuchar los mensajes — se resuelve con una serie/frase
        puzzle: {
          type: 'series-completion',
          intro: 'El teléfono pide un PIN de desbloqueo. Una etiqueta pegada debajo dice:',
          // Se elige una al azar al montarse el popup. Todas tienen respuestas cortas.
          challenges: [
            { prompt: 'Completa la serie: 2, 4, 8, 16, __', answers: ['32'] },
            { prompt: 'Completa la serie: 1, 1, 2, 3, 5, __', answers: ['8'] },
            { prompt: '"A caballo regalado no se le mira el ___"', answers: ['diente', 'diente.'] },
            { prompt: '"Más vale pájaro en mano que cien ___"', answers: ['volando', 'volando.'] },
            { prompt: 'Completa la serie: 3, 6, 9, 12, __', answers: ['15'] },
            { prompt: '"En boca cerrada no entran ___"', answers: ['moscas', 'moscas.'] },
            { prompt: '"No por mucho madrugar ___ más temprano"', answers: ['amanece'] },
            { prompt: 'Completa la serie: A, C, E, G, __', answers: ['I', 'i'] },
          ],
        },
        bianClue: {
          isBianRelevant: true,
          clueText: 'Tres clientes diferentes afectados simultáneamente: Pagos (Mendoza), Core/Riesgo (Herrera), App/Canales (Castillo). El incidente impacta múltiples capas del landscape BIAN.',
          clueTag: 'MULTI_CLIENT_IMPACT',
          serviceDomain: 'Customer Relationship Management',
        },
      },
      {
        id: 'caja-fuerte',
        label: 'Caja Fuerte Entreabierta',
        description: 'Caja fuerte abierta · alguien olvidó cerrarla',
        detail: 'Dentro hay un USB etiquetado: "CONTRATO MAESTRO · BANCO CONTINENTAL"\n\nEl contrato especifica:\n• Alcance: Transformación digital core bancario\n• Fase 1: Migración COBOL → microservicios (completada parcialmente)\n• Fase 2: API Gateway + nuevos canales (NO iniciada)\n• Deadline original: Q2 2025 (vencido)\n• El banco pagó el 60% por adelantado',
        bianClue: {
          isBianRelevant: true,
          clueText: 'El proyecto de transformación está atrasado. Fase 1 incompleta dejó el componente de integración roto. Fase 2 nunca inició. El banco ya pagó 60% — máxima presión financiera y contractual.',
          clueTag: 'PROJECT_CONTEXT',
          serviceDomain: 'Project Management',
        },
      },
    ],
  },
};

const TOTAL_BIAN_CLUES =
  MAPS.datacenter.objects.filter(o => o.bianClue?.isBianRelevant || o.unlockedBianClue?.isBianRelevant).length +
  MAPS.sala_reuniones.objects.filter(o => o.bianClue?.isBianRelevant).length;

// ============================================================================
//  COMPONENTE PRINCIPAL
// ============================================================================
export default function EscapeRoomStation({ socket = null, gameStore = null, soloMode = false, onComplete = null }) {
  // Mapa aleatorio al montar (unas veces datacenter, otras sala ejecutiva)
  const [currentMap, setCurrentMap] = useState(() => (Math.random() < 0.5 ? 'datacenter' : 'sala_reuniones'));
  const [themeKey, setThemeKey] = useState(0); // fuerza que el tema se re-seleccione al cambiar de mapa
  const [discoveredIds, setDiscoveredIds] = useState([]);
  const [sentClues, setSentClues] = useState([]);
  const [activeObject, setActiveObject] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [unlockedTerminals, setUnlockedTerminals] = useState([]);
  const [solvedPuzzles, setSolvedPuzzles] = useState([]); // IDs de objetos cuyos puzzles se resolvieron
  const [toast, setToast] = useState(null);
  // Aleatorización por partida
  const [randomCode, setRandomCode] = useState(() => generateRandomCode());
  const [logVariantIdx, setLogVariantIdx] = useState(() => Math.floor(Math.random() * LOG_VARIANTS.length));
  const [timeLeft, setTimeLeft] = useState(180);
  const [gamePhase, setGamePhase] = useState('playing');
  const [totalTimeUsed, setTotalTimeUsed] = useState(0);
  const timerRef = useRef(null);

  // Timer (mantiene lógica original)
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

  const handleFakeClick = useCallback(() => {
    // El decoy ya muestra su toast dentro de ImageBasedDatacenter — no hacemos nada extra aquí.
  }, []);

  const handleEnterCode = useCallback(() => {
    if (!activeObject?.requiresCode) return;
    if (codeInput === randomCode) {
      setUnlockedTerminals(prev => [...prev, activeObject.id]);
      setCodeError(false);
    } else {
      setCodeError(true);
      setCodeInput('');
    }
  }, [activeObject, codeInput, randomCode]);

  const handleSendClue = useCallback((clue) => {
    if (sentClues.find(c => c.clueTag === clue.clueTag)) return;
    setSentClues(prev => [...prev, clue]);
    setToast({ type: 'clue-sent', serviceDomain: clue.serviceDomain, clueTag: clue.clueTag });
    setActiveObject(null);

    // Emit al Buscador vía socket (CRÍTICO — mantiene compatibilidad con el Buscador)
    if (socket && !soloMode) {
      socket.emit('analystClue', {
        clueTag: clue.clueTag,
        clueText: clue.clueText,
        serviceDomain: clue.serviceDomain,
        timestamp: Date.now(),
      });
    }
  }, [sentClues, socket, soloMode]);

  const switchMap = useCallback((mapId) => {
    setCurrentMap(mapId);
    setThemeKey(k => k + 1); // re-monta ImageBasedDatacenter para que elija variante random
    setActiveObject(null);
  }, []);

  const handleRestart = useCallback(() => {
    setDiscoveredIds([]);
    setSentClues([]);
    setActiveObject(null);
    setUnlockedTerminals([]);
    setSolvedPuzzles([]);
    setCurrentMap(Math.random() < 0.5 ? 'datacenter' : 'sala_reuniones');
    setThemeKey(k => k + 1);
    setTimeLeft(180);
    setGamePhase('playing');
    setTotalTimeUsed(0);
    setRandomCode(generateRandomCode());
    setLogVariantIdx(Math.floor(Math.random() * LOG_VARIANTS.length));
  }, []);

  const handleExit = useCallback(() => {
    if (onComplete) onComplete({ sentClues, discoveredIds });
  }, [onComplete, sentClues, discoveredIds]);

  const finishNow = useCallback(() => {
    setTotalTimeUsed(180 - timeLeft);
    setGamePhase('results');
  }, [timeLeft]);

  // Pantalla de resultados
  if (gamePhase === 'results') {
    return (
      <ResultsScreen
        discoveredObjects={discoveredIds}
        sentClues={sentClues}
        timeUsed={totalTimeUsed || (180 - timeLeft)}
        onRestart={handleRestart}
        onExit={handleExit}
      />
    );
  }

  const map = MAPS[currentMap];
  const discoveredInMap = discoveredIds.filter(id => map.objects.find(o => o.id === id)).length;
  const totalInMap = map.objects.length;

  return (
    <div style={{
      minHeight: '100vh', background: C.base, color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      {/* Header */}
      <Header
        mapName={map.name}
        mapSubtitle={map.subtitle}
        timeLeft={timeLeft}
        sentCount={sentClues.length}
        totalCount={TOTAL_BIAN_CLUES}
        onFinish={finishNow}
      />

      {/* Tabs de mapas */}
      <MapTabs
        current={currentMap}
        onSwitch={switchMap}
        discoveredIds={discoveredIds}
      />

      {/* Ambiance */}
      <div style={{ padding: '10px 20px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
          {map.ambiance}
        </p>
      </div>

      {/* Escena con imagen real */}
      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ImageBasedDatacenter
          key={`${currentMap}-${themeKey}`}
          mapType={currentMap}
          discoveredIds={discoveredIds}
          activeObjectId={activeObject?.id}
          onObjectClick={handleObjectClick}
          onFakeClick={handleFakeClick}
        />
      </div>

      {/* Progreso del mapa actual */}
      <MapProgress discovered={discoveredInMap} total={totalInMap} mapName={map.name} />

      {/* Tira de pistas enviadas */}
      {sentClues.length > 0 && (
        <SentCluesStrip clues={sentClues} />
      )}

      {/* Popup de objeto */}
      {activeObject && (
        <ObjectPopup
          object={activeObject}
          allMapObjects={[...MAPS.datacenter.objects, ...MAPS.sala_reuniones.objects]}
          discoveredIds={discoveredIds}
          isPuzzleSolved={solvedPuzzles.includes(activeObject.id)}
          onSolvePuzzle={() => setSolvedPuzzles(prev => [...prev, activeObject.id])}
          onClose={() => setActiveObject(null)}
          onSendClue={handleSendClue}
          onEnterCode={handleEnterCode}
          codeInput={codeInput}
          setCodeInput={setCodeInput}
          codeError={codeError}
          isUnlocked={unlockedTerminals.includes(activeObject.id)}
          randomCode={randomCode}
          logVariant={LOG_VARIANTS[logVariantIdx]}
          alreadySent={sentClues.some(c => {
            // Usar el clue correcto según el objeto:
            // - log-errores usa el clue del logVariant activo
            // - terminal bloqueada usa unlockedBianClue si está unlocked
            // - resto usa bianClue
            let current;
            if (activeObject.id === 'log-errores') {
              current = LOG_VARIANTS[logVariantIdx].clue;
            } else if (unlockedTerminals.includes(activeObject.id)) {
              current = activeObject.unlockedBianClue;
            } else {
              current = activeObject.bianClue;
            }
            return current && c.clueTag === current.clueTag;
          })}
        />
      )}

      {/* Toast (pista enviada) */}
      {toast && <ClueSentToast data={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ============================================================================
//  HEADER
// ============================================================================
function Header({ mapName, mapSubtitle, timeLeft, sentCount, totalCount, onFinish }) {
  const timerColor = timeLeft <= 30 ? C.danger : timeLeft <= 60 ? C.role : C.text;
  const pulse = timeLeft <= 10 && timeLeft > 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`,
      flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 30, height: 30, background: C.role, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M3 3 L13 3 L13 13 L3 13 Z" stroke={C.roleDark} strokeWidth="1.4" fill="none" />
            <path d="M6 7 L10 7 M6 10 L10 10" stroke={C.roleDark} strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="5" cy="5" r="0.8" fill={C.roleDark} />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>ANALISTA · ESCAPE ROOM</div>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 500, marginTop: 1 }}>
            {mapName} <span style={{ color: C.hint, fontWeight: 400 }}>· {mapSubtitle}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Timer grande */}
        <div className={pulse ? 'er-pulse' : ''} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 8,
          background: `${timerColor}15`, border: `1px solid ${timerColor}55`,
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="9" r="5.5" stroke={timerColor} strokeWidth="1.5" fill="none" />
            <path d="M8 6 L8 9 L10.5 10" stroke={timerColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6 2 L10 2" stroke={timerColor} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 16, fontWeight: 500, color: timerColor, letterSpacing: '0.02em' }}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>

        {/* Contador de pistas */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>PISTAS ENVIADAS</div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, color: C.buscador, fontWeight: 500, marginTop: 1 }}>
            {sentCount} / {totalCount}
          </div>
        </div>

        {/* Botón finalizar */}
        <button onClick={onFinish} className="er-btn" style={{
          background: 'transparent', border: `1px solid ${C.borderStrong}`,
          color: C.muted, padding: '8px 14px', borderRadius: 6,
          fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
        }}>
          Finalizar
        </button>
      </div>
    </div>
  );
}

// ============================================================================
//  TABS DE MAPA
// ============================================================================
function MapTabs({ current, onSwitch, discoveredIds }) {
  return (
    <div style={{ display: 'flex', background: C.base, borderBottom: `1px solid ${C.border}` }}>
      {Object.entries(MAPS).map(([key, m]) => {
        const active = current === key;
        const discoveredInThis = discoveredIds.filter(id => m.objects.find(o => o.id === id)).length;
        return (
          <button
            key={key}
            onClick={() => !active && onSwitch(key)}
            className="er-tab"
            style={{
              flex: 1, padding: '12px 18px',
              background: active ? C.surface : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${active ? C.role : 'transparent'}`,
              color: active ? C.text : C.muted,
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
              cursor: active ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <span>{m.name}</span>
            <span style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 11,
              color: active ? C.muted : C.hint,
              background: active ? C.raised : 'transparent',
              padding: '2px 7px', borderRadius: 10,
            }}>
              {discoveredInThis}/{m.objects.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
//  PROGRESO DEL MAPA
// ============================================================================
function MapProgress({ discovered, total, mapName }) {
  const pct = total ? (discovered / total) * 100 : 0;
  return (
    <div style={{ padding: '10px 20px', background: C.surface, borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.06em', fontWeight: 500, whiteSpace: 'nowrap' }}>
          EXPLORACIÓN
        </span>
        <div style={{ flex: 1, height: 4, background: C.raised, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`, background: C.role,
            transition: 'width .4s ease',
          }} />
        </div>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: C.text, fontWeight: 500 }}>
          {discovered} / {total}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
//  TIRA DE PISTAS ENVIADAS
// ============================================================================
function SentCluesStrip({ clues }) {
  return (
    <div style={{
      padding: '10px 20px', background: C.base,
      borderTop: `1px solid ${C.border}`, overflowX: 'auto',
    }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, whiteSpace: 'nowrap', marginRight: 6 }}>
          ENVIADAS AL BUSCADOR:
        </span>
        {clues.map((clue, i) => (
          <span key={i} style={{
            flexShrink: 0,
            padding: '4px 10px',
            background: `${C.buscador}15`, border: `1px solid ${C.buscador}55`,
            borderRadius: 4, fontSize: 11, fontFamily: 'ui-monospace, monospace',
            color: C.buscador, fontWeight: 500,
          }}>
            {clue.clueTag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
//  POPUP DE OBJETO (con soporte para puzzles)
// ============================================================================
function ObjectPopup({
  object, allMapObjects, discoveredIds, isPuzzleSolved, onSolvePuzzle,
  onClose, onSendClue, onEnterCode, codeInput, setCodeInput, codeError,
  isUnlocked, alreadySent, randomCode, logVariant,
}) {
  // Override del detail según el objeto + aleatorización
  let detail = isUnlocked && object.unlockedDetail ? object.unlockedDetail : object.detail;
  if (object.id === 'postit-teclado' && randomCode) {
    // Posiciones 2 y 4 del código
    detail = `Escrito apurado con marcador amarillo:\n\n"pwd: _ ${randomCode[1]} _ ${randomCode[3]}"\n\nLa nota está rota a la mitad. Falta la otra parte del código.`;
  }
  if (object.id === 'carpeta-escritorio' && randomCode) {
    // Posiciones 1 y 3 del código, agregadas al final del detalle original
    detail = `Diagrama de arquitectura del sistema de pagos. Un componente está tachado con marcador rojo y dice "DEPRECADO — migrar Q3". El componente tachado conectaba el core COBOL con el API Gateway moderno.\n\nAl reverso, garabateado con lápiz:\n"...la otra mitad del pwd: ${randomCode[0]} _ ${randomCode[2]} _"`;
  }

  // La pista correcta para el objeto — para log-errores viene del logVariant activo
  let clue;
  if (object.id === 'log-errores' && logVariant) {
    clue = logVariant.clue;
  } else {
    clue = isUnlocked && object.unlockedBianClue ? object.unlockedBianClue : object.bianClue;
  }

  // ¿Este objeto tiene puzzle y no está resuelto? Entonces mostramos el puzzle primero.
  // Para log-errores, usamos el puzzle del logVariant activo (no el hardcoded)
  let activePuzzle = object.puzzle;
  if (object.id === 'log-errores' && logVariant) {
    activePuzzle = {
      type: 'log-analysis',
      intro: logVariant.intro,
      logLines: logVariant.logLines,
      correctAnswers: logVariant.correctAnswers,
    };
  }
  const hasPendingPuzzle = activePuzzle && !isPuzzleSolved;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="er-pop"
        style={{
          width: '100%', maxWidth: 560,
          background: C.base, border: `1px solid ${C.border}`, borderRadius: 12,
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header del popup */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: C.surface, borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 500, marginBottom: 2 }}>{object.label}</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: 'ui-monospace, monospace' }}>{object.description}</div>
          </div>
          <button onClick={onClose} className="er-btn" style={{
            background: 'transparent', border: 'none', color: C.muted,
            width: 28, height: 28, borderRadius: 4, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Body — puzzle O detalle */}
        <div style={{ padding: '16px 18px', overflowY: 'auto' }}>
          {hasPendingPuzzle ? (
            <PuzzleGate puzzle={activePuzzle} onSolved={onSolvePuzzle} />
          ) : (
            <>
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
                padding: '12px 14px', marginBottom: 14,
                fontSize: 13, color: C.text, lineHeight: 1.6,
                fontFamily: 'ui-monospace, monospace',
                whiteSpace: 'pre-line',
              }}>
                {detail}
              </div>

              {/* Código para terminal bloqueada (con fragmentos descubiertos como hint) */}
              {object.requiresCode && !isUnlocked && (
                <CodeUnlockGate
                  object={object}
                  allMapObjects={allMapObjects}
                  discoveredIds={discoveredIds}
                  codeInput={codeInput}
                  setCodeInput={setCodeInput}
                  codeError={codeError}
                  onEnterCode={onEnterCode}
                  randomCode={randomCode}
                />
              )}

              {/* Pista BIAN */}
              {clue?.isBianRelevant && (
                <div style={{
                  background: `${C.buscador}12`, border: `1px solid ${C.buscador}55`,
                  borderRadius: 8, padding: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.buscador }} />
                    <span style={{ fontSize: 11, color: C.buscador, letterSpacing: '0.08em', fontWeight: 500 }}>
                      PISTA BIAN DETECTADA
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: C.text, lineHeight: 1.55, margin: '0 0 10px' }}>
                    {clue.clueText}
                  </p>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: 'ui-monospace, monospace', marginBottom: 12 }}>
                    Service Domain: <span style={{ color: C.buscador }}>{clue.serviceDomain}</span>
                  </div>
                  <button
                    onClick={() => onSendClue(clue)}
                    disabled={alreadySent}
                    className="er-btn"
                    style={{
                      width: '100%',
                      background: alreadySent ? C.raised : C.buscador,
                      color: alreadySent ? C.muted : C.buscadorDark,
                      border: `1px solid ${alreadySent ? C.borderStrong : C.buscador}`,
                      padding: '10px 14px', borderRadius: 6,
                      fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {alreadySent ? (
                      <>Ya enviada al Buscador</>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8 H11 M8 5 L11 8 L8 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                        Enviar al Buscador
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
//  PUZZLE GATE — router que renderiza el puzzle correcto
// ============================================================================
function PuzzleGate({ puzzle, onSolved }) {
  if (puzzle.type === 'log-analysis') return <LogAnalysisPuzzle puzzle={puzzle} onSolved={onSolved} />;
  if (puzzle.type === 'series-completion') return <SeriesPuzzle puzzle={puzzle} onSolved={onSolved} />;
  return null;
}

// ============================================================================
//  PUZZLE 1: ANALIZAR LOGS
// ============================================================================
function LogAnalysisPuzzle({ puzzle, onSolved }) {
  const [selected, setSelected] = useState([]); // textos clickeados (correctos)
  const [wrongFlash, setWrongFlash] = useState(null); // texto incorrecto que se sacude
  const totalNeeded = puzzle.correctAnswers.length;

  const handleClick = (text, isAnswer) => {
    if (selected.includes(text)) return;
    if (isAnswer) {
      const next = [...selected, text];
      setSelected(next);
      if (next.length >= totalNeeded) {
        setTimeout(() => onSolved(), 600);
      }
    } else {
      setWrongFlash(text);
      setTimeout(() => setWrongFlash(null), 500);
    }
  };

  return (
    <div>
      <div style={{
        background: `${C.role}15`, border: `1px solid ${C.role}55`,
        borderRadius: 6, padding: '10px 12px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, color: C.role, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>
          PUZZLE · ANALIZAR LOG
        </div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
          {puzzle.intro}
        </div>
      </div>

      {/* Log viewer */}
      <div style={{
        background: '#05080C', border: `1px solid ${C.borderStrong}`, borderRadius: 6,
        padding: '12px 14px', marginBottom: 12, maxHeight: 280, overflowY: 'auto',
        fontFamily: 'ui-monospace, "SF Mono", monospace', fontSize: 12, lineHeight: 1.9,
      }}>
        {puzzle.logLines.map((line, li) => (
          <div key={li} style={{ marginBottom: 2 }}>
            {line.tokens.map((tok, ti) => {
              const isClickable = tok.isAnswer || tok.isDistractor;
              const isSelected = selected.includes(tok.text);
              const isWrong = wrongFlash === tok.text;
              let baseColor = '#9CA3AF';
              if (tok.color === 'danger') baseColor = C.danger;
              else if (tok.color === 'warning') baseColor = C.role;

              if (!isClickable) {
                return <span key={ti} style={{ color: baseColor }}>{tok.text}</span>;
              }

              return (
                <span
                  key={ti}
                  onClick={() => handleClick(tok.text, !!tok.isAnswer)}
                  className={isWrong ? 'er-shake' : ''}
                  style={{
                    cursor: isSelected ? 'default' : 'pointer',
                    padding: '1px 5px',
                    margin: '0 1px',
                    borderRadius: 3,
                    background: isSelected ? `${C.success}30` : 'transparent',
                    border: `1px solid ${isSelected ? C.success : isWrong ? C.danger : 'transparent'}`,
                    color: isSelected ? C.success : baseColor,
                    textDecoration: isClickable && !isSelected ? 'underline dotted' : 'none',
                    textDecorationColor: C.muted,
                    textUnderlineOffset: 3,
                    fontWeight: tok.isAnswer || tok.color ? 500 : 400,
                    transition: 'background .15s ease, color .15s ease, border-color .15s ease',
                  }}
                >
                  {tok.text}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* Progreso */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: C.surface, borderRadius: 6,
        border: `1px solid ${C.border}`,
      }}>
        <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.05em' }}>
          Service Domains identificados
        </span>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 500, color: selected.length === totalNeeded ? C.success : C.text }}>
          {selected.length} / {totalNeeded}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
//  PUZZLE 2: COMPLETAR SERIE / FRASE
// ============================================================================
function SeriesPuzzle({ puzzle, onSolved }) {
  const [challenge] = useState(() => {
    const list = puzzle.challenges;
    return list[Math.floor(Math.random() * list.length)];
  });
  const [value, setValue] = useState('');
  const [wrongFlash, setWrongFlash] = useState(false);
  const [correct, setCorrect] = useState(false);

  const normalize = (s) => s.trim().toLowerCase().replace(/[.,!?¿¡]+$/, '');

  const handleSubmit = () => {
    if (correct) return;
    const ok = challenge.answers.some(a => normalize(a) === normalize(value));
    if (ok) {
      setCorrect(true);
      setTimeout(() => onSolved(), 700);
    } else {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 500);
    }
  };

  return (
    <div>
      <div style={{
        background: `${C.role}15`, border: `1px solid ${C.role}55`,
        borderRadius: 6, padding: '10px 12px', marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, color: C.role, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>
          PUZZLE · DESBLOQUEAR TELÉFONO
        </div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
          {puzzle.intro}
        </div>
      </div>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '20px 18px', marginBottom: 14, textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 12 }}>
          ETIQUETA AMARILLA PEGADA DEBAJO DEL TELÉFONO
        </div>
        <div style={{
          fontSize: 16, color: C.text, fontWeight: 500, lineHeight: 1.5,
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
        }}>
          {challenge.prompt}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          disabled={correct}
          autoFocus
          placeholder="Tu respuesta…"
          className={wrongFlash ? 'er-shake' : ''}
          style={{
            flex: 1, background: C.base,
            border: `1px solid ${wrongFlash ? C.danger : correct ? C.success : C.borderStrong}`,
            borderRadius: 6, padding: '10px 14px',
            fontSize: 14, color: correct ? C.success : C.text,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={correct || !value.trim()}
          className="er-btn"
          style={{
            background: correct ? C.success : (value.trim() ? C.role : C.raised),
            color: correct ? C.successDark : (value.trim() ? C.roleDark : C.muted),
            border: `1px solid ${correct ? C.success : (value.trim() ? C.role : C.borderStrong)}`,
            padding: '10px 20px', borderRadius: 6,
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
          }}
        >
          {correct ? '✓' : 'Verificar'}
        </button>
      </div>

      {wrongFlash && (
        <p style={{ color: C.danger, fontSize: 12, marginTop: 8, marginBottom: 0, fontFamily: 'ui-monospace, monospace' }}>
          ⚠ No es correcto · intenta otra vez
        </p>
      )}
    </div>
  );
}

// ============================================================================
//  PUZZLE 3: CÓDIGO EN FRAGMENTOS (para terminal bloqueada)
// ============================================================================
function CodeUnlockGate({ object, allMapObjects, discoveredIds, codeInput, setCodeInput, codeError, onEnterCode, randomCode }) {
  // Calcula los fragmentos dinámicamente desde el randomCode
  // Post-it: posiciones 2 y 4 → "_ d2 _ d4"
  // Carpeta: posiciones 1 y 3 → "d1 _ d3 _"
  const fragmentsByObject = {
    'postit-teclado':     { position: 'primera_mitad', hint: randomCode ? `_ ${randomCode[1]} _ ${randomCode[3]}` : '_ ? _ ?' },
    'carpeta-escritorio': { position: 'segunda_mitad', hint: randomCode ? `${randomCode[0]} _ ${randomCode[2]} _` : '? _ ? _' },
  };

  const fragments = allMapObjects
    .filter(o => fragmentsByObject[o.id])
    .map(o => ({
      ...fragmentsByObject[o.id],
      objectLabel: o.label,
      discovered: discoveredIds.includes(o.id),
    }));

  const allFound = fragments.length > 0 && fragments.every(f => f.discovered);

  return (
    <div style={{
      background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: 14, marginBottom: 14,
    }}>
      <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 12 }}>
        CÓDIGO DE ACCESO · 4 DÍGITOS
      </div>

      {/* Fragmentos */}
      {fragments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {fragments.map((frag, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              padding: '8px 12px', borderRadius: 6,
              background: frag.discovered ? `${C.role}10` : C.surface,
              border: `1px solid ${frag.discovered ? `${C.role}66` : C.border}`,
            }}>
              <span style={{ fontSize: 11, color: frag.discovered ? C.role : C.muted, fontFamily: 'ui-monospace, monospace', flex: 1, minWidth: 0 }}>
                {frag.discovered ? `Fragmento de ${frag.objectLabel}` : 'Fragmento aún no descubierto'}
              </span>
              <span style={{
                fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 500,
                color: frag.discovered ? C.role : C.hint,
                letterSpacing: '0.2em',
              }}>
                {frag.discovered ? frag.hint : '? ? ? ?'}
              </span>
            </div>
          ))}
        </div>
      )}

      {!allFound && fragments.length > 0 && (
        <p style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', margin: '0 0 10px', lineHeight: 1.5 }}>
          💡 Explora más la sala para encontrar todos los fragmentos del código.
        </p>
      )}

      {/* Input del código */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={codeInput}
          onChange={e => setCodeInput(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => { if (e.key === 'Enter') onEnterCode(); }}
          placeholder="_ _ _ _"
          autoFocus
          className={codeError ? 'er-shake' : ''}
          style={{
            flex: 1, background: C.base, border: `1px solid ${codeError ? C.danger : C.borderStrong}`,
            borderRadius: 6, padding: '10px 14px',
            textAlign: 'center', fontSize: 20, fontWeight: 500,
            color: C.role, fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.5em', outline: 'none',
          }}
        />
        <button onClick={onEnterCode} className="er-btn" style={{
          background: C.role, color: C.roleDark,
          border: `1px solid ${C.role}`,
          padding: '10px 20px', borderRadius: 6,
          fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
        }}>
          Entrar
        </button>
      </div>
      {codeError && (
        <p style={{ color: C.danger, fontSize: 12, marginTop: 8, marginBottom: 0, fontFamily: 'ui-monospace, monospace' }}>
          ⚠ Código incorrecto · intenta otra vez
        </p>
      )}
    </div>
  );
}

// ============================================================================
//  TOAST: "Pista enviada"
// ============================================================================
function ClueSentToast({ data, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="er-slidein" style={{
      position: 'fixed', top: 20, right: 20, zIndex: 60,
      background: C.base, border: `1px solid ${C.buscador}66`, borderRadius: 8,
      padding: '12px 16px', minWidth: 260,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', width: 10, height: 10 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.buscador }} />
          <div className="er-pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.buscador }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.buscador, letterSpacing: '0.08em', fontWeight: 500 }}>PISTA ENVIADA</div>
          <div style={{ fontSize: 12, color: C.text, marginTop: 2, fontFamily: 'ui-monospace, monospace' }}>
            {data.clueTag} · {data.serviceDomain}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
//  PANTALLA DE RESULTADOS
// ============================================================================
function ResultsScreen({ discoveredObjects, sentClues, timeUsed, onRestart, onExit }) {
  const pct = TOTAL_BIAN_CLUES > 0 ? Math.round((sentClues.length / TOTAL_BIAN_CLUES) * 100) : 0;
  const grade = pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
  const gradeColor = { S: '#FBBF24', A: C.success, B: C.info, C: '#FB923C', D: C.danger }[grade];

  return (
    <div style={{
      minHeight: '100vh', background: C.base, color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />
      <div className="er-fadein" style={{
        width: '100%', maxWidth: 620,
        background: C.base, border: `1px solid ${C.border}`, borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Hero */}
        <div style={{
          padding: '28px 24px', textAlign: 'center',
          background: C.surface, borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.15em', fontWeight: 500, marginBottom: 12 }}>
            ESCAPE ROOM · RESULTADOS
          </div>
          <div style={{
            fontSize: 72, fontWeight: 500, color: gradeColor, lineHeight: 1,
            fontFamily: 'Georgia, serif',
          }}>
            {grade}
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>
            {pct}% de pistas BIAN encontradas
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
            <Stat label="OBJETOS" value={discoveredObjects.length} />
            <Stat label="PISTAS" value={`${sentClues.length} / ${TOTAL_BIAN_CLUES}`} color={C.buscador} />
            <Stat label="TIEMPO" value={`${Math.floor(timeUsed / 60)}:${String(timeUsed % 60).padStart(2, '0')}`} />
          </div>

          {/* Lista de pistas enviadas */}
          {sentClues.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8 }}>
                PISTAS ENVIADAS AL BUSCADOR
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sentClues.map((clue, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: `${C.buscador}10`, border: `1px solid ${C.buscador}33`,
                    borderRadius: 6,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8 L7 12 L13 5" stroke={C.buscador} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace', color: C.buscador, fontWeight: 500 }}>
                      {clue.clueTag}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted, fontFamily: 'ui-monospace, monospace' }}>
                      {clue.serviceDomain}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onRestart} className="er-btn" style={{
              flex: 1,
              background: 'transparent', border: `1px solid ${C.borderStrong}`,
              color: C.text, padding: '11px 14px', borderRadius: 6,
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            }}>
              Reintentar
            </button>
            <button onClick={onExit} className="er-btn" style={{
              flex: 1,
              background: C.role, color: C.roleDark,
              border: `1px solid ${C.role}`, padding: '11px 14px', borderRadius: 6,
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            }}>
              Continuar →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: '12px 14px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 18, fontWeight: 500, color: color || C.text, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}
