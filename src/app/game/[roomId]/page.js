// BuscadorStation.jsx — Buscador con Trivia
// Architecture Chaos — Fase 2
// Requiere: React, Zustand (gameStore), Socket.io
// Integra el directorio existente de 18 componentes con mini-quiz de desbloqueo

import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── BIAN COMPONENT DIRECTORY ────────────────────────────────────────
// These mirror the existing DirectoryStation.jsx 18 components
const BIAN_COMPONENTS = [
  { id: 'payment-execution', name: 'Payment Execution', pattern: 'Transact', layer: 'Operations', description: 'Ejecuta transacciones de pago individuales a través de diferentes canales y redes.', keywords: ['pago', 'transacción', 'SWIFT', 'transferencia', 'payment'] },
  { id: 'current-account', name: 'Current Account', pattern: 'Fulfill', layer: 'Operations', description: 'Gestiona el ciclo de vida completo de una cuenta corriente bancaria.', keywords: ['cuenta', 'corriente', 'saldo', 'movimiento', 'account'] },
  { id: 'customer-offer', name: 'Customer Offer', pattern: 'Process', layer: 'Sales & Service', description: 'Orquesta la creación y presentación de ofertas personalizadas al cliente.', keywords: ['oferta', 'producto', 'venta', 'propuesta', 'offer'] },
  { id: 'party-routing-profile', name: 'Party Routing Profile', pattern: 'Manage', layer: 'Reference Data', description: 'Mantiene el perfil de enrutamiento que determina cómo se atiende a cada cliente.', keywords: ['perfil', 'enrutamiento', 'routing', 'cliente', 'segmento'] },
  { id: 'compliance-reporting', name: 'Compliance Reporting', pattern: 'Fulfill', layer: 'Risk & Compliance', description: 'Genera y entrega reportes regulatorios según requerimientos normativos.', keywords: ['compliance', 'regulatorio', 'reporte', 'SBS', 'AML', 'auditoría'] },
  { id: 'transaction-authorization', name: 'Transaction Authorization', pattern: 'Process', layer: 'Operations', description: 'Evalúa y autoriza transacciones según reglas de negocio y límites.', keywords: ['autorización', 'límite', 'regla', 'aprobación', 'authorization'] },
  { id: 'system-administration', name: 'System Administration', pattern: 'Operate', layer: 'Business Support', description: 'Opera y mantiene los sistemas de TI del banco, incluyendo monitoreo y recuperación.', keywords: ['sistema', 'servidor', 'infraestructura', 'monitoreo', 'uptime', 'latencia'] },
  { id: 'channel-activity-management', name: 'Channel Activity Management', pattern: 'Fulfill', layer: 'Sales & Service', description: 'Gestiona las interacciones del cliente a través de diferentes canales digitales y físicos.', keywords: ['canal', 'app', 'móvil', 'digital', 'channel', 'web'] },
  { id: 'product-directory', name: 'Product Directory', pattern: 'Register', layer: 'Reference Data', description: 'Mantiene el catálogo de productos y servicios del banco con sus especificaciones.', keywords: ['catálogo', 'producto', 'directorio', 'API', 'registro'] },
  { id: 'fraud-evaluation', name: 'Fraud Evaluation', pattern: 'Assess', layer: 'Risk & Compliance', description: 'Evalúa transacciones y comportamientos para detectar posible fraude.', keywords: ['fraude', 'sospechoso', 'detección', 'alerta', 'fraud'] },
  { id: 'customer-relationship-management', name: 'Customer Relationship Management', pattern: 'Manage', layer: 'Sales & Service', description: 'Gestiona la relación integral con el cliente a lo largo del ciclo de vida.', keywords: ['relación', 'cliente', 'CRM', 'customer', 'fidelización'] },
  { id: 'credit-risk-models', name: 'Credit Risk Models', pattern: 'Analyze', layer: 'Risk & Compliance', description: 'Desarrolla y mantiene modelos de riesgo crediticio para evaluación de préstamos.', keywords: ['crédito', 'riesgo', 'modelo', 'scoring', 'préstamo'] },
  { id: 'financial-transaction-analysis', name: 'Financial Transaction Analysis', pattern: 'Analyze', layer: 'Risk & Compliance', description: 'Analiza patrones en transacciones financieras para detección de anomalías.', keywords: ['análisis', 'transacción', 'patrón', 'anomalía', 'monitoreo'] },
  { id: 'service-level-agreement', name: 'Service Level Agreement', pattern: 'Manage', layer: 'Business Support', description: 'Gestiona los acuerdos de nivel de servicio con clientes y proveedores.', keywords: ['SLA', 'nivel', 'servicio', 'acuerdo', 'disponibilidad', 'uptime'] },
  { id: 'corporate-governance', name: 'Corporate Governance', pattern: 'Direct', layer: 'Business Direction', description: 'Define la estructura de gobierno corporativo y toma de decisiones estratégicas.', keywords: ['gobierno', 'directorio', 'gobernanza', 'estrategia', 'board'] },
  { id: 'project-management', name: 'Project Management', pattern: 'Process', layer: 'Business Support', description: 'Gestiona proyectos de transformación y cambio organizacional.', keywords: ['proyecto', 'transformación', 'migración', 'implementación', 'deadline'] },
  { id: 'financial-analysis', name: 'Financial Analysis', pattern: 'Analyze', layer: 'Business Support', description: 'Realiza análisis financiero de impacto, rentabilidad y proyecciones.', keywords: ['financiero', 'impacto', 'pérdida', 'costo', 'presupuesto'] },
  { id: 'integration-gateway', name: 'Integration Gateway', pattern: 'Operate', layer: 'Business Support', description: 'Gestiona la integración entre sistemas internos y externos del banco.', keywords: ['integración', 'gateway', 'API', 'legacy', 'middleware', 'COBOL'] }
];

// ─── TRIVIA BANK ─────────────────────────────────────────────────────
const TRIVIA = {
  bian: [
    { q: "¿Qué es un Service Domain en BIAN?", opts: ["Unidad funcional que encapsula una capacidad", "Un servidor físico", "Un departamento", "Una base de datos"], c: 0 },
    { q: "¿Qué Functional Pattern describe gestión continua?", opts: ["Fulfill", "Manage", "Operate", "Transact"], c: 1 },
    { q: "¿Qué es un Control Record?", opts: ["Un log", "Instancia principal de datos del SD", "Control de acceso", "Configuración"], c: 1 },
    { q: "¿Qué es un Behavior Qualifier?", opts: ["KPI del sistema", "Sub-capacidad dentro de un SD", "Test automatizado", "Rol de usuario"], c: 1 },
    { q: "¿Qué patrón representa una transacción discreta?", opts: ["Process", "Transact", "Fulfill", "Allocate"], c: 1 }
  ],
  bancaria: [
    { q: "¿Qué significa KYC?", opts: ["Key Yield Calculation", "Know Your Customer", "Keep Your Capital", "Knowledge Year Compliance"], c: 1 },
    { q: "¿Qué es el spread bancario?", opts: ["Diferencia entre tasa activa y pasiva", "Horario extendido", "Margen de error", "Cobertura geográfica"], c: 0 },
    { q: "¿Qué protocolo usan los bancos para transferencias internacionales?", opts: ["HTTP", "SWIFT", "SMTP", "FTP"], c: 1 },
    { q: "¿Qué significa AML?", opts: ["Automated ML", "Anti-Money Laundering", "Asset Management", "Approved Maximum Leverage"], c: 1 },
    { q: "¿Qué es un core bancario?", opts: ["La bóveda", "Sistema central de operaciones", "Comité directivo", "Sucursal principal"], c: 1 }
  ],
  cultura: [
    { q: "¿Cuál es la capital de Australia?", opts: ["Sídney", "Melbourne", "Canberra", "Brisbane"], c: 2 },
    { q: "¿Quién pintó 'La noche estrellada'?", opts: ["Monet", "Van Gogh", "Dalí", "Picasso"], c: 1 },
    { q: "¿Cuántos huesos tiene el cuerpo adulto?", opts: ["186", "206", "226", "256"], c: 1 },
    { q: "¿Cuál es el océano más grande?", opts: ["Atlántico", "Índico", "Pacífico", "Ártico"], c: 2 },
    { q: "¿En qué año llegó el hombre a la Luna?", opts: ["1967", "1969", "1971", "1965"], c: 1 }
  ],
  historia: [
    { q: "¿En qué año cayó el Muro de Berlín?", opts: ["1987", "1989", "1991", "1985"], c: 1 },
    { q: "¿Qué civilización construyó Machu Picchu?", opts: ["Maya", "Azteca", "Inca", "Olmeca"], c: 2 },
    { q: "¿Quién descubrió la penicilina?", opts: ["Pasteur", "Fleming", "Koch", "Jenner"], c: 1 },
    { q: "¿En qué año comenzó la Revolución Francesa?", opts: ["1776", "1789", "1799", "1815"], c: 1 },
    { q: "¿Quién fue el primer emperador romano?", opts: ["Julio César", "Augusto", "Nerón", "Calígula"], c: 1 }
  ],
  tecnologia: [
    { q: "¿Qué significa API?", opts: ["Application Programming Interface", "Automated Process Integration", "Advanced Protocol Internet", "Application Process Interchange"], c: 0 },
    { q: "¿Qué es Docker?", opts: ["Un lenguaje", "Plataforma de contenedores", "Un SO", "Una BD"], c: 1 },
    { q: "¿Qué significa REST?", opts: ["Remote Execution Service", "Representational State Transfer", "Reliable Endpoint Service", "Resource Exchange Standard"], c: 1 },
    { q: "¿Cuántos bits tiene un byte?", opts: ["4", "8", "16", "32"], c: 1 },
    { q: "¿Qué es la latencia en redes?", opts: ["Datos transmitidos", "Tiempo de viaje del paquete", "Capacidad del cable", "Usuarios conectados"], c: 1 }
  ],
  geografia: [
    { q: "¿Cuál es el país más grande del mundo?", opts: ["China", "EE.UU.", "Rusia", "Canadá"], c: 2 },
    { q: "¿Cuál es la montaña más alta?", opts: ["K2", "Kilimanjaro", "Everest", "Aconcagua"], c: 2 },
    { q: "¿Cuál es el lago más profundo?", opts: ["Titicaca", "Superior", "Baikal", "Victoria"], c: 2 },
    { q: "¿Cuál es la isla más grande?", opts: ["Madagascar", "Borneo", "Groenlandia", "Nueva Guinea"], c: 2 },
    { q: "¿En qué continente está el Sahara?", opts: ["Asia", "África", "América", "Oceanía"], c: 1 }
  ],
  cine: [
    { q: "¿Quién dirigió 'El Padrino'?", opts: ["Scorsese", "Coppola", "Spielberg", "Kubrick"], c: 1 },
    { q: "¿Cuál fue la primera película de Pixar?", opts: ["Nemo", "Monsters Inc", "Toy Story", "Bichos"], c: 2 },
    { q: "¿En qué saga aparece el DeLorean?", opts: ["Terminator", "Volver al Futuro", "Matrix", "Blade Runner"], c: 1 },
    { q: "¿En qué ciudad vive Batman?", opts: ["Metrópolis", "Star City", "Gotham City", "Central City"], c: 2 },
    { q: "¿En qué año se estrenó Star Wars?", opts: ["1975", "1977", "1979", "1980"], c: 1 }
  ],
  harry_potter: [
    { q: "¿Cuál es el patronus de Harry?", opts: ["Lobo", "Ciervo", "Fénix", "Nutria"], c: 1 },
    { q: "¿Cuántos Horrocruxes creó Voldemort?", opts: ["5", "6", "7", "8"], c: 2 },
    { q: "¿Qué materia enseña Snape inicialmente?", opts: ["Defensa", "Pociones", "Transformaciones", "Herbología"], c: 1 },
    { q: "¿Qué criatura custodia la Cámara de los Secretos?", opts: ["Dragón", "Basilisco", "Acromántula", "Hipogrifo"], c: 1 },
    { q: "¿Cuál es la posición de Harry en Quidditch?", opts: ["Cazador", "Guardián", "Buscador", "Golpeador"], c: 2 }
  ],
  deportes: [
    { q: "¿Qué país ha ganado más Copas del Mundo?", opts: ["Alemania", "Argentina", "Brasil", "Italia"], c: 2 },
    { q: "¿En qué deporte se usa el término 'ace'?", opts: ["Fútbol", "Tenis", "Básquetbol", "Béisbol"], c: 1 },
    { q: "¿Cuántos jugadores tiene un equipo de básquetbol en cancha?", opts: ["4", "5", "6", "7"], c: 1 },
    { q: "¿En qué ciudad se celebraron los primeros Juegos Olímpicos modernos?", opts: ["París", "Londres", "Atenas", "Roma"], c: 2 },
    { q: "¿Qué selección ganó la Copa del Mundo 2022?", opts: ["Francia", "Argentina", "Brasil", "Croacia"], c: 1 }
  ]
};

const CATEGORY_LABELS = {
  bian: { label: 'BIAN v14', icon: '🏦', color: 'text-blue-400' },
  bancaria: { label: 'Banca', icon: '💰', color: 'text-emerald-400' },
  cultura: { label: 'Cultura General', icon: '🌍', color: 'text-purple-400' },
  historia: { label: 'Historia', icon: '📜', color: 'text-amber-400' },
  tecnologia: { label: 'Tecnología', icon: '🔬', color: 'text-cyan-400' },
  geografia: { label: 'Geografía', icon: '🗺️', color: 'text-green-400' },
  cine: { label: 'Cine', icon: '🎬', color: 'text-red-400' },
  harry_potter: { label: 'Harry Potter', icon: '⚡', color: 'text-yellow-400' },
  deportes: { label: 'Deportes', icon: '⚽', color: 'text-lime-400' }
};

const getRandomTrivia = (usedIds = []) => {
  const categories = Object.keys(TRIVIA);
  const cat = categories[Math.floor(Math.random() * categories.length)];
  const questions = TRIVIA[cat];
  const available = questions.filter((_, i) => !usedIds.includes(`${cat}-${i}`));
  const pool = available.length > 0 ? available : questions;
  const idx = questions.indexOf(pool[Math.floor(Math.random() * pool.length)]);
  return { category: cat, question: questions[idx], triviaId: `${cat}-${idx}` };
};

// ─── LAYER COLORS ────────────────────────────────────────────────────
const LAYER_COLORS = {
  'Operations': { bg: 'bg-blue-950/30', border: 'border-blue-800/40', text: 'text-blue-400' },
  'Sales & Service': { bg: 'bg-emerald-950/30', border: 'border-emerald-800/40', text: 'text-emerald-400' },
  'Risk & Compliance': { bg: 'bg-red-950/30', border: 'border-red-800/40', text: 'text-red-400' },
  'Reference Data': { bg: 'bg-purple-950/30', border: 'border-purple-800/40', text: 'text-purple-400' },
  'Business Support': { bg: 'bg-amber-950/30', border: 'border-amber-800/40', text: 'text-amber-400' },
  'Business Direction': { bg: 'bg-cyan-950/30', border: 'border-cyan-800/40', text: 'text-cyan-400' }
};

// ─── TRIVIA MODAL ────────────────────────────────────────────────────
const TriviaModal = ({ trivia, onAnswer, onCancel }) => {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const catInfo = CATEGORY_LABELS[trivia.category];

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    setTimeout(() => {
      onAnswer(idx === trivia.question.c);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden" style={{ animation: 'popIn 0.25s ease-out' }}>
        {/* Category header */}
        <div className="px-4 py-3 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{catInfo.icon}</span>
            <span className={`text-sm font-mono font-bold ${catInfo.color}`}>{catInfo.label}</span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">MINI-QUIZ PARA DESBLOQUEAR</span>
        </div>

        {/* Question */}
        <div className="p-4">
          <p className="text-sm text-zinc-100 font-mono leading-relaxed mb-4">{trivia.question.q}</p>

          <div className="space-y-2">
            {trivia.question.opts.map((opt, i) => {
              let btnClass = 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 hover:border-zinc-600 text-zinc-300';
              if (revealed) {
                if (i === trivia.question.c) btnClass = 'bg-emerald-900/50 border-emerald-600 text-emerald-300';
                else if (i === selected && i !== trivia.question.c) btnClass = 'bg-red-900/50 border-red-600 text-red-300';
                else btnClass = 'bg-zinc-800/50 border-zinc-800 text-zinc-600';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={revealed}
                  className={`w-full text-left px-4 py-3 rounded border transition-all font-mono text-sm ${btnClass} ${!revealed ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span className="text-xs text-zinc-500 mr-2">{String.fromCharCode(65 + i)}</span>
                  {opt}
                  {revealed && i === trivia.question.c && <span className="float-right">✓</span>}
                  {revealed && i === selected && i !== trivia.question.c && <span className="float-right">✗</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cancel */}
        {!revealed && (
          <div className="px-4 pb-4">
            <button onClick={onCancel} className="w-full py-2 text-xs text-zinc-500 font-mono hover:text-zinc-300 transition-colors">
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────
export default function BuscadorStation({
  socket = null,
  gameStore = null,
  soloMode = false,
  initialClues = [],
  onComponentSent = null,
  activeTicket = null,
  components = [],
  roomId = '',
  playerName = '',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [receivedClues, setReceivedClues] = useState(initialClues);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [activeTrivia, setActiveTrivia] = useState(null);
  const [unlockedComponents, setUnlockedComponents] = useState([]);
  const [sentComponents, setSentComponents] = useState([]);
  const [usedTriviaIds, setUsedTriviaIds] = useState([]);
  const [triviaStats, setTriviaStats] = useState({ correct: 0, wrong: 0 });
  const [showCluePanel, setShowCluePanel] = useState(true);

  // ── Señuelos aleatorios — brillan igual que los correctos ──────────────
  // Se regeneran en cada ticket. El Buscador debe usar las pistas del
  // Analista para distinguir correctos de señuelos. Cantidad: 3-5 por ticket.
  const [decoyIds, setDecoyIds] = useState([]);

  useEffect(() => {
    const allIds = BIAN_COMPONENTS.map(c => c.id);
    const correctIds = activeTicket?.slots_solucion
      ?.map(s => s.componente_id).filter(Boolean) ?? [];
    const pool = allIds.filter(id => !correctIds.includes(id));
    const count = 3 + Math.floor(Math.random() * 3);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setDecoyIds(shuffled.slice(0, count));
    setReceivedClues(initialClues);
    setSentComponents([]);
    setUnlockedComponents([]);
  }, [activeTicket?.id]); // eslint-disable-line

  // Listen for clues from Analyst via Socket.io
  useEffect(() => {
    if (!socket || soloMode) return;
    const handleClue = (clue) => {
      setReceivedClues(prev => {
        if (prev.find(c => c.clueTag === clue.clueTag)) return prev;
        return [...prev, clue];
      });
    };
    socket.on('analystClue', handleClue);
    return () => socket.off('analystClue', handleClue);
  }, [socket, soloMode]);

  // Filter components by search
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return BIAN_COMPONENTS;
    const q = searchQuery.toLowerCase();
    return BIAN_COMPONENTS.filter(comp =>
      comp.name.toLowerCase().includes(q) ||
      comp.description.toLowerCase().includes(q) ||
      comp.keywords.some(k => k.toLowerCase().includes(q)) ||
      comp.pattern.toLowerCase().includes(q) ||
      comp.layer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleTryUnlock = useCallback((component) => {
    if (unlockedComponents.includes(component.id)) {
      // Already unlocked — send directly
      handleSendComponent(component);
      return;
    }
    setSelectedComponent(component);
    const trivia = getRandomTrivia(usedTriviaIds);
    setActiveTrivia(trivia);
    setUsedTriviaIds(prev => [...prev, trivia.triviaId]);
  }, [unlockedComponents, usedTriviaIds]);

  const handleTriviaAnswer = useCallback((correct) => {
    setTriviaStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1)
    }));

    if (correct && selectedComponent) {
      setUnlockedComponents(prev => [...prev, selectedComponent.id]);
      // Auto-send after unlock
      setTimeout(() => {
        handleSendComponent(selectedComponent);
        setActiveTrivia(null);
        setSelectedComponent(null);
      }, 500);
    } else {
      setTimeout(() => {
        setActiveTrivia(null);
        setSelectedComponent(null);
      }, 500);
    }
  }, [selectedComponent]);

  const handleSendComponent = useCallback((component) => {
    if (sentComponents.includes(component.id)) return;
    setSentComponents(prev => [...prev, component.id]);

    if (socket && !soloMode) {
      socket.emit('buscadorComponent', {
        componentId: component.id,
        name: component.name,
        pattern: component.pattern,
        layer: component.layer,
        timestamp: Date.now()
      });
    }

    if (onComponentSent) onComponentSent(component);
  }, [sentComponents, socket, soloMode, onComponentSent]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <style>{`
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes unlock { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs text-purple-400 font-mono font-bold">BUSCADOR</span>
          <span className="text-zinc-600 font-mono text-xs">|</span>
          <span className="text-xs text-zinc-400 font-mono">Directorio BIAN v14</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-400 font-mono">✓ {triviaStats.correct}</span>
          <span className="text-xs text-red-400 font-mono">✗ {triviaStats.wrong}</span>
          <span className="text-xs text-zinc-500 font-mono">|</span>
          <span className="text-xs text-blue-400 font-mono">📦 {sentComponents.length} enviados</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Clues panel (left) */}
        {showCluePanel && (
          <div className="w-72 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
            <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono font-bold">📡 PISTAS RECIBIDAS</span>
              <span className="text-xs text-zinc-600 font-mono">{receivedClues.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {receivedClues.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-zinc-600 font-mono">
                    {soloMode ? 'Las pistas del caso aparecerán aquí' : 'Esperando pistas del Analista...'}
                  </p>
                </div>
              ) : (
                receivedClues.map((clue, i) => (
                  <div key={i} className="p-2 bg-emerald-950/20 border border-emerald-900/30 rounded text-xs font-mono" style={{ animation: `slideUp 0.3s ease-out ${i * 0.1}s both` }}>
                    <p className="text-emerald-400 font-bold mb-1">{clue.clueTag}</p>
                    <p className="text-emerald-200/70 leading-relaxed">{clue.clueText}</p>
                    <p className="text-emerald-600 mt-1">SD: {clue.serviceDomain}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Directory (main) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar Service Domain... (nombre, patrón, keywords)"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-600 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowCluePanel(p => !p)}
                className={`px-2 py-1 text-xs font-mono rounded transition-colors ${showCluePanel ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}
              >
                📡 Pistas ({receivedClues.length})
              </button>
              <span className="text-xs text-zinc-600 font-mono">|</span>
              <span className="text-xs text-zinc-500 font-mono">{filteredComponents.length} componentes</span>
            </div>
          </div>

          {/* Component grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredComponents.map((comp) => {
                const layerStyle = LAYER_COLORS[comp.layer] || LAYER_COLORS['Business Support'];
                const isUnlocked = unlockedComponents.includes(comp.id);
                const isSent = sentComponents.includes(comp.id);
                // Un componente brilla si coincide con una pista REAL del Analista
                // O si fue elegido como señuelo aleatorio este ticket.
                // El jugador no sabe cuáles son señuelos — debe usar las pistas para distinguirlos.
                const matchesClue = receivedClues.some(c =>
                  c.serviceDomain?.toLowerCase().includes(comp.name.toLowerCase().split(' ')[0]) ||
                  comp.keywords.some(k => c.clueText?.toLowerCase().includes(k))
                );
                const isDecoy = decoyIds.includes(comp.id);
                const isHighlighted = matchesClue || isDecoy;

                return (
                  <div
                    key={comp.id}
                    className={`relative p-3 rounded-lg border transition-all ${isSent
                      ? 'bg-zinc-800/30 border-zinc-800 opacity-50'
                      : isHighlighted
                        ? `${layerStyle.bg} ${layerStyle.border} border-2 shadow-lg`
                        : `bg-zinc-900 border-zinc-800 hover:border-zinc-600`
                    }`}
                  >
                    {/* Indicador de brillo:
                         - Verde pulsante = coincide con pista del Analista (correcto)
                         - Ámbar pulsante = señuelo aleatorio (puede no ser el correcto)
                         El jugador no ve la diferencia hasta que el Analista da más pistas */}
                    {isHighlighted && !isSent && (
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse ${
                        matchesClue ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                    )}

                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`text-sm font-mono font-bold ${isSent ? 'text-zinc-600' : layerStyle.text}`}>{comp.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-zinc-500 font-mono">{comp.pattern}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-xs text-zinc-600 font-mono">{comp.layer}</span>
                        </div>
                      </div>
                      {isUnlocked && !isSent && (
                        <span className="text-xs text-emerald-500 font-mono" style={{ animation: 'unlock 0.5s ease-out' }}>🔓</span>
                      )}
                      {isSent && <span className="text-xs text-zinc-600 font-mono">✓ Enviado</span>}
                    </div>

                    <p className="text-xs text-zinc-400 font-mono leading-relaxed mb-3">{comp.description}</p>

                    {!isSent && (
                      <button
                        onClick={() => handleTryUnlock(comp)}
                        className={`w-full py-2 text-xs font-mono rounded transition-all ${isUnlocked
                          ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                          : isHighlighted
                            ? 'bg-purple-700 hover:bg-purple-600 text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {isUnlocked ? '📦 Enviar al Integrador' : '🔐 Desbloquear (Trivia)'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Trivia Modal */}
      {activeTrivia && (
        <TriviaModal
          trivia={activeTrivia}
          onAnswer={handleTriviaAnswer}
          onCancel={() => { setActiveTrivia(null); setSelectedComponent(null); }}
        />
      )}
    </div>
  );
}