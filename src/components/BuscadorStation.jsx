// src/components/BuscadorStation.jsx
// Rediseño visual v2 · Mantiene toda la lógica de socket y juego intacta.
// Layout: header + pistas (izq, colapsable) + directorio (centro) + modal trivia.

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
//  PALETA Y ANIMACIONES
// ============================================================================
const C = {
  base: '#0A0E14', surface: '#14181F', raised: '#1C212B',
  border: '#1C212B', borderStrong: '#3A414F',
  text: '#E6E8EC', muted: '#9CA3AF', hint: '#6B7280',
  // Buscador: verde esmeralda
  role: '#34D399', roleDark: '#04342C', roleGlow: '#34D39955',
  // Estados
  success: '#34D399', successDark: '#04342C',
  danger: '#F87171', warning: '#FBBF24', info: '#60A5FA',
  decoy: '#FBBF24', // señuelo (ámbar)
};

// Colores por layer BIAN (todos 400-stop para fondo oscuro)
const LAYER_COLORS = {
  'Operations':         { accent: '#60A5FA', tint: '#60A5FA15', border: '#60A5FA45' },
  'Sales & Service':    { accent: '#2DD4BF', tint: '#2DD4BF15', border: '#2DD4BF45' },
  'Risk & Compliance':  { accent: '#F87171', tint: '#F8717115', border: '#F8717145' },
  'Reference Data':     { accent: '#C084FC', tint: '#C084FC15', border: '#C084FC45' },
  'Business Support':   { accent: '#FBBF24', tint: '#FBBF2415', border: '#FBBF2445' },
  'Business Direction': { accent: '#22D3EE', tint: '#22D3EE15', border: '#22D3EE45' },
};

const ANIM = `
@keyframes bu-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bu-slidein-left { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes bu-pop { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
@keyframes bu-pulse-dot { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.35); opacity: .7; } }
@keyframes bu-pulse-ring { 0% { transform: scale(.8); opacity: .7; } 100% { transform: scale(2); opacity: 0; } }
@keyframes bu-unlock { 0% { transform: scale(1); } 40% { transform: scale(1.15); } 100% { transform: scale(1); } }
@keyframes bu-progress { from { width: 100%; } to { width: 0%; } }
@keyframes bu-breath { 0%,100% { opacity: 1; } 50% { opacity: .78; } }
.bu-fadein { animation: bu-fadein .35s ease-out both; }
.bu-slidein-left { animation: bu-slidein-left .35s ease-out both; }
.bu-pop { animation: bu-pop .25s cubic-bezier(.2,.9,.3,1.1) both; }
.bu-pulse-dot { animation: bu-pulse-dot 1.4s ease-in-out infinite; }
.bu-pulse-ring { animation: bu-pulse-ring 1.8s ease-out infinite; }
.bu-unlock { animation: bu-unlock .55s ease-out both; }
.bu-breath { animation: bu-breath 2.2s ease-in-out infinite; }
.bu-card { transition: border-color .15s ease, background .15s ease, transform .12s ease; }
.bu-card:hover:not(.is-sent) { transform: translateY(-1px); }
.bu-btn { transition: opacity .15s ease, transform .12s ease, background .15s ease, border-color .15s ease; cursor: pointer; }
.bu-btn:hover:not(:disabled) { opacity: .92; }
.bu-btn:active:not(:disabled) { transform: scale(.98); }
.bu-btn:disabled { cursor: not-allowed; opacity: .55; }
.bu-input:focus { outline: none; border-color: ${C.role}; }
.bu-clue-scroll::-webkit-scrollbar { width: 6px; }
.bu-clue-scroll::-webkit-scrollbar-thumb { background: ${C.borderStrong}; border-radius: 3px; }
.bu-clue-scroll::-webkit-scrollbar-track { background: transparent; }
`;

// ============================================================================
//  BIAN COMPONENT DIRECTORY (sin cambios — mantiene 18 componentes)
// ============================================================================
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
  { id: 'integration-gateway', name: 'Integration Gateway', pattern: 'Operate', layer: 'Business Support', description: 'Gestiona la integración entre sistemas internos y externos del banco.', keywords: ['integración', 'gateway', 'API', 'legacy', 'middleware', 'COBOL'] },
];

// ============================================================================
//  TRIVIA BANK (sin cambios)
// ============================================================================
const TRIVIA = {
  bian: [
    { q: "¿Qué es un Service Domain en BIAN?", opts: ["Unidad funcional que encapsula una capacidad", "Un servidor físico", "Un departamento", "Una base de datos"], c: 0 },
    { q: "¿Qué Functional Pattern describe gestión continua?", opts: ["Fulfill", "Manage", "Operate", "Transact"], c: 1 },
    { q: "¿Qué es un Control Record?", opts: ["Un log", "Instancia principal de datos del SD", "Control de acceso", "Configuración"], c: 1 },
    { q: "¿Qué es un Behavior Qualifier?", opts: ["KPI del sistema", "Sub-capacidad dentro de un SD", "Test automatizado", "Rol de usuario"], c: 1 },
    { q: "¿Qué patrón representa una transacción discreta?", opts: ["Process", "Transact", "Fulfill", "Allocate"], c: 1 },
  ],
  bancaria: [
    { q: "¿Qué significa KYC?", opts: ["Key Yield Calculation", "Know Your Customer", "Keep Your Capital", "Knowledge Year Compliance"], c: 1 },
    { q: "¿Qué es el spread bancario?", opts: ["Diferencia entre tasa activa y pasiva", "Horario extendido", "Margen de error", "Cobertura geográfica"], c: 0 },
    { q: "¿Qué protocolo usan los bancos para transferencias internacionales?", opts: ["HTTP", "SWIFT", "SMTP", "FTP"], c: 1 },
    { q: "¿Qué significa AML?", opts: ["Automated ML", "Anti-Money Laundering", "Asset Management", "Approved Maximum Leverage"], c: 1 },
    { q: "¿Qué es un core bancario?", opts: ["La bóveda", "Sistema central de operaciones", "Comité directivo", "Sucursal principal"], c: 1 },
  ],
  cultura: [
    { q: "¿Cuál es la capital de Australia?", opts: ["Sídney", "Melbourne", "Canberra", "Brisbane"], c: 2 },
    { q: "¿Quién pintó 'La noche estrellada'?", opts: ["Monet", "Van Gogh", "Dalí", "Picasso"], c: 1 },
    { q: "¿Cuántos huesos tiene el cuerpo adulto?", opts: ["186", "206", "226", "256"], c: 1 },
    { q: "¿Cuál es el océano más grande?", opts: ["Atlántico", "Índico", "Pacífico", "Ártico"], c: 2 },
    { q: "¿En qué año llegó el hombre a la Luna?", opts: ["1967", "1969", "1971", "1965"], c: 1 },
  ],
  historia: [
    { q: "¿En qué año cayó el Muro de Berlín?", opts: ["1987", "1989", "1991", "1985"], c: 1 },
    { q: "¿Qué civilización construyó Machu Picchu?", opts: ["Maya", "Azteca", "Inca", "Olmeca"], c: 2 },
    { q: "¿Quién descubrió la penicilina?", opts: ["Pasteur", "Fleming", "Koch", "Jenner"], c: 1 },
    { q: "¿En qué año comenzó la Revolución Francesa?", opts: ["1776", "1789", "1799", "1815"], c: 1 },
    { q: "¿Quién fue el primer emperador romano?", opts: ["Julio César", "Augusto", "Nerón", "Calígula"], c: 1 },
  ],
  tecnologia: [
    { q: "¿Qué significa API?", opts: ["Application Programming Interface", "Automated Process Integration", "Advanced Protocol Internet", "Application Process Interchange"], c: 0 },
    { q: "¿Qué es Docker?", opts: ["Un lenguaje", "Plataforma de contenedores", "Un SO", "Una BD"], c: 1 },
    { q: "¿Qué significa REST?", opts: ["Remote Execution Service", "Representational State Transfer", "Reliable Endpoint Service", "Resource Exchange Standard"], c: 1 },
    { q: "¿Cuántos bits tiene un byte?", opts: ["4", "8", "16", "32"], c: 1 },
    { q: "¿Qué es la latencia en redes?", opts: ["Datos transmitidos", "Tiempo de viaje del paquete", "Capacidad del cable", "Usuarios conectados"], c: 1 },
  ],
  geografia: [
    { q: "¿Cuál es el país más grande del mundo?", opts: ["China", "EE.UU.", "Rusia", "Canadá"], c: 2 },
    { q: "¿Cuál es la montaña más alta?", opts: ["K2", "Kilimanjaro", "Everest", "Aconcagua"], c: 2 },
    { q: "¿Cuál es el lago más profundo?", opts: ["Titicaca", "Superior", "Baikal", "Victoria"], c: 2 },
    { q: "¿Cuál es la isla más grande?", opts: ["Madagascar", "Borneo", "Groenlandia", "Nueva Guinea"], c: 2 },
    { q: "¿En qué continente está el Sahara?", opts: ["Asia", "África", "América", "Oceanía"], c: 1 },
  ],
  cine: [
    { q: "¿Quién dirigió 'El Padrino'?", opts: ["Scorsese", "Coppola", "Spielberg", "Kubrick"], c: 1 },
    { q: "¿Cuál fue la primera película de Pixar?", opts: ["Nemo", "Monsters Inc", "Toy Story", "Bichos"], c: 2 },
    { q: "¿En qué saga aparece el DeLorean?", opts: ["Terminator", "Volver al Futuro", "Matrix", "Blade Runner"], c: 1 },
    { q: "¿En qué ciudad vive Batman?", opts: ["Metrópolis", "Star City", "Gotham City", "Central City"], c: 2 },
    { q: "¿En qué año se estrenó Star Wars?", opts: ["1975", "1977", "1979", "1980"], c: 1 },
  ],
  harry_potter: [
    { q: "¿Cuál es el patronus de Harry?", opts: ["Lobo", "Ciervo", "Fénix", "Nutria"], c: 1 },
    { q: "¿Cuántos Horrocruxes creó Voldemort?", opts: ["5", "6", "7", "8"], c: 2 },
    { q: "¿Qué materia enseña Snape inicialmente?", opts: ["Defensa", "Pociones", "Transformaciones", "Herbología"], c: 1 },
    { q: "¿Qué criatura custodia la Cámara de los Secretos?", opts: ["Dragón", "Basilisco", "Acromántula", "Hipogrifo"], c: 1 },
    { q: "¿Cuál es la posición de Harry en Quidditch?", opts: ["Cazador", "Guardián", "Buscador", "Golpeador"], c: 2 },
  ],
  deportes: [
    { q: "¿Qué país ha ganado más Copas del Mundo?", opts: ["Alemania", "Argentina", "Brasil", "Italia"], c: 2 },
    { q: "¿En qué deporte se usa el término 'ace'?", opts: ["Fútbol", "Tenis", "Básquetbol", "Béisbol"], c: 1 },
    { q: "¿Cuántos jugadores tiene un equipo de básquetbol en cancha?", opts: ["4", "5", "6", "7"], c: 1 },
    { q: "¿En qué ciudad se celebraron los primeros Juegos Olímpicos modernos?", opts: ["París", "Londres", "Atenas", "Roma"], c: 2 },
    { q: "¿Qué selección ganó la Copa del Mundo 2022?", opts: ["Francia", "Argentina", "Brasil", "Croacia"], c: 1 },
  ],
  banco_nacion: [
    // Historia e institucional
    { q: "¿En qué año fue creado oficialmente el Banco de la Nación del Perú?", opts: ["1905", "1963", "1966", "1981"], c: 2 },
    { q: "¿Qué institución fue el antecedente directo del Banco de la Nación?", opts: ["Caja de Depósitos y Consignaciones", "Banco Central de Reserva", "Banco Popular", "Caja Nacional del Perú"], c: 0 },
    { q: "¿En qué distrito se encuentra la sede principal actual del Banco de la Nación?", opts: ["San Isidro", "Miraflores", "San Borja", "Cercado de Lima"], c: 2 },
    { q: "¿A qué ministerio está adscrito el Banco de la Nación?", opts: ["Ministerio de Justicia", "Ministerio de Economía y Finanzas", "Ministerio de la Producción", "Ministerio del Interior"], c: 1 },
    // Productos y servicios
    { q: "¿Qué es la Cuenta DNI del Banco de la Nación?", opts: ["Un préstamo para trabajadores públicos", "Una tarjeta de crédito sin membresía", "Una cuenta digital asociada al DNI para inclusión financiera", "Un seguro oncológico"], c: 2 },
    { q: "¿Cómo se llama el préstamo personal insignia del Banco de la Nación?", opts: ["Préstamo Multired", "Préstamo Solidario", "Préstamo BN Plus", "Crédito Sueldo"], c: 0 },
    { q: "¿Qué tarjeta de débito emite el Banco de la Nación?", opts: ["BN Clásica Mastercard", "Multired Global Débito Visa", "BN Internacional", "Débito Digital BN"], c: 1 },
    // Tecnología y canales
    { q: "¿Cómo se llama la banca por internet del Banco de la Nación?", opts: ["BN Online", "Banca Digital BN", "MultiRed Virtual", "Portal BN"], c: 2 },
    { q: "¿Con qué billeteras digitales interopera actualmente el Banco de la Nación?", opts: ["Solo Yape", "Solo Plin", "Yape y Plin", "Tunki y Lukita"], c: 2 },
    { q: "¿Qué elemento de seguridad usa el BN para autorizar transacciones en su app?", opts: ["Huella dactilar obligatoria", "Contraseña de 12 dígitos", "Token o Clave Dinámica Digital", "Firma electrónica notarial"], c: 2 },
  ],
};

const CATEGORY_LABELS = {
  bian:         { label: 'BIAN v14',            color: '#60A5FA' },
  bancaria:     { label: 'Banca',               color: '#34D399' },
  cultura:      { label: 'Cultura General',     color: '#C084FC' },
  historia:     { label: 'Historia',            color: '#FBBF24' },
  tecnologia:   { label: 'Tecnología',          color: '#22D3EE' },
  geografia:    { label: 'Geografía',           color: '#84CC16' },
  cine:         { label: 'Cine',                color: '#F87171' },
  harry_potter: { label: 'Harry Potter',        color: '#EAB308' },
  deportes:     { label: 'Deportes',            color: '#A3E635' },
  banco_nacion: { label: 'Banco de la Nación',  color: '#FB923C' },
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

// ============================================================================
//  COMPONENTE PRINCIPAL
// ============================================================================
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
  // ── Estado (idéntico al original) ────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [receivedClues, setReceivedClues] = useState(initialClues);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [activeTrivia, setActiveTrivia] = useState(null);
  const [unlockedComponents, setUnlockedComponents] = useState([]);
  const [sentComponents, setSentComponents] = useState([]);
  const [usedTriviaIds, setUsedTriviaIds] = useState([]);
  const [triviaStats, setTriviaStats] = useState({ correct: 0, wrong: 0 });
  const [showCluePanel, setShowCluePanel] = useState(true);
  const [decoyIds, setDecoyIds] = useState([]);
  const [layerFilter, setLayerFilter] = useState(null); // NUEVO: filtro por layer

  // ── Regenerar señuelos al cambiar ticket (lógica idéntica) ───────────────
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
    // eslint-disable-next-line
  }, [activeTicket?.id]);

  // ── Socket listener para pistas del Analista (idéntico al original) ──────
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

  // ── Filtro de componentes (search + layer) ───────────────────────────────
  const filteredComponents = useMemo(() => {
    let list = BIAN_COMPONENTS;
    if (layerFilter) list = list.filter(c => c.layer === layerFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(comp =>
        comp.name.toLowerCase().includes(q) ||
        comp.description.toLowerCase().includes(q) ||
        comp.keywords.some(k => k.toLowerCase().includes(q)) ||
        comp.pattern.toLowerCase().includes(q) ||
        comp.layer.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, layerFilter]);

  // ── Lista de layers únicos presentes en los componentes (para chips) ─────
  const availableLayers = useMemo(() => {
    const set = new Set(BIAN_COMPONENTS.map(c => c.layer));
    return Array.from(set);
  }, []);

  // ── Handlers (idénticos al original) ─────────────────────────────────────
  const handleSendComponent = useCallback((component) => {
    if (sentComponents.includes(component.id)) return;
    setSentComponents(prev => [...prev, component.id]);
    if (socket && !soloMode) {
      socket.emit('buscadorComponent', {
        componentId: component.id,
        name: component.name,
        pattern: component.pattern,
        layer: component.layer,
        timestamp: Date.now(),
      });
    }
    if (onComponentSent) onComponentSent(component);
  }, [sentComponents, socket, soloMode, onComponentSent]);

  const handleTryUnlock = useCallback((component) => {
    if (unlockedComponents.includes(component.id)) {
      handleSendComponent(component);
      return;
    }
    setSelectedComponent(component);
    const trivia = getRandomTrivia(usedTriviaIds);
    setActiveTrivia(trivia);
    setUsedTriviaIds(prev => [...prev, trivia.triviaId]);
  }, [unlockedComponents, usedTriviaIds, handleSendComponent]);

  const handleTriviaAnswer = useCallback((correct) => {
    setTriviaStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
    }));
    if (correct && selectedComponent) {
      setUnlockedComponents(prev => [...prev, selectedComponent.id]);
      // Auto-envía al Integrador tras desbloquear
      handleSendComponent(selectedComponent);
    }
  }, [selectedComponent, handleSendComponent]);

  const closeTrivia = useCallback(() => {
    setActiveTrivia(null);
    setSelectedComponent(null);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: C.base, color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      <Header
        cluesCount={receivedClues.length}
        sentCount={sentComponents.length}
        triviaStats={triviaStats}
        ticketName={activeTicket?.nombre}
        ticketId={activeTicket?.id}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {showCluePanel && (
          <CluesPanel clues={receivedClues} soloMode={soloMode} />
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Toolbar
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            showCluePanel={showCluePanel} setShowCluePanel={setShowCluePanel}
            cluesCount={receivedClues.length}
            filteredCount={filteredComponents.length}
            layerFilter={layerFilter} setLayerFilter={setLayerFilter}
            availableLayers={availableLayers}
          />
          <Directory
            components={filteredComponents}
            receivedClues={receivedClues}
            decoyIds={decoyIds}
            unlockedComponents={unlockedComponents}
            sentComponents={sentComponents}
            onTryUnlock={handleTryUnlock}
          />
        </div>
      </div>

      {activeTrivia && (
        <TriviaModal
          trivia={activeTrivia}
          onAnswer={handleTriviaAnswer}
          onClose={closeTrivia}
        />
      )}
    </div>
  );
}

// ============================================================================
//  HEADER
// ============================================================================
function Header({ cluesCount, sentCount, triviaStats, ticketName, ticketId }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`,
      flexWrap: 'wrap', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 30, height: 30, background: C.role, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke={C.roleDark} strokeWidth="1.6" fill="none" />
            <path d="M10.5 10.5 L14 14" stroke={C.roleDark} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>BUSCADOR</div>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 500, marginTop: 1 }}>
            {ticketId ? `${ticketId} · ` : ''}{ticketName || 'Directorio BIAN v14'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Metric label="PISTAS" value={cluesCount} color={C.role} />
        <Metric label="ENVIADOS" value={sentCount} color={C.info} />
        <Metric label="ACIERTOS" value={triviaStats.correct} color={C.success} />
        <Metric label="FALLOS" value={triviaStats.wrong} color={C.danger} />
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, color, fontWeight: 500, marginTop: 1 }}>{value}</div>
    </div>
  );
}

// ============================================================================
//  CLUES PANEL (IZQUIERDA)
// ============================================================================
function CluesPanel({ clues, soloMode }) {
  return (
    <div style={{
      width: 280, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', width: 8, height: 8 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.role }} />
            <div className="bu-pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.role }} />
          </div>
          <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>PISTAS RECIBIDAS</span>
        </div>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: C.role, fontWeight: 500 }}>{clues.length}</span>
      </div>

      <div className="bu-clue-scroll" style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
        {clues.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, margin: '0 auto 12px', borderRadius: '50%', background: C.raised, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M8 2 C6.3 2 5 3.3 5 5 C5 6.5 6 7.5 6.5 8.5 C7 9.5 7 10 7 11 L9 11 C9 10 9 9.5 9.5 8.5 C10 7.5 11 6.5 11 5 C11 3.3 9.7 2 8 2 Z M7 13 L9 13 M7 14.5 L9 14.5" stroke={C.hint} strokeWidth="1.2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <p style={{ fontSize: 12, color: C.hint, lineHeight: 1.5, margin: 0 }}>
              {soloMode ? 'Las pistas del caso aparecerán aquí' : 'Esperando pistas del Analista…'}
            </p>
          </div>
        ) : (
          clues.map((clue, i) => (
            <div key={i} className="bu-slidein-left" style={{
              background: C.raised, borderLeft: `2px solid ${C.role}`, borderRadius: 4,
              padding: '10px 12px', marginBottom: 8, animationDelay: `${Math.min(i, 5) * 60}ms`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: C.role, fontWeight: 500 }}>
                  {clue.clueTag}
                </span>
                <span style={{ fontSize: 10, color: C.hint, marginLeft: 'auto' }}>#{i + 1}</span>
              </div>
              <p style={{ fontSize: 12, color: C.text, lineHeight: 1.55, margin: '0 0 6px' }}>{clue.clueText}</p>
              {clue.serviceDomain && (
                <div style={{ fontSize: 10, color: C.muted, fontFamily: 'ui-monospace, monospace' }}>
                  SD: <span style={{ color: C.role }}>{clue.serviceDomain}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
//  TOOLBAR (búsqueda + filtros)
// ============================================================================
function Toolbar({ searchQuery, setSearchQuery, showCluePanel, setShowCluePanel, cluesCount, filteredCount, layerFilter, setLayerFilter, availableLayers }) {
  return (
    <div style={{ padding: '12px 20px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
      {/* Búsqueda */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke={C.muted} strokeWidth="1.6" fill="none" />
            <path d="M10.5 10.5 L14 14" stroke={C.muted} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="text"
          className="bu-input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar Service Domain, patrón, keywords…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: C.raised, border: `1px solid ${C.border}`, borderRadius: 6,
            padding: '10px 14px 10px 36px', fontSize: 13, color: C.text,
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Chips filtro de layer */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowCluePanel(p => !p)}
          className="bu-btn"
          style={{
            padding: '5px 10px', fontSize: 11, fontWeight: 500, borderRadius: 4,
            background: showCluePanel ? `${C.role}20` : C.raised,
            border: `1px solid ${showCluePanel ? `${C.role}55` : C.border}`,
            color: showCluePanel ? C.role : C.muted,
          }}
        >
          Pistas ({cluesCount})
        </button>

        <span style={{ width: 1, height: 18, background: C.border, margin: '0 4px' }} />

        <button
          onClick={() => setLayerFilter(null)}
          className="bu-btn"
          style={{
            padding: '5px 10px', fontSize: 11, fontWeight: 500, borderRadius: 4,
            background: layerFilter === null ? C.raised : 'transparent',
            border: `1px solid ${layerFilter === null ? C.borderStrong : C.border}`,
            color: layerFilter === null ? C.text : C.muted,
          }}
        >
          Todas las capas
        </button>

        {availableLayers.map(layer => {
          const isActive = layerFilter === layer;
          const lc = LAYER_COLORS[layer] || LAYER_COLORS['Business Support'];
          return (
            <button
              key={layer}
              onClick={() => setLayerFilter(isActive ? null : layer)}
              className="bu-btn"
              style={{
                padding: '5px 10px', fontSize: 11, fontWeight: 500, borderRadius: 4,
                background: isActive ? lc.tint : 'transparent',
                border: `1px solid ${isActive ? lc.border : C.border}`,
                color: isActive ? lc.accent : C.muted,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: lc.accent, flexShrink: 0 }} />
              {layer}
            </button>
          );
        })}

        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted, fontFamily: 'ui-monospace, monospace' }}>
          {filteredCount} / {BIAN_COMPONENTS.length}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
//  DIRECTORY (grid de componentes)
// ============================================================================
function Directory({ components, receivedClues, decoyIds, unlockedComponents, sentComponents, onTryUnlock }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      {components.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
          <p style={{ fontSize: 14, margin: 0 }}>Ningún componente coincide con tu búsqueda.</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Prueba con otra keyword o limpia los filtros.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 10,
        }}>
          {components.map((comp) => (
            <ComponentCard
              key={comp.id}
              comp={comp}
              matchesClue={componentMatchesClue(comp, receivedClues)}
              isDecoy={decoyIds.includes(comp.id)}
              isUnlocked={unlockedComponents.includes(comp.id)}
              isSent={sentComponents.includes(comp.id)}
              onClick={() => onTryUnlock(comp)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Misma lógica que el original para detectar coincidencia con pista
function componentMatchesClue(comp, clues) {
  return clues.some(c =>
    c.serviceDomain?.toLowerCase().includes(comp.name.toLowerCase().split(' ')[0]) ||
    comp.keywords.some(k => c.clueText?.toLowerCase().includes(k))
  );
}

// ============================================================================
//  COMPONENT CARD
// ============================================================================
function ComponentCard({ comp, matchesClue, isDecoy, isUnlocked, isSent, onClick }) {
  const lc = LAYER_COLORS[comp.layer] || LAYER_COLORS['Business Support'];
  const isHighlighted = matchesClue || isDecoy;

  // Mismo color para coincidencia real Y señuelo: el jugador debe usar
  // las pistas del Analista para decidir cuál es cuál (mecánica cooperativa).
  const dotColor = C.role;

  return (
    <div
      className={`bu-card ${isSent ? 'is-sent' : ''} bu-fadein`}
      style={{
        position: 'relative',
        background: isSent ? C.surface : (isHighlighted ? `${C.role}10` : C.surface),
        border: `1px solid ${isSent ? C.border : (isHighlighted ? `${C.role}55` : C.border)}`,
        borderRadius: 10,
        padding: 14,
        opacity: isSent ? 0.5 : 1,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      {/* Dot pulsante si está highlighted */}
      {isHighlighted && !isSent && (
        <div style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor }} />
          <div className="bu-pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor }} />
        </div>
      )}

      {/* Header del card */}
      <div>
        <div style={{
          display: 'inline-block', fontSize: 10, fontFamily: 'ui-monospace, monospace',
          color: lc.accent, fontWeight: 500, letterSpacing: '0.05em',
          marginBottom: 4,
        }}>
          {comp.pattern} · {comp.layer}
        </div>
        <h3 style={{
          fontSize: 14, fontWeight: 500, margin: 0, lineHeight: 1.3,
          color: isSent ? C.muted : C.text,
          paddingRight: isHighlighted && !isSent ? 18 : 0,
        }}>
          {comp.name}
        </h3>
      </div>

      {/* Descripción */}
      <p style={{
        fontSize: 12, color: C.muted, lineHeight: 1.5, margin: 0, flex: 1,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {comp.description}
      </p>

      {/* Footer con botón o estado */}
      {isSent ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 12px', fontSize: 12, color: C.muted,
          background: C.raised, borderRadius: 6, fontWeight: 500,
        }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3 8 L7 12 L13 5" stroke={C.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          Enviado al Integrador
        </div>
      ) : (
        <button
          onClick={onClick}
          className={`bu-btn ${isUnlocked ? 'bu-unlock' : ''}`}
          style={{
            padding: '9px 12px', fontSize: 12, fontWeight: 500, borderRadius: 6,
            background: isUnlocked ? C.role : (isHighlighted ? `${C.role}25` : C.raised),
            color: isUnlocked ? C.roleDark : (isHighlighted ? C.role : C.text),
            border: `1px solid ${isUnlocked ? C.role : (isHighlighted ? `${C.role}88` : C.borderStrong)}`,
            fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {isUnlocked ? (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M3 8 H11 M8 5 L11 8 L8 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              Enviar al Integrador
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="7" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" />
                <path d="M5 7 V5 C5 3.3 6.3 2 8 2 C9.7 2 11 3.3 11 5 V7" stroke="currentColor" strokeWidth="1.4" fill="none" />
              </svg>
              Desbloquear · Trivia
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ============================================================================
//  TRIVIA MODAL
// ============================================================================
function TriviaModal({ trivia, onAnswer, onClose }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState(null);
  const catInfo = CATEGORY_LABELS[trivia.category];
  const correctIdx = trivia.question.c;

  // Auto-cerrar 2.8s después del reveal
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => onClose(), 2800);
    setAutoCloseTimer(t);
    return () => clearTimeout(t);
  }, [revealed, onClose]);

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    onAnswer(idx === correctIdx);
  };

  const handleContinue = () => {
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    onClose();
  };

  const userCorrect = revealed && selected === correctIdx;
  const userAnswered = revealed && selected !== null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div className="bu-pop" style={{
        width: '100%', maxWidth: 520,
        background: C.base, border: `1px solid ${C.border}`, borderRadius: 12,
        overflow: 'hidden', fontFamily: 'inherit',
      }}>
        {/* Header de la trivia */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: C.surface, borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: catInfo.color }} />
            <span style={{ fontSize: 12, color: catInfo.color, fontWeight: 500, letterSpacing: '0.06em' }}>
              {catInfo.label.toUpperCase()}
            </span>
          </div>
          <span style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>
            MINI-QUIZ · DESBLOQUEO
          </span>
        </div>

        {/* Pregunta */}
        <div style={{ padding: '18px 18px 14px' }}>
          <p style={{ fontSize: 15, color: C.text, lineHeight: 1.55, margin: '0 0 16px', fontWeight: 500 }}>
            {trivia.question.q}
          </p>

          <div style={{ display: 'grid', gap: 7 }}>
            {trivia.question.opts.map((opt, i) => {
              const isPicked = selected === i;
              const isCorrect = revealed && i === correctIdx;
              const isWrongPick = revealed && isPicked && i !== correctIdx;

              let bg = C.surface, borderColor = C.border, letterBg = C.raised, letterColor = C.muted, opacity = 1;
              if (revealed) {
                if (isCorrect) { bg = `${C.success}15`; borderColor = C.success; letterBg = C.success; letterColor = C.successDark; }
                else if (isWrongPick) { bg = `${C.danger}15`; borderColor = C.danger; letterBg = C.danger; letterColor = '#501313'; }
                else { opacity = 0.45; }
              } else if (isPicked) {
                borderColor = C.role; letterBg = C.role; letterColor = C.roleDark;
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={revealed}
                  className="bu-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', fontSize: 13, textAlign: 'left',
                    background: bg, border: `1px solid ${borderColor}`, borderRadius: 8,
                    color: C.text, fontFamily: 'inherit', opacity,
                    cursor: revealed ? 'default' : 'pointer',
                  }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                    background: letterBg, color: letterColor,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 500,
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {isCorrect && <span style={{ fontSize: 11, color: C.success, fontWeight: 500 }}>✓ correcta</span>}
                  {isWrongPick && <span style={{ fontSize: 11, color: C.danger, fontWeight: 500 }}>✗ tu elección</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer: feedback + barra de auto-cierre o botón cancelar */}
        {revealed ? (
          <div style={{ padding: '0 18px 16px' }}>
            <div style={{
              padding: '10px 12px', borderRadius: 6, marginBottom: 10,
              background: userCorrect ? `${C.success}15` : `${C.danger}15`,
              border: `1px solid ${userCorrect ? C.success : C.danger}55`,
              color: userCorrect ? C.success : C.danger,
              fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {userCorrect ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8 L7 12 L13 5" stroke={C.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                  Correcto · componente enviado al Integrador
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4 L12 12 M12 4 L4 12" stroke={C.danger} strokeWidth="2" strokeLinecap="round" /></svg>
                  Incorrecto · intenta con otro componente
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Barra de auto-cierre */}
              <div style={{ flex: 1, height: 3, background: C.raised, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: userCorrect ? C.success : C.danger,
                  animation: 'bu-progress 2.8s linear forwards',
                }} />
              </div>
              <button
                onClick={handleContinue}
                className="bu-btn"
                style={{
                  background: 'transparent', border: `1px solid ${C.borderStrong}`,
                  color: C.text, padding: '6px 14px', borderRadius: 6,
                  fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                }}
              >
                Continuar →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 18px 16px' }}>
            <button
              onClick={onClose}
              className="bu-btn"
              style={{
                width: '100%', background: 'transparent', border: `1px solid ${C.border}`,
                color: C.muted, padding: '8px 12px', borderRadius: 6,
                fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
              }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
