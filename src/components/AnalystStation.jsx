"use client";

/**
 * src/components/AnalystStation.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Estación del Analista — "Chef de Requerimientos"
 *
 * El Analista es el ÚNICO jugador que lee el ticket completo (briefing privado).
 * Su trabajo: dictar síntomas y pistas al Buscador por el chat del equipo,
 * SIN revelar directamente la solución.
 *
 * Interfaz dividida en 3 zonas:
 *   IZQUIERDA  — Briefing privado del ticket (solo visible para el Analista)
 *   CENTRO     — Chat del equipo en tiempo real
 *   DERECHA    — Panel de síntomas/pistas rápidas para dictar
 *
 * Props:
 *   activeTicket    : objeto del escenario activo (versión pública, sin solución)
 *   analystBriefing : string con la descripción confidencial (del store)
 *   socket          : instancia socket.io
 *   roomId          : string
 *   playerName      : string
 *   isMyTurn        : boolean
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../store/gameStore";

// ─── Componente: Mensaje del chat ─────────────────────────────────────────────
function ChatMessage({ msg, isOwn }) {
  return (
    <div className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-1.5">
        <span
          className="text-[9px] font-mono font-bold uppercase tracking-wider"
          style={{ color: msg.color || "#a1a1aa" }}
        >
          {msg.senderName}
        </span>
        <span className="text-[9px] text-zinc-700">{msg.time}</span>
      </div>
      <div
        className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${
          isOwn
            ? "bg-amber-600/30 border border-amber-700/50 text-amber-100"
            : msg.isSystem
            ? "bg-zinc-800/60 border border-zinc-700 text-zinc-400 italic"
            : "bg-zinc-800 border border-zinc-700 text-zinc-200"
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

// ─── Componente: Tarjeta de síntoma/pista ─────────────────────────────────────
function HintCard({ hint, onSend }) {
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (sent) return;
    setSent(true);
    onSend(hint);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <button
      onClick={handleSend}
      disabled={sent}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-150 group ${
        sent
          ? "border-amber-700/40 bg-amber-950/20 opacity-60 cursor-default"
          : "border-zinc-700 bg-zinc-900/60 hover:border-amber-700/60 hover:bg-zinc-800/80 cursor-pointer active:scale-[0.98]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-zinc-300 leading-relaxed">{hint}</p>
        <span
          className={`shrink-0 text-[10px] font-mono font-bold transition-colors ${
            sent ? "text-amber-500" : "text-zinc-600 group-hover:text-amber-500"
          }`}
        >
          {sent ? "✓ enviado" : "↗ dictar"}
        </span>
      </div>
    </button>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function AnalystStation({
  activeTicket    = null,
  analystBriefing = null,
  socket          = null,
  roomId          = "DEMO",
  playerName      = "Analista",
  isMyTurn        = true,
}) {
  // Leer del store si no llegan por props
  const storeTicket   = useGameStore((s) => s.activeTicket);
  const storeBriefing = useGameStore((s) => s.analystBriefing);
  const ticket        = activeTicket   ?? storeTicket;
  const briefing      = analystBriefing ?? storeBriefing;

  // ── Estado del chat ─────────────────────────────────────────────────────────
  const [messages,    setMessages]    = useState([]);
  const [inputText,   setInputText]   = useState("");
  const [isSending,   setIsSending]   = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  // Mensaje de bienvenida del sistema
  useEffect(() => {
    setMessages([
      {
        id        : "sys-0",
        senderName: "Sistema",
        text      : "Partida iniciada. Eres el Analista — solo tú puedes leer el briefing confidencial. Dicta síntomas al equipo sin revelar la solución.",
        time      : _time(),
        isSystem  : true,
        color     : "#52525b",
      },
    ]);
  }, [ticket?.id]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Escuchar mensajes de chat del servidor
  useEffect(() => {
    if (!socket) return;

    const onChat = (msg) => {
      setMessages((prev) => [...prev, { ...msg, id: msg.id ?? Date.now() }]);
    };

    socket.on("team:chat_message", onChat);
    return () => socket.off("team:chat_message", onChat);
  }, [socket]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function _time() {
    return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }

  // ── Enviar mensaje de chat ──────────────────────────────────────────────────
  const handleSendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text || isSending) return;

    const msg = {
      id        : Date.now(),
      senderName: playerName,
      text,
      time      : _time(),
      color     : "#f59e0b",
      roomId,
    };

    setIsSending(true);
    setInputText("");

    // Optimistic: mostrar inmediatamente
    setMessages((prev) => [...prev, msg]);

    // Emitir al servidor para broadcast al equipo
    if (socket) {
      socket.emit("team:chat_message", msg);
    }

    setTimeout(() => setIsSending(false), 300);
  }, [inputText, isSending, playerName, roomId, socket]);

  // ── Dictar un síntoma como mensaje de chat ──────────────────────────────────
  const handleDictHint = useCallback((hint) => {
    const msg = {
      id        : Date.now(),
      senderName: playerName,
      text      : `💬 PISTA: "${hint}"`,
      time      : _time(),
      color     : "#f59e0b",
      roomId,
    };

    setMessages((prev) => [...prev, msg]);
    if (socket) socket.emit("team:chat_message", msg);
  }, [playerName, roomId, socket]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-950">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 font-mono text-sm">Esperando ticket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-zinc-950 text-white overflow-hidden font-mono text-xs">

      {/* ══ PANEL IZQUIERDO — Briefing Confidencial ══ */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-900/40">

        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              Analista — Chef de Req.
            </span>
          </div>
          <p className="text-[9px] text-zinc-600 mt-1">Solo tú lees esto</p>
        </div>

        {/* Ticket público */}
        <div className="px-4 py-3 border-b border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Ticket activo</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
              ticket.dificultad === "FÁCIL"   ? "bg-emerald-900/50 text-emerald-400 border-emerald-800" :
              ticket.dificultad === "MEDIA"   ? "bg-amber-900/50   text-amber-400   border-amber-800"   :
              ticket.dificultad === "ALTA"    ? "bg-red-900/50     text-red-400     border-red-800"     :
                                               "bg-purple-900/50  text-purple-400  border-purple-800"
            }`}>
              {ticket.dificultad}
            </span>
          </div>
          <p className="text-[11px] font-bold text-zinc-100 leading-tight">{ticket.nombre}</p>
          <p className="text-[9px] text-zinc-500">{ticket.categoria}</p>

          {/* Restricciones */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-zinc-950/60 rounded px-2 py-1.5">
              <p className="text-[9px] text-zinc-600">Presupuesto</p>
              <p className="text-[10px] font-bold text-amber-400">
                ${ticket.presupuesto_usd?.toLocaleString("es-ES")}
              </p>
            </div>
            <div className="bg-zinc-950/60 rounded px-2 py-1.5">
              <p className="text-[9px] text-zinc-600">Latencia máx</p>
              <p className="text-[10px] font-bold text-sky-400">
                {ticket.latencia_maxima_ms}ms
              </p>
            </div>
          </div>
        </div>

        {/* Descripción pública */}
        <div className="px-4 py-3 border-b border-zinc-800">
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5">
            Descripción del incidente
          </p>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            {ticket.descripcion_publica}
          </p>
        </div>

        {/* Briefing confidencial */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          <button
            onClick={() => setBriefingOpen((v) => !v)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">
                Briefing confidencial
              </span>
            </div>
            <span className="text-[10px] text-zinc-600">{briefingOpen ? "▲" : "▼"}</span>
          </button>

          {briefingOpen && (
            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] text-red-500 font-bold">⚠ SOLO PARA TI</span>
              </div>
              {briefing ? (
                <p className="text-[10px] text-red-200/80 leading-relaxed">
                  {briefing}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {/* Fallback: mostrar síntomas del JSON si no hay briefing del servidor */}
                  {ticket.sintomas_para_buscador?.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-red-600 mt-0.5 shrink-0">▸</span>
                      <p className="text-[10px] text-red-200/70">{s}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Slots a resolver */}
          <div className="mt-3">
            <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5">
              Arquitectura requerida ({ticket.slots_solucion?.length} slots)
            </p>
            <div className="space-y-1">
              {ticket.slots_solucion?.map((slot) => (
                <div key={slot.id} className="flex items-center gap-2 px-2 py-1 bg-zinc-900/60 rounded border border-zinc-800">
                  <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-600 text-[9px] flex items-center justify-center font-bold">
                    {slot.orden}
                  </span>
                  <span className="text-[10px] text-zinc-400">{slot.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ══ PANEL CENTRAL — Chat del Equipo ══ */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Header del chat */}
        <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Chat del Equipo
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-[10px] text-zinc-600">Sala {roomId}</span>
          </div>
          <span className="text-[9px] text-amber-600">
            Dicta síntomas — no nombres la solución
          </span>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              msg={msg}
              isOwn={msg.senderName === playerName}
            />
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input del chat */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/60">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Dicta síntomas al equipo... (Enter para enviar)"
                disabled={!isMyTurn}
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 text-xs resize-none focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || !isMyTurn || isSending}
              className={`px-4 rounded-lg font-bold text-xs transition-all duration-150 self-stretch ${
                inputText.trim() && isMyTurn
                  ? "bg-amber-600 hover:bg-amber-500 text-white active:scale-[0.97]"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              ↗
            </button>
          </div>
          <p className="text-[9px] text-zinc-700 mt-1.5">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </main>

      {/* ══ PANEL DERECHO — Pistas Rápidas ══ */}
      <aside className="w-64 shrink-0 flex flex-col border-l border-zinc-800 bg-zinc-900/40">

        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Pistas rápidas
          </span>
          <p className="text-[9px] text-zinc-700 mt-0.5">
            Clic → se envía al chat automáticamente
          </p>
        </div>

        {/* Lista de síntomas del ticket como botones dictables */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {ticket.sintomas_para_buscador?.length ? (
            <>
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider px-1 mb-1">
                Síntomas del ticket
              </p>
              {ticket.sintomas_para_buscador.map((hint, i) => (
                <HintCard key={i} hint={hint} onSend={handleDictHint} />
              ))}
            </>
          ) : (
            <p className="text-[10px] text-zinc-700 text-center py-4">
              Sin pistas predefinidas para este ticket.
            </p>
          )}

          {/* Separador */}
          <div className="h-px bg-zinc-800 my-3" />

          {/* Pistas genéricas útiles */}
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider px-1 mb-1">
            Frases útiles
          </p>
          {[
            "Busca en el área de Operations",
            "Busca en Risk & Compliance",
            "Busca en Customer Management",
            "El tipo es SERVICIO BIAN",
            "El tipo es GATEWAY",
            "El tipo es ADAPTADOR LEGACY",
            "El riesgo del componente es BAJO",
            "El riesgo del componente es ALTO",
            "El costo es menor a $4.000",
            "La latencia es menor a 100ms",
          ].map((hint, i) => (
            <HintCard key={`generic-${i}`} hint={hint} onSend={handleDictHint} />
          ))}
        </div>

        {/* Footer de estado */}
        <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isMyTurn ? "bg-amber-400" : "bg-zinc-600"}`} />
            <span className="text-[9px] text-zinc-600">
              {isMyTurn ? "Turno activo" : "Esperando"}
            </span>
          </div>
          <span className="text-[9px] text-zinc-800">{roomId}</span>
        </div>
      </aside>
    </div>
  );
}
