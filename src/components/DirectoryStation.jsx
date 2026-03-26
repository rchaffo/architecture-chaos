"use client";

import React from "react";

/**
 * DirectoryStation.jsx — Architecture Chaos
 * ─────────────────────────────────────────────────────────────────────────────
 * Estación del Buscador (Navegador de Directorio).
 * Interfaz nativa tipo terminal/dashboard. Sin iframes, sin páginas externas.
 *
 * Características:
 *  - Búsqueda en tiempo real (nombre, descripción, tags)
 *  - Filtros por Business Area, Tipo de Componente y Nivel de Riesgo
 *  - Ordenación por columna (costo, latencia, riesgo)
 *  - Vista dual: tabla densa (modo terminal) ↔ tarjetas expandidas
 *  - Botón "Enviar al Integrador" con confirmación visual
 *  - Data-Driven: lee 100% del JSON, sin constantes hardcodeadas
 *  - Socket.io: emite evento "buscador:send_component" al Integrador
 *
 * Props:
 *  @param {Array}    components   - gameConfig.directorio_componentes
 *  @param {Object}   activeTicket - escenario activo (para hint de slots disponibles)
 *  @param {Object}   socket       - instancia de socket.io-client
 *  @param {string}   roomId       - ID de la sala actual
 *  @param {boolean}  isMyTurn     - true si este cliente es el Buscador activo
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formatea USD sin decimales */
const fmtUSD = (n) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

/** Clase CSS para badge de riesgo */
const riskBadge = {
  BAJO:  "bg-emerald-900/60 text-emerald-300 border border-emerald-700",
  MEDIO: "bg-amber-900/60  text-amber-300  border border-amber-700",
  ALTO:  "bg-red-900/60    text-red-300    border border-red-700",
};

/** Clase CSS para badge de tipo */
const typeBadge = {
  GATEWAY:          "bg-indigo-900/60 text-indigo-300 border border-indigo-700",
  SERVICIO_BIAN:    "bg-teal-900/60   text-teal-300   border border-teal-700",
  ADAPTADOR_LEGACY: "bg-zinc-800/80   text-zinc-300   border border-zinc-600",
  SERVICIO_REGULATORIO: "bg-purple-900/60 text-purple-300 border border-purple-700",
  SERVICIO_FINANCIERO:  "bg-sky-900/60    text-sky-300    border border-sky-700",
};

// ─── Mini-componente: forma geométrica del componente ─────────────────────────
function ComponentShape({ shape, color, size = 16 }) {
  const s = size;
  const c = color || "#6366F1";
  const shapes = {
    hexagon: (
      <svg width={s} height={s} viewBox="0 0 16 16">
        <polygon
          points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5"
          fill={c}
          opacity="0.7"
        />
      </svg>
    ),
    circle: (
      <svg width={s} height={s} viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" fill={c} opacity="0.7" />
      </svg>
    ),
    square: (
      <svg width={s} height={s} viewBox="0 0 16 16">
        <rect x="2" y="2" width="12" height="12" rx="2" fill={c} opacity="0.7" />
      </svg>
    ),
    diamond: (
      <svg width={s} height={s} viewBox="0 0 16 16">
        <polygon points="8,1 15,8 8,15 1,8" fill={c} opacity="0.7" />
      </svg>
    ),
  };
  return shapes[shape] || shapes.circle;
}

// ─── Mini-componente: fila expandida de detalle ───────────────────────────────
function ComponentDetail({ comp, onSend, isSent, isMyTurn }) {
  return (
    <div className="bg-gray-900 border-t border-gray-700 px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
      {/* Descripción técnica */}
      <div className="md:col-span-2 space-y-2">
        <p className="text-gray-300 leading-relaxed">{comp.descripcion_tecnica}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {comp.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Panel derecho: cumplimiento + acción */}
      <div className="space-y-3">
        {/* Cumplimiento */}
        <div>
          <p className="text-gray-500 mb-1 uppercase tracking-wider text-[10px]">
            Cumplimiento
          </p>
          <div className="flex flex-wrap gap-1">
            {comp.cumplimiento.map((c) => (
              <span
                key={c}
                className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Patrón BIAN */}
        <div>
          <p className="text-gray-500 mb-1 uppercase tracking-wider text-[10px]">
            Patrón Funcional BIAN
          </p>
          <span className="text-teal-400 font-mono">{comp.patron_funcional}</span>
        </div>

        {/* Botón enviar */}
        <button
          onClick={() => onSend(comp)}
          disabled={!isMyTurn || isSent}
          className={[
            "w-full mt-1 py-2 rounded-lg font-bold text-xs tracking-wide transition-all duration-200",
            isSent
              ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600 cursor-not-allowed"
              : !isMyTurn
              ? "bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700"
              : "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 active:scale-[0.98] shadow-lg shadow-emerald-900/30",
          ].join(" ")}
        >
          {isSent
            ? "✓ Enviado al Integrador"
            : !isMyTurn
            ? "Esperando turno..."
            : "⬆ Enviar al Integrador"}
        </button>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function DirectoryStation({
  components = [],
  activeTicket = null,
  socket = null,
  roomId = "",
  isMyTurn = true, // default true para desarrollo standalone
}) {
  // — Estado de UI —
  const [searchQuery, setSearchQuery]     = useState("");
  const [filterArea, setFilterArea]       = useState("ALL");
  const [filterType, setFilterType]       = useState("ALL");
  const [filterRisk, setFilterRisk]       = useState("ALL");
  const [sortKey, setSortKey]             = useState("nombre");
  const [sortDir, setSortDir]             = useState("asc");
  const [viewMode, setViewMode]           = useState("table"); // "table" | "cards"
  const [expandedId, setExpandedId]       = useState(null);
  const [sentComponents, setSentComponents] = useState(new Set());
  const [sendFeedback, setSendFeedback]   = useState(null); // { id, nombre }
  const [highlightId, setHighlightId]     = useState(null);

  const searchRef = useRef(null);

  // Focus automático al montar
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Limpiar feedback visual tras 3s
  useEffect(() => {
    if (!sendFeedback) return;
    const t = setTimeout(() => setSendFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [sendFeedback]);

  // ── Derivar listas únicas de filtros desde el JSON ─────────────────────────
  const businessAreas = useMemo(
    () => ["ALL", ...new Set(components.map((c) => c.business_area).filter(Boolean))],
    [components]
  );
  const componentTypes = useMemo(
    () => ["ALL", ...new Set(components.map((c) => c.tipo).filter(Boolean))],
    [components]
  );
  const riskLevels = ["ALL", "BAJO", "MEDIO", "ALTO"];

  // ── Filtrado + búsqueda + ordenación ──────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    let result = components.filter((comp) => {
      // Filtro área
      if (filterArea !== "ALL" && comp.business_area !== filterArea) return false;
      // Filtro tipo
      if (filterType !== "ALL" && comp.tipo !== filterType) return false;
      // Filtro riesgo
      if (filterRisk !== "ALL" && comp.nivel_riesgo !== filterRisk) return false;
      // Búsqueda libre
      if (q) {
        const searchable = [
          comp.nombre,
          comp.descripcion_corta,
          comp.dominio_bian,
          comp.fabricante,
          comp.version,
          ...(comp.tags || []),
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });

    // Ordenación
    result = [...result].sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [components, searchQuery, filterArea, filterType, filterRisk, sortKey, sortDir]);

  // ── Estadísticas del conjunto filtrado ────────────────────────────────────
  const stats = useMemo(() => ({
    count: filtered.length,
    totalCost: filtered.reduce((s, c) => s + c.costo_usd, 0),
    avgLatency: filtered.length
      ? Math.round(filtered.reduce((s, c) => s + c.latencia_add_ms, 0) / filtered.length)
      : 0,
  }), [filtered]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSort = useCallback((key) => {
    setSortKey((prev) => {
      if (prev === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else setSortDir("asc");
      return key;
    });
  }, []);

  const handleSend = useCallback(
    (comp) => {
      if (!isMyTurn) return;

      // Feedback visual inmediato
      setSentComponents((prev) => new Set(prev).add(comp.id));
      setSendFeedback({ id: comp.id, nombre: comp.nombre });
      setHighlightId(comp.id);
      setTimeout(() => setHighlightId(null), 1200);

      // Emitir evento Socket.io al Integrador
      if (socket) {
        socket.emit("buscador:send_component", {
          roomId,
          componentId: comp.id,
          componentData: comp,
        });
      } else {
        // Modo standalone/desarrollo: log en consola
        console.log("[DirectoryStation] Enviando al Integrador:", comp.id, comp.nombre);
      }
    },
    [isMyTurn, socket, roomId]
  );

  const handleToggleExpand = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterArea("ALL");
    setFilterType("ALL");
    setFilterRisk("ALL");
    searchRef.current?.focus();
  }, []);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="text-gray-700 ml-1">⇅</span>;
    return (
      <span className="text-emerald-400 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  };

  const hasFilters =
    searchQuery || filterArea !== "ALL" || filterType !== "ALL" || filterRisk !== "ALL";

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-950 text-white font-mono text-xs select-none">

      {/* ── Header de estación ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          {/* Indicador de rol */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">
              Directorio — Buscador
            </span>
          </div>
          <span className="text-gray-700">|</span>
          <span className="text-gray-500">{components.length} componentes en sistema</span>
        </div>

        {/* Selector de vista */}
        <div className="flex items-center gap-1 bg-gray-800 rounded p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={`px-2.5 py-1 rounded text-[10px] transition-colors ${
              viewMode === "table"
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            ▤ Tabla
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-2.5 py-1 rounded text-[10px] transition-colors ${
              viewMode === "cards"
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            ▦ Tarjetas
          </button>
        </div>
      </div>

      {/* ── Contexto del ticket activo (pistas del Analista) ── */}
      {activeTicket && (
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-900/50">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 shrink-0">▸</span>
            <div>
              <span className="text-amber-400 font-bold">TICKET ACTIVO:</span>{" "}
              <span className="text-amber-200">{activeTicket.nombre}</span>
              <span className="text-amber-600 ml-2">
                — Slots requeridos: {Object.keys(activeTicket.slots_solucion || {}).length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Barra de búsqueda + filtros ── */}
      <div className="px-4 py-3 bg-gray-900/80 border-b border-gray-800 space-y-2">
        {/* Búsqueda */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            ⌕
          </span>
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar por nombre, dominio BIAN, tag, fabricante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-10 py-2 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros en línea */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Business Area */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600 text-[10px]">ÁREA</span>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300 text-[10px] focus:outline-none focus:border-emerald-600"
            >
              {businessAreas.map((a) => (
                <option key={a} value={a}>
                  {a === "ALL" ? "Todas las áreas" : a}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600 text-[10px]">TIPO</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300 text-[10px] focus:outline-none focus:border-emerald-600"
            >
              {componentTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "ALL" ? "Todos los tipos" : t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Riesgo */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600 text-[10px]">RIESGO</span>
            <div className="flex rounded overflow-hidden border border-gray-700">
              {riskLevels.map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRisk(r)}
                  className={`px-2.5 py-1 text-[10px] transition-colors ${
                    filterRisk === r
                      ? r === "ALL"
                        ? "bg-gray-600 text-white"
                        : r === "BAJO"
                        ? "bg-emerald-700 text-white"
                        : r === "MEDIO"
                        ? "bg-amber-700 text-white"
                        : "bg-red-800 text-white"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {r === "ALL" ? "Todos" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Limpiar */}
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="ml-auto text-[10px] text-gray-500 hover:text-red-400 transition-colors"
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>

        {/* Stats de la búsqueda actual */}
        <div className="flex items-center gap-4 text-[10px] text-gray-600 pt-0.5">
          <span>
            <span className="text-emerald-400 font-bold">{stats.count}</span>{" "}
            resultado{stats.count !== 1 ? "s" : ""}
          </span>
          <span>Costo total: <span className="text-yellow-500">{fmtUSD(stats.totalCost)}</span></span>
          <span>Latencia promedio: <span className="text-blue-400">{stats.avgLatency}ms</span></span>
          {sentComponents.size > 0 && (
            <span className="ml-auto text-emerald-600">
              {sentComponents.size} enviado{sentComponents.size !== 1 ? "s" : ""} al Integrador
            </span>
          )}
        </div>
      </div>

      {/* ── Feedback de envío ── */}
      {sendFeedback && (
        <div className="mx-4 mt-2 px-3 py-2 bg-emerald-900/50 border border-emerald-700 rounded-lg flex items-center gap-2 text-emerald-300 text-xs animate-pulse">
          <span>▲</span>
          <span>
            <strong>{sendFeedback.nombre}</strong> enviado al Integrador
          </span>
        </div>
      )}

      {/* ── Cuerpo: Vista Tabla ── */}
      {viewMode === "table" && (
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-700 gap-2">
              <span className="text-2xl">∅</span>
              <span>Sin resultados. Modifica los filtros de búsqueda.</span>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-900 border-b border-gray-800">
                  {/* Columna expansión */}
                  <th className="w-6 px-2 py-2" />
                  {/* ID */}
                  <th className="px-3 py-2 text-left text-[10px] text-gray-500 uppercase tracking-widest w-20">
                    ID
                  </th>
                  {/* Nombre */}
                  <th
                    className="px-3 py-2 text-left text-[10px] text-gray-500 uppercase tracking-widest cursor-pointer hover:text-gray-300 transition-colors"
                    onClick={() => handleSort("nombre")}
                  >
                    Nombre <SortIcon col="nombre" />
                  </th>
                  {/* Dominio */}
                  <th className="px-3 py-2 text-left text-[10px] text-gray-500 uppercase tracking-widest hidden lg:table-cell">
                    Dominio BIAN
                  </th>
                  {/* Tipo */}
                  <th className="px-3 py-2 text-left text-[10px] text-gray-500 uppercase tracking-widest hidden md:table-cell">
                    Tipo
                  </th>
                  {/* Costo */}
                  <th
                    className="px-3 py-2 text-right text-[10px] text-gray-500 uppercase tracking-widest cursor-pointer hover:text-gray-300 transition-colors w-24"
                    onClick={() => handleSort("costo_usd")}
                  >
                    Costo <SortIcon col="costo_usd" />
                  </th>
                  {/* Latencia */}
                  <th
                    className="px-3 py-2 text-right text-[10px] text-gray-500 uppercase tracking-widest cursor-pointer hover:text-gray-300 transition-colors w-24"
                    onClick={() => handleSort("latencia_add_ms")}
                  >
                    +ms <SortIcon col="latencia_add_ms" />
                  </th>
                  {/* Riesgo */}
                  <th className="px-3 py-2 text-center text-[10px] text-gray-500 uppercase tracking-widest w-20">
                    Riesgo
                  </th>
                  {/* Acción */}
                  <th className="px-3 py-2 w-32" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((comp, idx) => {
                  const isExpanded = expandedId === comp.id;
                  const isSent = sentComponents.has(comp.id);
                  const isHighlighted = highlightId === comp.id;

                  return (
                    <React.Fragment key={comp.id}>
                      <tr
                        key={comp.id}
                        className={[
                          "border-b border-gray-800/60 cursor-pointer transition-colors group",
                          idx % 2 === 0 ? "bg-gray-950" : "bg-gray-900/30",
                          isExpanded ? "bg-gray-900/70" : "hover:bg-gray-900/60",
                          isHighlighted ? "bg-emerald-950/40" : "",
                          isSent ? "opacity-60" : "",
                        ].join(" ")}
                        onClick={() => handleToggleExpand(comp.id)}
                      >
                        {/* Expansión toggle */}
                        <td className="px-2 py-2.5 text-center text-gray-600">
                          <span className="text-[10px]">
                            {isExpanded ? "▼" : "▶"}
                          </span>
                        </td>

                        {/* ID */}
                        <td className="px-3 py-2.5">
                          <span className="text-gray-600 font-mono text-[10px]">
                            {comp.id}
                          </span>
                        </td>

                        {/* Nombre + icono */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <ComponentShape
                              shape={comp.forma_ui}
                              color={comp.color_ui}
                              size={14}
                            />
                            <div>
                              <p className="text-white font-bold text-xs leading-tight">
                                {comp.nombre}
                              </p>
                              <p className="text-gray-500 text-[10px] leading-tight truncate max-w-[200px]">
                                {comp.version}
                              </p>
                            </div>
                            {isSent && (
                              <span className="ml-1 text-emerald-400 text-[10px]">✓</span>
                            )}
                          </div>
                        </td>

                        {/* Dominio BIAN */}
                        <td className="px-3 py-2.5 hidden lg:table-cell">
                          <span className="text-teal-400 text-[10px]">
                            {comp.dominio_bian}
                          </span>
                        </td>

                        {/* Tipo */}
                        <td className="px-3 py-2.5 hidden md:table-cell">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              typeBadge[comp.tipo] || "bg-gray-800 text-gray-400 border border-gray-700"
                            }`}
                          >
                            {comp.tipo.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Costo */}
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-yellow-400 font-bold">
                            {fmtUSD(comp.costo_usd)}
                          </span>
                        </td>

                        {/* Latencia */}
                        <td className="px-3 py-2.5 text-right">
                          <span
                            className={
                              comp.latencia_add_ms > 200
                                ? "text-red-400"
                                : comp.latencia_add_ms > 100
                                ? "text-amber-400"
                                : "text-blue-400"
                            }
                          >
                            +{comp.latencia_add_ms}ms
                          </span>
                        </td>

                        {/* Riesgo */}
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              riskBadge[comp.nivel_riesgo] || "bg-gray-800 text-gray-400"
                            }`}
                          >
                            {comp.nivel_riesgo}
                          </span>
                        </td>

                        {/* Botón enviar rápido */}
                        <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleSend(comp)}
                            disabled={!isMyTurn || isSent}
                            title={isSent ? "Ya enviado" : "Enviar al Integrador"}
                            className={[
                              "px-3 py-1.5 rounded text-[10px] font-bold transition-all duration-150",
                              isSent
                                ? "text-emerald-600 cursor-default"
                                : !isMyTurn
                                ? "text-gray-700 cursor-not-allowed"
                                : "text-emerald-400 hover:bg-emerald-900/40 hover:text-emerald-300 border border-transparent hover:border-emerald-800 active:scale-95",
                            ].join(" ")}
                          >
                            {isSent ? "✓ Enviado" : "⬆ Enviar"}
                          </button>
                        </td>
                      </tr>

                      {/* Fila de detalle expandible */}
                      {isExpanded && (
                        <tr key={`${comp.id}-detail`} className="border-b border-gray-700">
                          <td colSpan={9} className="p-0">
                            <ComponentDetail
                              comp={comp}
                              onSend={handleSend}
                              isSent={isSent}
                              isMyTurn={isMyTurn}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Cuerpo: Vista Tarjetas ── */}
      {viewMode === "cards" && (
        <div className="flex-1 overflow-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-700 gap-2">
              <span className="text-2xl">∅</span>
              <span>Sin resultados. Modifica los filtros.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((comp) => {
                const isSent = sentComponents.has(comp.id);
                const isHighlighted = highlightId === comp.id;

                return (
                  <div
                    key={comp.id}
                    className={[
                      "rounded-xl border transition-all duration-200",
                      isSent
                        ? "border-emerald-700/40 bg-gray-900/40 opacity-70"
                        : isHighlighted
                        ? "border-emerald-500 bg-emerald-950/30"
                        : "border-gray-800 bg-gray-900/60 hover:border-gray-600 hover:bg-gray-900/80",
                    ].join(" ")}
                  >
                    {/* Card header */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ComponentShape
                            shape={comp.forma_ui}
                            color={comp.color_ui}
                            size={16}
                          />
                          <div>
                            <p className="text-white font-bold text-xs leading-tight">
                              {comp.nombre}
                            </p>
                            <p className="text-[10px] text-gray-500 leading-tight">
                              {comp.id}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${
                            riskBadge[comp.nivel_riesgo] || ""
                          }`}
                        >
                          {comp.nivel_riesgo}
                        </span>
                      </div>

                      {/* Dominio BIAN */}
                      <p className="text-teal-400 text-[10px]">{comp.dominio_bian}</p>

                      {/* Descripción corta */}
                      <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-2">
                        {comp.descripcion_corta}
                      </p>

                      {/* Métricas */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="text-center">
                          <p className="text-[9px] text-gray-600 uppercase">Costo</p>
                          <p className="text-yellow-400 font-bold text-xs">
                            {fmtUSD(comp.costo_usd)}
                          </p>
                        </div>
                        <div className="h-6 w-px bg-gray-800" />
                        <div className="text-center">
                          <p className="text-[9px] text-gray-600 uppercase">Latencia</p>
                          <p
                            className={`font-bold text-xs ${
                              comp.latencia_add_ms > 200
                                ? "text-red-400"
                                : comp.latencia_add_ms > 100
                                ? "text-amber-400"
                                : "text-blue-400"
                            }`}
                          >
                            +{comp.latencia_add_ms}ms
                          </p>
                        </div>
                        <div className="h-6 w-px bg-gray-800" />
                        <div className="text-center">
                          <p className="text-[9px] text-gray-600 uppercase">Patrón</p>
                          <p className="text-gray-300 text-[10px]">
                            {comp.patron_funcional}
                          </p>
                        </div>
                      </div>

                      {/* Tags preview */}
                      <div className="flex flex-wrap gap-1">
                        {comp.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700 text-[9px]"
                          >
                            {tag}
                          </span>
                        ))}
                        {comp.tags.length > 4 && (
                          <span className="text-[9px] text-gray-700">
                            +{comp.tags.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card footer: acciones */}
                    <div className="border-t border-gray-800 px-3 py-2 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleExpand(comp.id)}
                        className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {expandedId === comp.id ? "▲ Menos" : "▼ Detalle técnico"}
                      </button>
                      <button
                        onClick={() => handleSend(comp)}
                        disabled={!isMyTurn || isSent}
                        className={[
                          "px-3 py-1.5 rounded text-[10px] font-bold transition-all duration-150",
                          isSent
                            ? "text-emerald-600 cursor-default"
                            : !isMyTurn
                            ? "text-gray-700 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95",
                        ].join(" ")}
                      >
                        {isSent ? "✓ Enviado" : "⬆ Enviar al Integrador"}
                      </button>
                    </div>

                    {/* Detalle expandido en modo tarjeta */}
                    {expandedId === comp.id && (
                      <div className="border-t border-gray-700 px-3 py-3 space-y-2">
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                          {comp.descripcion_tecnica}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {comp.cumplimiento.map((c) => (
                            <span
                              key={c}
                              className="px-1.5 py-0.5 rounded text-[9px] bg-blue-950 text-blue-300 border border-blue-800"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Footer de estado ── */}
      <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-gray-600">
          <span>
            {sentComponents.size}/{components.length} enviados
          </span>
          <span className="text-gray-800">·</span>
          <span>
            {isMyTurn ? (
              <span className="text-emerald-500">● Turno activo</span>
            ) : (
              <span className="text-gray-600">○ Esperando turno</span>
            )}
          </span>
        </div>
        <div className="text-[10px] text-gray-700 font-mono">
          {roomId ? `SALA ${roomId}` : "MODO STANDALONE"}
        </div>
      </div>
    </div>
  );
}

// ─── Wrapper de demostración standalone ──────────────────────────────────────
/**
 * Uso standalone para desarrollo y demo:
 *
 *   import DirectoryStation from "@/components/game/stations/DirectoryStation";
 *   import gameConfig from "@/public/configuracion_juego.json";
 *
 *   <DirectoryStation
 *     components={gameConfig.directorio_componentes}
 *     activeTicket={gameConfig.escenarios[0]}
 *     socket={socket}
 *     roomId="ABC123"
 *     isMyTurn={true}
 *   />
 */
