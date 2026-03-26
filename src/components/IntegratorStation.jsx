"use client";

/**
 * IntegratorStation.jsx — Architecture Chaos
 * ─────────────────────────────────────────────────────────────────────────────
 * Estación del Integrador (Ensamblador de Arquitectura).
 *
 * Estética: tablero táctico dark-mode estilo "war room". Blueprint canvas
 * con grid sutil, slots con animaciones de colocación, gauges superiores
 * de presupuesto y latencia con estado crítico parpadeante, e inbox lateral
 * con las piezas recibidas del Buscador.
 *
 * Flujo de datos:
 *  1. El Buscador emite "buscador:send_component" → servidor → todos los clientes
 *  2. El Integrador recibe el componente en el Inbox
 *  3. Selecciona una pieza del Inbox → elige un slot vacío → se coloca
 *  4. Cuando todos los slots están llenos y los gauges son OK → Deploy habilitado
 *  5. Deploy emite "integrador:submit_solution" → servidor evalúa y responde
 *
 * Props:
 *  @param {Object}   activeTicket   - escenario activo (del JSON)
 *  @param {Array}    allComponents  - gameConfig.directorio_componentes
 *  @param {Object}   socket         - instancia socket.io-client
 *  @param {string}   roomId
 *  @param {boolean}  isMyTurn       - true si este cliente es el Integrador
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── Datos de desarrollo standalone ──────────────────────────────────────────
const DEV_TICKET = {
  id: "ESC-001",
  nombre: "Crisis de Onboarding Digital",
  dificultad: "FÁCIL",
  presupuesto_usd: 16000,
  latencia_maxima_ms: 900,
  tiempo_limite_seg: 270,
  slots_solucion: [
    { id: "slot_1", nombre: "Protocol Bridge REST→SOAP", orden: 1 },
    { id: "slot_2", nombre: "Master Data del Cliente",   orden: 2 },
    { id: "slot_3", nombre: "Orquestación Comercial",    orden: 3 },
    { id: "slot_4", nombre: "Core — Cuenta Corriente",   orden: 4 },
  ],
  solucion_correcta: {
    slot_1: "COMP-001",
    slot_2: "COMP-004",
    slot_3: "COMP-003",
    slot_4: "COMP-002",
  },
};

const DEV_INBOX = [
  { id:"COMP-001", nombre:"API Gateway Enterprise",       dominio_bian:"Infraestructura de Integración", tipo:"GATEWAY",        costo_usd:4500, latencia_add_ms:45,  nivel_riesgo:"BAJO",  color_ui:"#6366F1", forma_ui:"hexagon", descripcion_corta:"Puerta de entrada universal. Traduce REST/SOAP, mTLS.", patron_funcional:"Administrar" },
  { id:"COMP-004", nombre:"Party Data Management",        dominio_bian:"Party Reference Data Mgmt",     tipo:"SERVICIO_BIAN",  costo_usd:2800, latencia_add_ms:80,  nivel_riesgo:"BAJO",  color_ui:"#06B6D4", forma_ui:"circle",  descripcion_corta:"Golden record del cliente. MDM centralizado.", patron_funcional:"Referencia" },
  { id:"COMP-003", nombre:"Customer Offer Management",    dominio_bian:"Customer Offer",               tipo:"SERVICIO_BIAN",  costo_usd:3200, latencia_add_ms:120, nivel_riesgo:"BAJO",  color_ui:"#F59E0B", forma_ui:"circle",  descripcion_corta:"Orquesta el journey comercial KYC end-to-end.", patron_funcional:"Administrar" },
  { id:"COMP-007", nombre:"Payment Execution",            dominio_bian:"Payment Execution",            tipo:"SERVICIO_BIAN",  costo_usd:6800, latencia_add_ms:95,  nivel_riesgo:"ALTO",  color_ui:"#EF4444", forma_ui:"diamond", descripcion_corta:"Motor de pagos interbancarios SWIFT gpi.", patron_funcional:"Procesar" },
  { id:"COMP-002", nombre:"Current Account Fulfillment",  dominio_bian:"Current Account Fulfillment",  tipo:"SERVICIO_BIAN",  costo_usd:5200, latencia_add_ms:210, nivel_riesgo:"MEDIO", color_ui:"#8B5CF6", forma_ui:"hexagon", descripcion_corta:"Ciclo de vida de cuentas corrientes conforme BIAN.", patron_funcional:"Fulfillment" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUSD = (n) =>
  new Intl.NumberFormat("es-ES", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(n);

const RISK_COLOR = { BAJO:"#10b981", MEDIO:"#f59e0b", ALTO:"#ef4444" };

const SHAPES = {
  hexagon: (color, size=20) => (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <polygon points="10,1 18,5.5 18,14.5 10,19 2,14.5 2,5.5"
        fill={color} opacity="0.85" />
    </svg>
  ),
  circle: (color, size=20) => (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill={color} opacity="0.85" />
    </svg>
  ),
  square: (color, size=20) => (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <rect x="2" y="2" width="16" height="16" rx="3" fill={color} opacity="0.85" />
    </svg>
  ),
  diamond: (color, size=20) => (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <polygon points="10,1 19,10 10,19 1,10" fill={color} opacity="0.85" />
    </svg>
  ),
};

// ─── Mini: Indicador de forma con color ───────────────────────────────────────
function ShapeIcon({ shape, color, size=20 }) {
  const fn = SHAPES[shape] ?? SHAPES.circle;
  return fn(color, size);
}

// ─── Mini: Badge de riesgo ────────────────────────────────────────────────────
function RiskBadge({ risk }) {
  const cfg = {
    BAJO:  "bg-emerald-900/70 text-emerald-300 border-emerald-700",
    MEDIO: "bg-amber-900/70  text-amber-300  border-amber-700",
    ALTO:  "bg-red-900/70    text-red-300    border-red-800",
  }[risk] ?? "bg-zinc-800 text-zinc-400 border-zinc-700";
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${cfg}`}>
      {risk}
    </span>
  );
}

// ─── Gauge: Barra de presupuesto / latencia ───────────────────────────────────
function Gauge({ label, current, limit, unit, colorOk, colorCritical }) {
  const pct = Math.min((current / limit) * 100, 100);
  const over = current > limit;
  const nearLimit = pct >= 80 && !over;

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {/* Etiqueta + valores */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-sm font-bold font-mono transition-colors duration-300 ${
              over ? "text-red-400" : nearLimit ? "text-amber-400" : "text-zinc-200"
            }`}
          >
            {unit === "ms" ? `${current}ms` : fmtUSD(current)}
          </span>
          <span className="text-[10px] text-zinc-600">
            / {unit === "ms" ? `${limit}ms` : fmtUSD(limit)}
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
        {/* Relleno de fondo segmentado */}
        <div className="absolute inset-0 flex gap-px opacity-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 bg-zinc-600 rounded-sm" />
          ))}
        </div>
        {/* Barra activa */}
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
            over
              ? "bg-red-500 animate-pulse"
              : nearLimit
              ? "bg-amber-400"
              : colorOk
          }`}
          style={{ width: `${pct}%` }}
        />
        {/* Marca de límite */}
        <div className="absolute right-0 top-0 h-full w-px bg-zinc-600 opacity-60" />
      </div>

      {/* Mensaje de estado */}
      {over && (
        <p className="text-[9px] text-red-400 font-mono animate-pulse">
          ⚠ LÍMITE EXCEDIDO — remueve una pieza
        </p>
      )}
    </div>
  );
}

// ─── Mini: Tarjeta de componente en el Inbox ──────────────────────────────────
function InboxCard({ comp, isSelected, isUsed, onClick }) {
  return (
    <button
      onClick={() => !isUsed && onClick(comp.id)}
      disabled={isUsed}
      aria-pressed={isSelected}
      className={[
        "w-full text-left rounded-lg border transition-all duration-150 p-2.5 group",
        "focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-zinc-950",
        isUsed
          ? "opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-900/20"
          : isSelected
          ? "border-current bg-zinc-800/80 shadow-lg scale-[1.02]"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/60 cursor-pointer",
      ].join(" ")}
      style={isSelected ? { borderColor: comp.color_ui, "--tw-ring-color": comp.color_ui } : {}}
    >
      <div className="flex items-start gap-2">
        {/* Shape */}
        <div className="shrink-0 mt-0.5">
          <ShapeIcon shape={comp.forma_ui} color={comp.color_ui} size={18} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-[11px] font-bold text-zinc-100 leading-tight truncate">
              {comp.nombre}
            </p>
            {isUsed && (
              <span className="shrink-0 text-[9px] text-emerald-500">✓ colocado</span>
            )}
          </div>
          <p className="text-[9px] text-zinc-500 truncate mt-0.5">{comp.dominio_bian}</p>

          {/* Métricas mini */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-mono text-amber-400">
              {fmtUSD(comp.costo_usd)}
            </span>
            <span className="text-zinc-700">·</span>
            <span
              className={`text-[10px] font-mono ${
                comp.latencia_add_ms > 200
                  ? "text-red-400"
                  : comp.latencia_add_ms > 100
                  ? "text-amber-400"
                  : "text-sky-400"
              }`}
            >
              +{comp.latencia_add_ms}ms
            </span>
            <span className="text-zinc-700">·</span>
            <RiskBadge risk={comp.nivel_riesgo} />
          </div>
        </div>
      </div>

      {/* Seleccionado indicator */}
      {isSelected && (
        <div
          className="mt-2 text-[9px] font-mono font-bold text-center animate-pulse"
          style={{ color: comp.color_ui }}
        >
          ← Seleccionado — haz clic en un slot vacío
        </div>
      )}
    </button>
  );
}

// ─── Mini: Slot del Blueprint Canvas ─────────────────────────────────────────
function BlueprintSlot({ slot, placedComp, isTarget, isSelected, onClick, onRemove }) {
  const empty = !placedComp;

  return (
    <div className="flex flex-col gap-0 relative">
      {/* Número de orden */}
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-colors ${
            empty ? "bg-zinc-800 text-zinc-600" : "bg-emerald-900/60 text-emerald-400"
          }`}
        >
          {slot.orden}
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          {slot.nombre}
        </span>
      </div>

      {/* Slot container */}
      <button
        onClick={onClick}
        className={[
          "relative w-full rounded-xl border-2 transition-all duration-200 overflow-hidden",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950",
          empty
            ? isTarget
              ? "border-dashed border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-900/20 scale-[1.02]"
              : "border-dashed border-zinc-700 bg-zinc-900/30 hover:border-zinc-500 hover:bg-zinc-900/50 cursor-pointer"
            : "border-solid cursor-default",
        ].join(" ")}
        style={
          !empty
            ? { borderColor: placedComp.color_ui, background: `${placedComp.color_ui}12` }
            : {}
        }
      >
        {/* Grid pattern de fondo para slots vacíos */}
        {empty && (
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "linear-gradient(to right, #6b7280 1px, transparent 1px), linear-gradient(to bottom, #6b7280 1px, transparent 1px)",
              backgroundSize: "12px 12px",
            }}
          />
        )}

        {/* Contenido */}
        <div className="relative p-4 min-h-[90px] flex items-center justify-center">
          {empty ? (
            /* Slot vacío */
            <div className="flex flex-col items-center gap-2 text-center">
              {isTarget ? (
                <>
                  <div className="w-8 h-8 rounded-lg border-2 border-dashed border-emerald-500 flex items-center justify-center animate-pulse">
                    <span className="text-emerald-400 text-lg">+</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Clic para colocar
                  </span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center">
                    <span className="text-zinc-700 text-lg">+</span>
                  </div>
                  <span className="text-[10px] text-zinc-700 font-mono">
                    Slot vacío
                  </span>
                </>
              )}
            </div>
          ) : (
            /* Slot ocupado */
            <div className="flex items-center gap-3 w-full">
              <div
                className="shrink-0 p-2 rounded-lg"
                style={{ background: `${placedComp.color_ui}20` }}
              >
                <ShapeIcon
                  shape={placedComp.forma_ui}
                  color={placedComp.color_ui}
                  size={28}
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p
                  className="text-sm font-bold leading-tight truncate"
                  style={{ color: placedComp.color_ui }}
                >
                  {placedComp.nombre}
                </p>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {placedComp.dominio_bian}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-amber-400">
                    {fmtUSD(placedComp.costo_usd)}
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span
                    className={`text-[10px] font-mono ${
                      placedComp.latencia_add_ms > 200
                        ? "text-red-400"
                        : placedComp.latencia_add_ms > 100
                        ? "text-amber-400"
                        : "text-sky-400"
                    }`}
                  >
                    +{placedComp.latencia_add_ms}ms
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scan line animado en slot ocupado */}
        {!empty && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
            aria-hidden
          >
            <div
              className="absolute left-0 right-0 h-px opacity-20 animate-[scanline_3s_ease-in-out_infinite]"
              style={{ background: placedComp.color_ui }}
            />
          </div>
        )}
      </button>

      {/* Botón remover */}
      {!empty && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(slot.id); }}
          className="absolute top-6 right-2 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-800 transition-colors text-[10px] flex items-center justify-center z-10"
          title="Remover pieza"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Componente: Panel de resultado de validación ────────────────────────────
function ValidationResult({ result, onDismiss }) {
  if (!result) return null;

  const { correct, incorrectSlots, message } = result;

  return (
    <div
      className={`absolute inset-0 z-30 flex items-center justify-center rounded-2xl backdrop-blur-sm ${
        correct ? "bg-emerald-950/70" : "bg-red-950/70"
      }`}
    >
      <div
        className={`max-w-sm w-full mx-6 rounded-2xl border p-6 text-center space-y-4 ${
          correct
            ? "bg-zinc-950 border-emerald-700 shadow-lg shadow-emerald-900/40"
            : "bg-zinc-950 border-red-800 shadow-lg shadow-red-900/40"
        }`}
      >
        <div className="text-5xl">{correct ? "✓" : "✗"}</div>
        <h3
          className={`font-bold text-lg font-mono ${
            correct ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {correct ? "Solución Correcta" : "Solución Incorrecta"}
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{message}</p>

        {!correct && incorrectSlots?.length > 0 && (
          <div className="text-left space-y-1">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
              Slots incorrectos:
            </p>
            {incorrectSlots.map((s) => (
              <div
                key={s.slotId}
                className="text-[11px] text-red-300 font-mono px-2 py-1 bg-red-950/50 rounded border border-red-900"
              >
                {s.slotName}: <span className="text-zinc-400">{s.placed}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onDismiss}
          className={`w-full py-2.5 rounded-xl font-bold text-sm font-mono transition-all ${
            correct
              ? "bg-emerald-700 hover:bg-emerald-600 text-white"
              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
          }`}
        >
          {correct ? "Continuar →" : "Revisar solución"}
        </button>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function IntegratorStation({
  activeTicket   = DEV_TICKET,
  allComponents  = DEV_INBOX,
  socket         = null,
  roomId         = "DEMO-01",
  isMyTurn       = true,
}) {
  // — Inbox: componentes recibidos del Buscador —
  const [inbox, setInbox]               = useState(DEV_INBOX);
  // — Slots: mapa slotId → componentId colocado —
  const [slotMap, setSlotMap]           = useState({});
  // — Pieza seleccionada del inbox —
  const [selectedCompId, setSelectedCompId] = useState(null);
  // — Validación de solución —
  const [validationResult, setValidationResult] = useState(null);
  // — Animación de deploy —
  const [isDeploying, setIsDeploying]   = useState(false);
  // — Timer de la misión —
  const [timeLeft, setTimeLeft]         = useState(activeTicket?.tiempo_limite_seg ?? 270);
  const timerRef                        = useRef(null);
  // — Flash de confirmación al colocar pieza —
  const [flashSlot, setFlashSlot]       = useState(null);

  // ── Escuchar componentes del Buscador vía Socket ──────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onReceive = ({ componentData }) => {
      setInbox((prev) => {
        // Evitar duplicados
        if (prev.find((c) => c.id === componentData.id)) return prev;
        return [...prev, componentData];
      });
    };

    socket.on("buscador:send_component", onReceive);
    return () => socket.off("buscador:send_component", onReceive);
  }, [socket]);

  // ── Escuchar respuesta de validación del servidor ─────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onValidation = (result) => {
      setIsDeploying(false);
      setValidationResult(result);
    };

    socket.on("server:solution_result", onValidation);
    return () => socket.off("server:solution_result", onValidation);
  }, [socket]);

  // ── Timer countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []); // eslint-disable-line

  // Resetear al cambiar ticket
  useEffect(() => {
    setSlotMap({});
    setSelectedCompId(null);
    setValidationResult(null);
    setTimeLeft(activeTicket?.tiempo_limite_seg ?? 270);
  }, [activeTicket?.id]);

  // ── Métricas dinámicas ────────────────────────────────────────────────────
  const placedComponents = useMemo(() => {
    return Object.values(slotMap)
      .map((cid) => inbox.find((c) => c.id === cid) ?? allComponents.find((c) => c.id === cid))
      .filter(Boolean);
  }, [slotMap, inbox, allComponents]);

  const totalCost    = useMemo(() => placedComponents.reduce((s, c) => s + c.costo_usd, 0),    [placedComponents]);
  const totalLatency = useMemo(() => placedComponents.reduce((s, c) => s + c.latencia_add_ms, 0), [placedComponents]);

  const overBudget  = totalCost    > (activeTicket?.presupuesto_usd    ?? Infinity);
  const overLatency = totalLatency > (activeTicket?.latencia_maxima_ms ?? Infinity);

  const slots = activeTicket?.slots_solucion ?? [];
  const allSlotsFilled = slots.every((s) => Boolean(slotMap[s.id]));
  const canDeploy = allSlotsFilled && !overBudget && !overLatency && isMyTurn && !isDeploying;

  // ── IDs usados (en slots) ─────────────────────────────────────────────────
  const usedIds = useMemo(() => new Set(Object.values(slotMap)), [slotMap]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelectInboxCard = useCallback((compId) => {
    setSelectedCompId((prev) => (prev === compId ? null : compId));
  }, []);

  const handleSlotClick = useCallback(
    (slotId) => {
      const slotComp = slotMap[slotId];

      if (slotComp) {
        // Si hay pieza y no hay selección, seleccionar la pieza del inbox
        if (!selectedCompId) {
          setSelectedCompId(slotComp);
          return;
        }
      }

      // Si hay pieza seleccionada → colocarla en el slot
      if (selectedCompId) {
        setSlotMap((prev) => {
          const next = { ...prev };
          // Si la pieza ya estaba en otro slot, liberarlo
          Object.keys(next).forEach((sid) => {
            if (next[sid] === selectedCompId) delete next[sid];
          });
          next[slotId] = selectedCompId;
          return next;
        });
        // Flash de confirmación
        setFlashSlot(slotId);
        setTimeout(() => setFlashSlot(null), 600);
        setSelectedCompId(null);
      }
    },
    [selectedCompId, slotMap]
  );

  const handleRemoveFromSlot = useCallback((slotId) => {
    setSlotMap((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }, []);

  const handleDeploy = useCallback(() => {
    if (!canDeploy) return;
    setIsDeploying(true);

    const payload = {
      roomId,
      ticketId: activeTicket.id,
      slotMap, // { slot_1: "COMP-001", slot_2: "COMP-004", ... }
      totalCost,
      totalLatency,
    };

    if (socket) {
      socket.emit("integrador:submit_solution", payload);
    } else {
      // Modo standalone: validación local
      setTimeout(() => {
        const correct = activeTicket?.solucion_correcta
          ? Object.entries(activeTicket.solucion_correcta).every(
              ([slotId, compId]) => slotMap[slotId] === compId
            )
          : false;

        const incorrectSlots = !correct
          ? Object.entries(activeTicket.solucion_correcta ?? {})
              .filter(([slotId, compId]) => slotMap[slotId] !== compId)
              .map(([slotId]) => ({
                slotId,
                slotName: slots.find((s) => s.id === slotId)?.nombre ?? slotId,
                placed: inbox.find((c) => c.id === slotMap[slotId])?.nombre ?? "vacío",
              }))
          : [];

        setIsDeploying(false);
        setValidationResult({
          correct,
          incorrectSlots,
          message: correct
            ? `Arquitectura validada. Costo: ${fmtUSD(totalCost)} | Latencia: ${totalLatency}ms`
            : "La asignación de componentes a los slots no coincide con la solución esperada.",
        });
      }, 1800);
    }
  }, [canDeploy, socket, roomId, activeTicket, slotMap, totalCost, totalLatency, inbox, slots]);

  // ── Formato del timer ─────────────────────────────────────────────────────
  const timerMin = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const timerSec = String(timeLeft % 60).padStart(2, "0");
  const timerCritical = timeLeft <= 30;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden relative">

      {/* ── Scanline CSS global (inyectado una sola vez) ── */}
      <style>{`
        @keyframes scanline {
          0%   { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes slot-appear {
          from { opacity: 0; transform: scale(0.94) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes flash-green {
          0%, 100% { box-shadow: none; }
          40%      { box-shadow: 0 0 0 3px rgba(16,185,129,0.6); }
        }
        .slot-appear { animation: slot-appear 0.25s ease-out forwards; }
        .flash-placed { animation: flash-green 0.5s ease-out; }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          HEADER — Gauges + Timer + Rol
      ══════════════════════════════════════════════════════════ */}
      <header className="shrink-0 bg-zinc-900 border-b border-zinc-800 px-5 py-3 space-y-3">

        {/* Fila superior: Rol + Timer + Estado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-400 animate-pulse" />
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest">
                Integrador — Ensamblador
              </span>
            </div>
            <span className="text-zinc-700 text-[10px]">|</span>
            <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[240px]">
              {activeTicket?.nombre ?? "Sin ticket activo"}
            </span>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold transition-colors ${
              timerCritical
                ? "border-red-800 bg-red-950/50 text-red-400 animate-pulse"
                : "border-zinc-800 bg-zinc-900 text-zinc-300"
            }`}
          >
            <span className="text-[10px] text-zinc-600">⏱</span>
            {timerMin}:{timerSec}
          </div>
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-2 gap-6">
          <Gauge
            label="Presupuesto"
            current={totalCost}
            limit={activeTicket?.presupuesto_usd ?? 0}
            unit="usd"
            colorOk="bg-sky-500"
          />
          <Gauge
            label="Latencia Total"
            current={totalLatency}
            limit={activeTicket?.latencia_maxima_ms ?? 0}
            unit="ms"
            colorOk="bg-emerald-500"
          />
        </div>

        {/* Progreso de slots */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            Slots
          </span>
          <div className="flex-1 flex gap-1">
            {slots.map((s) => (
              <div
                key={s.id}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  slotMap[s.id] ? "bg-emerald-500" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {Object.keys(slotMap).length}/{slots.length}
          </span>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          BODY — Canvas (centro) + Inbox (lateral)
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Blueprint Canvas (centro) ── */}
        <main className="flex-1 overflow-y-auto p-5 space-y-4 relative">

          {/* Fondo de grilla blueprint */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            aria-hidden
            style={{
              backgroundImage:
                "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Título de sección */}
          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] px-2">
              Blueprint — Arquitectura de Solución
            </span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* Conectores visuales entre slots */}
          <div className="relative space-y-3">
            {slots.map((slot, idx) => {
              const placedComp =
                slotMap[slot.id]
                  ? (inbox.find((c) => c.id === slotMap[slot.id]) ??
                     allComponents.find((c) => c.id === slotMap[slot.id]))
                  : null;

              const isTarget = Boolean(selectedCompId) && !slotMap[slot.id];
              const isFlashing = flashSlot === slot.id;

              return (
                <div
                  key={slot.id}
                  className={`slot-appear ${isFlashing ? "flash-placed" : ""}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <BlueprintSlot
                    slot={slot}
                    placedComp={placedComp}
                    isTarget={isTarget}
                    isSelected={false}
                    onClick={() => handleSlotClick(slot.id)}
                    onRemove={handleRemoveFromSlot}
                  />

                  {/* Flecha de conexión entre slots */}
                  {idx < slots.length - 1 && (
                    <div className="flex justify-center my-1">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-px h-3 bg-zinc-800" />
                        <svg width="8" height="5" viewBox="0 0 8 5" className="text-zinc-700">
                          <polygon points="4,5 0,0 8,0" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Botón Deploy ── */}
          <div className="sticky bottom-0 pt-3 pb-1">
            <button
              onClick={handleDeploy}
              disabled={!canDeploy}
              className={[
                "w-full py-4 rounded-xl font-bold text-sm font-mono tracking-widest uppercase transition-all duration-300",
                "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950",
                canDeploy
                  ? "border-emerald-600 bg-emerald-700 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-900/50 active:scale-[0.98] focus:ring-emerald-500"
                  : overBudget || overLatency
                  ? "border-red-900 bg-red-950/30 text-red-700 cursor-not-allowed"
                  : "border-zinc-800 bg-zinc-900/30 text-zinc-700 cursor-not-allowed",
              ].join(" ")}
            >
              {isDeploying ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  Validando arquitectura...
                </span>
              ) : overBudget ? (
                "⚠ Presupuesto excedido — ajusta la solución"
              ) : overLatency ? (
                "⚠ Latencia excedida — ajusta la solución"
              ) : !allSlotsFilled ? (
                `${slots.length - Object.keys(slotMap).length} slot${
                  slots.length - Object.keys(slotMap).length !== 1 ? "s" : ""
                } pendiente${
                  slots.length - Object.keys(slotMap).length !== 1 ? "s" : ""
                }`
              ) : (
                "⬆ Desplegar Solución"
              )}
            </button>

            {/* Hint de instrucción */}
            {selectedCompId && (
              <p className="text-center text-[10px] text-emerald-400 font-mono mt-2 animate-pulse">
                Pieza seleccionada → Haz clic en un slot vacío para colocarla
              </p>
            )}
          </div>
        </main>

        {/* ── Inbox Lateral ── */}
        <aside className="w-64 shrink-0 flex flex-col border-l border-zinc-800 bg-zinc-900/40 overflow-hidden">

          {/* Header del inbox */}
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    inbox.length > 0 ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                  }`}
                />
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                  Inbox — Piezas
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600">
                {inbox.length - usedIds.size}/{inbox.length}
              </span>
            </div>
            <p className="text-[9px] text-zinc-700 mt-1">
              Recibidas del Buscador
            </p>
          </div>

          {/* Lista de componentes recibidos */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {inbox.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-zinc-800 gap-2">
                <span className="text-2xl font-mono">∅</span>
                <span className="text-[10px] text-center">
                  Esperando componentes del Buscador...
                </span>
              </div>
            ) : (
              inbox.map((comp) => (
                <InboxCard
                  key={comp.id}
                  comp={comp}
                  isSelected={selectedCompId === comp.id}
                  isUsed={usedIds.has(comp.id)}
                  onClick={handleSelectInboxCard}
                />
              ))
            )}
          </div>

          {/* Footer del inbox: instrucciones contextuales */}
          <div className="px-4 py-3 border-t border-zinc-800 space-y-2">
            {/* Estado de interacción */}
            <div className="text-[9px] font-mono text-zinc-700 space-y-1">
              {!selectedCompId && !allSlotsFilled && (
                <p>① Selecciona una pieza del inbox</p>
              )}
              {selectedCompId && (
                <p className="text-emerald-500 animate-pulse">
                  ② Haz clic en un slot del canvas
                </p>
              )}
              {allSlotsFilled && !overBudget && !overLatency && (
                <p className="text-emerald-400">③ Todos los slots llenos — despliega</p>
              )}
            </div>

            {/* Resumen de costos */}
            <div className="bg-zinc-950/60 rounded-lg p-2.5 space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-600">Costo acumulado</span>
                <span className={overBudget ? "text-red-400" : "text-amber-400"}>
                  {fmtUSD(totalCost)}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-600">Latencia total</span>
                <span className={overLatency ? "text-red-400" : "text-sky-400"}>
                  {totalLatency}ms
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-600">Piezas colocadas</span>
                <span className="text-zinc-400">
                  {Object.keys(slotMap).length}/{slots.length}
                </span>
              </div>
            </div>

            {/* Estado de turno */}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isMyTurn ? "bg-emerald-400" : "bg-zinc-700"
                }`}
              />
              <span className="text-[9px] font-mono text-zinc-700">
                {isMyTurn ? "Turno activo" : "Esperando turno"}
              </span>
              <span className="ml-auto text-[9px] font-mono text-zinc-800">
                {roomId}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Overlay de validación ── */}
      <ValidationResult
        result={validationResult}
        onDismiss={() => setValidationResult(null)}
      />
    </div>
  );
}

/*
 * ─── Integración con el servidor Socket.io ───────────────────────────────────
 *
 * Eventos emitidos:
 *   integrador:submit_solution  →  { roomId, ticketId, slotMap, totalCost, totalLatency }
 *
 * Eventos escuchados:
 *   buscador:send_component     ←  { componentData }   (desde el Buscador)
 *   server:solution_result      ←  { correct, incorrectSlots, message }
 *
 * Uso:
 *   import IntegratorStation from "@/components/game/stations/IntegratorStation";
 *   import gameConfig from "@/public/configuracion_juego.json";
 *
 *   <IntegratorStation
 *     activeTicket={gameConfig.escenarios[0]}
 *     allComponents={gameConfig.directorio_componentes}
 *     socket={socket}
 *     roomId="ABC123"
 *     isMyTurn={true}
 *   />
 */
