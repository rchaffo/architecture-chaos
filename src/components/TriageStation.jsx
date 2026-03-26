"use client";

/**
 * src/components/TriageStation.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Estación del Project Manager — "Triage Controller"
 *
 * Tablero Kanban con tres columnas:
 *   BACKLOG → EN PROGRESO → COMPLETADO
 *
 * El PM puede:
 *   - Ver todos los tickets del juego con su dificultad y restricciones
 *   - Ver cuál es el ticket activo actualmente
 *   - Ver el nivel de pánico y el score del equipo en tiempo real
 *   - Ver qué tickets ya fueron completados
 *
 * Props:
 *   activeTicket     : ticket activo actual
 *   allTickets       : array de todos los escenarios (del gameConfig)
 *   ticketsCompleted : array de IDs completados (del store)
 *   score            : número
 *   panicLevel       : número 0-100
 *   roomId           : string
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { useGameStore } from "../store/gameStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUSD = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const DIFF_COLOR = {
  "FÁCIL"  : { bg: "bg-emerald-900/50", text: "text-emerald-400", border: "border-emerald-800" },
  "MEDIA"  : { bg: "bg-amber-900/50",   text: "text-amber-400",   border: "border-amber-800"   },
  "ALTA"   : { bg: "bg-red-900/50",     text: "text-red-400",     border: "border-red-800"     },
  "EXPERTO": { bg: "bg-purple-900/50",  text: "text-purple-400",  border: "border-purple-800"  },
};

// ─── Componente: Tarjeta de ticket ────────────────────────────────────────────
function TicketCard({ ticket, status, isActive }) {
  const diff = DIFF_COLOR[ticket.dificultad] ?? DIFF_COLOR["MEDIA"];

  return (
    <div
      className={[
        "rounded-xl border p-3 space-y-2 transition-all duration-200",
        isActive
          ? "border-indigo-600 bg-indigo-950/30 shadow-lg shadow-indigo-900/20"
          : status === "completado"
          ? "border-zinc-800 bg-zinc-900/20 opacity-60"
          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600",
      ].join(" ")}
    >
      {/* Header de la tarjeta */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-mono text-zinc-600">{ticket.id}</span>
            {isActive && (
              <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold">
                ● ACTIVO
              </span>
            )}
            {status === "completado" && (
              <span className="text-[9px] text-emerald-500 font-bold">✓ Completado</span>
            )}
          </div>
          <p className="text-[11px] font-bold text-zinc-100 leading-tight">{ticket.nombre}</p>
          <p className="text-[9px] text-zinc-600 mt-0.5">{ticket.categoria}</p>
        </div>
        <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded border font-bold ${diff.bg} ${diff.text} ${diff.border}`}>
          {ticket.dificultad}
        </span>
      </div>

      {/* Descripción corta */}
      <p className="text-[9px] text-zinc-500 leading-relaxed line-clamp-2">
        {ticket.descripcion_publica}
      </p>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        <div className="bg-zinc-950/60 rounded px-2 py-1">
          <p className="text-[8px] text-zinc-700">Tiempo</p>
          <p className="text-[9px] font-bold text-zinc-300">
            {Math.floor(ticket.tiempo_limite_seg / 60)}m{ticket.tiempo_limite_seg % 60 > 0 ? `${ticket.tiempo_limite_seg % 60}s` : ""}
          </p>
        </div>
        <div className="bg-zinc-950/60 rounded px-2 py-1">
          <p className="text-[8px] text-zinc-700">Presupuesto</p>
          <p className="text-[9px] font-bold text-amber-400">
            {fmtUSD(ticket.presupuesto_usd)}
          </p>
        </div>
        <div className="bg-zinc-950/60 rounded px-2 py-1">
          <p className="text-[8px] text-zinc-700">Slots</p>
          <p className="text-[9px] font-bold text-sky-400">
            {ticket.slots_solucion?.length ?? "?"}
          </p>
        </div>
      </div>

      {/* Puntos */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[9px] text-zinc-700">Puntos base</span>
        <span className="text-[9px] font-bold text-indigo-400">{ticket.puntaje_base?.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ─── Componente: Columna del Kanban ───────────────────────────────────────────
function KanbanColumn({ title, color, dotColor, tickets, activeTicketId, status }) {
  return (
    <div className="flex flex-col min-h-0">
      {/* Header columna */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>
          {title}
        </span>
        <span className="ml-auto text-[9px] font-mono text-zinc-600">
          {tickets.length}
        </span>
      </div>

      {/* Tarjetas */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {tickets.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-[9px] text-zinc-700">Sin tickets</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              status={status}
              isActive={ticket.id === activeTicketId}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Componente: Gauge de pánico ──────────────────────────────────────────────
function PanicMeter({ level, max = 100 }) {
  const pct    = Math.min((level / max) * 100, 100);
  const isCrit = pct >= 80;
  const isWarn = pct >= 50 && !isCrit;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
          Pánico del Sistema
        </span>
        <span className={`text-[10px] font-bold font-mono ${isCrit ? "text-red-400 animate-pulse" : isWarn ? "text-amber-400" : "text-emerald-400"}`}>
          {level}%
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isCrit ? "bg-red-500 animate-pulse" : isWarn ? "bg-amber-400" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function TriageStation({
  activeTicket     = null,
  allTickets       = [],
  ticketsCompleted : propCompleted = null,
  score            : propScore    = null,
  panicLevel       : propPanic    = null,
  roomId           = "DEMO",
}) {
  // Leer del store lo que no venga por props
  const storeTicket    = useGameStore((s) => s.activeTicket);
  const storeCompleted = useGameStore((s) => s.ticketsCompleted);
  const storeScore     = useGameStore((s) => s.score);
  const storePanic     = useGameStore((s) => s.panicLevel);
  const gameConfig     = useGameStore((s) => s.gameConfig);

  const ticket     = activeTicket     ?? storeTicket;
  const completed  = propCompleted    ?? storeCompleted ?? [];
  const score      = propScore        ?? storeScore     ?? 0;
  const panic      = propPanic        ?? storePanic     ?? 0;
  const tickets    = allTickets.length ? allTickets : (gameConfig?.escenarios ?? []);

  // ── Distribuir tickets en columnas ──────────────────────────────────────────
  const { backlog, inProgress, done } = useMemo(() => {
    const activeId = ticket?.id;

    const done       = tickets.filter((t) => completed.includes(t.id));
    const inProgress = tickets.filter((t) => t.id === activeId && !completed.includes(t.id));
    const backlog    = tickets.filter((t) => t.id !== activeId && !completed.includes(t.id));

    return { backlog, inProgress, done };
  }, [tickets, ticket, completed]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white overflow-hidden font-mono text-xs">

      {/* ── Header ── */}
      <header className="shrink-0 bg-zinc-900 border-b border-zinc-800 px-5 py-3 space-y-3">

        {/* Fila superior */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-400 animate-pulse" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Project Manager — Triage
              </span>
            </div>
            <span className="text-zinc-700">|</span>
            <span className="text-[10px] text-zinc-500">Sala {roomId}</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900">
            <span className="text-[9px] text-zinc-600">Score</span>
            <span className="text-sm font-bold text-indigo-400">{score.toLocaleString()}</span>
          </div>
        </div>

        {/* Gauge de pánico */}
        <PanicMeter level={panic} />

        {/* Resumen de progreso */}
        <div className="flex items-center gap-4 text-[9px] text-zinc-600">
          <span>Total: <span className="text-zinc-300">{tickets.length}</span> tickets</span>
          <span>Completados: <span className="text-emerald-400">{done.length}</span></span>
          <span>En progreso: <span className="text-indigo-400">{inProgress.length}</span></span>
          <span>Backlog: <span className="text-zinc-400">{backlog.length}</span></span>
        </div>
      </header>

      {/* ── Tablero Kanban ── */}
      <div className="flex-1 overflow-hidden grid grid-cols-3 gap-0 divide-x divide-zinc-800 min-h-0">

        {/* Columna: Backlog */}
        <div className="p-4 overflow-hidden flex flex-col min-h-0">
          <KanbanColumn
            title="Backlog"
            color="text-zinc-400"
            dotColor="bg-zinc-600"
            tickets={backlog}
            activeTicketId={ticket?.id}
            status="backlog"
          />
        </div>

        {/* Columna: En Progreso */}
        <div className="p-4 overflow-hidden flex flex-col min-h-0 bg-indigo-950/10">
          <KanbanColumn
            title="En Progreso"
            color="text-indigo-400"
            dotColor="bg-indigo-400 animate-pulse"
            tickets={inProgress}
            activeTicketId={ticket?.id}
            status="en_progreso"
          />

          {/* Instrucción si no hay ticket activo */}
          {inProgress.length === 0 && (
            <div className="mt-4 border border-dashed border-indigo-900/50 rounded-xl p-4 text-center">
              <p className="text-[9px] text-indigo-900">
                Esperando que el equipo complete el ticket actual...
              </p>
            </div>
          )}
        </div>

        {/* Columna: Completado */}
        <div className="p-4 overflow-hidden flex flex-col min-h-0">
          <KanbanColumn
            title="Completado"
            color="text-emerald-400"
            dotColor="bg-emerald-500"
            tickets={done}
            activeTicketId={null}
            status="completado"
          />
        </div>
      </div>

      {/* ── Footer: Leyenda ── */}
      <footer className="shrink-0 px-5 py-2.5 border-t border-zinc-800 bg-zinc-900 flex items-center gap-6 text-[9px] text-zinc-700">
        <span>● Activo = ticket que el equipo está resolviendo ahora</span>
        <span>El orden lo determina el servidor automáticamente</span>
        <span className="ml-auto">{tickets.length} escenarios cargados desde JSON</span>
      </footer>
    </div>
  );
}
