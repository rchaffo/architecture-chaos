"use client";

/**
 * src/app/manual/page.js
 * Manual visual interactivo con capturas reales y anotaciones por rol.
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ─── Datos de cada rol ────────────────────────────────────────────────────────
const ROLES = [
  {
    id         : "project_manager",
    nombre     : "Project Manager",
    alias      : "Triage Controller",
    color      : "#6366F1",
    screenshot : "/screenshot_pm.png",
    resumen    : "Ves el panorama completo. Tu pantalla es un tablero Kanban con los 5 tickets organizados en columnas. No resuelves tickets directamente — tu rol es monitorear, comunicar y alertar al equipo.",
    anotaciones: [
      { id: "a1", top: "7%",  left: "2%",  ancho: "59%", alto: "4%",  color: "#ef4444", label: "① Medidor de Pánico — si llega al 100% el equipo pierde", labelPos: "right" },
      { id: "a2", top: "13%", left: "2%",  ancho: "59%", alto: "3.5%",color: "#6366F1", label: "② Resumen: total, en progreso, backlog",                  labelPos: "right" },
      { id: "a3", top: "18%", left: "1%",  ancho: "29%", alto: "78%", color: "#888780", label: "③ Backlog — tickets pendientes con dificultad y presupuesto", labelPos: "right" },
      { id: "a4", top: "18%", left: "30%", ancho: "58%", alto: "42%", color: "#6366F1", label: "④ En Progreso — ticket ACTIVO que el equipo resuelve ahora",  labelPos: "right" },
      { id: "a5", top: "1%",  left: "91%", ancho: "8%",  alto: "5%",  color: "#f59e0b", label: "⑤ Score acumulado del equipo",                              labelPos: "left"  },
    ],
    pasos: [
      { num: "①", titulo: "Medidor de Pánico",    desc: "Barra roja en la parte superior. Si llega al 100% el equipo pierde. Avisa cuando supere el 50%." },
      { num: "②", titulo: "Ticket ACTIVO",        desc: "En la columna 'En Progreso' con badge azul. Es el que el equipo está resolviendo ahora mismo." },
      { num: "③", titulo: "Backlog",              desc: "Tickets pendientes. Cada tarjeta muestra dificultad, presupuesto, slots requeridos y puntos base." },
      { num: "④", titulo: "Score",                desc: "Puntos del equipo arriba a la derecha. Sube cuando el Integrador despliega una solución correcta." },
    ],
    tips: [
      "Avisa cuando el Pánico supere el 50%",
      "Informa cuántos tickets quedan",
      "Recuerda al equipo el presupuesto y tiempo de cada ticket",
    ],
  },
  {
    id         : "analista",
    nombre     : "Analista",
    alias      : "Chef de Requerimientos",
    color      : "#F59E0B",
    screenshot : "/screenshot_analista.png",
    resumen    : "Eres el ÚNICO que conoce la solución completa. Tienes 3 paneles: el briefing confidencial (izquierda), el chat del equipo (centro) y las pistas rápidas (derecha). Tu trabajo es dictar síntomas SIN revelar los nombres de los componentes.",
    anotaciones: [
      { id: "b1", top: "0%",  left: "0%",  ancho: "22%", alto: "100%", color: "#f59e0b", label: "① Panel izquierdo — briefing confidencial del ticket", labelPos: "right" },
      { id: "b2", top: "60%", left: "1%",  ancho: "21%", alto: "37%",  color: "#ef4444", label: "② SOLO PARA TI — la solución completa con los 4 componentes", labelPos: "right" },
      { id: "b3", top: "0%",  left: "22%", ancho: "64%", alto: "100%", color: "#10b981", label: "③ Chat del equipo — dicta síntomas aquí",               labelPos: "right" },
      { id: "b4", top: "91%", left: "22%", ancho: "64%", alto: "8%",   color: "#10b981", label: "④ Input del chat — escribe y presiona Enter",            labelPos: "right" },
      { id: "b5", top: "0%",  left: "86%", ancho: "14%", alto: "100%", color: "#a78bfa", label: "⑤ Pistas rápidas — clic para dictar al chat automáticamente", labelPos: "left" },
    ],
    pasos: [
      { num: "①", titulo: "Lee el Briefing",    desc: "Panel rojo izquierdo. Solo tú lo ves. Tiene los 4 componentes exactos en orden con presupuesto y latencia." },
      { num: "②", titulo: "Observa los Slots",  desc: "Debajo del briefing ves los 4 slots del Integrador. Sus nombres te indican qué tipo de componente va en cada uno." },
      { num: "③", titulo: "Dicta en el Chat",   desc: "Describe el PROBLEMA que resuelve cada componente. NUNCA su nombre exacto. Ej: 'busca algo que traduzca SOAP a REST'." },
      { num: "④", titulo: "Pistas Rápidas",     desc: "Panel derecho con botones predefinidos. Haz clic en uno y se envía al chat del equipo automáticamente." },
    ],
    tips: [
      "Describe el problema, no el nombre del componente",
      "Da pistas del área: 'busca en Risk & Compliance'",
      "Menciona características: 'latencia baja', 'tipo GATEWAY', 'riesgo BAJO'",
    ],
  },
  {
    id         : "buscador",
    nombre     : "Buscador",
    alias      : "Navegador de Directorio",
    color      : "#10B981",
    screenshot : "/screenshot_buscador.png",
    resumen    : "Operas el directorio de 18 Service Domains BIAN. Escuchas las pistas del Analista, filtras los componentes correctos y los envías al Integrador.",
    anotaciones: [
      { id: "c1", top: "5%",  left: "0%",  ancho: "52%", alto: "3.5%", color: "#f59e0b", label: "① Ticket activo y slots requeridos",                       labelPos: "right" },
      { id: "c2", top: "9%",  left: "0%",  ancho: "99%", alto: "5%",   color: "#10b981", label: "② Barra de búsqueda — escribe palabras clave aquí",         labelPos: "right" },
      { id: "c3", top: "14%", left: "0%",  ancho: "45%", alto: "4%",   color: "#6366F1", label: "③ Filtros: Área, Tipo y Riesgo",                            labelPos: "right" },
      { id: "c4", top: "20%", left: "0%",  ancho: "99%", alto: "76%",  color: "#a78bfa", label: "④ 18 Service Domains BIAN — clic en fila para expandir detalles", labelPos: "right" },
      { id: "c5", top: "20%", left: "90%", ancho: "9%",  alto: "4.5%", color: "#ef4444", label: "⑤ Botón Enviar al Integrador",                              labelPos: "left"  },
    ],
    pasos: [
      { num: "①", titulo: "Escucha al Analista", desc: "Escucha las pistas del chat. Usa esas palabras clave para buscar en el directorio." },
      { num: "②", titulo: "Busca y filtra",      desc: "Escribe en la barra o usa los filtros de Área (Operations, Risk...), Tipo y Riesgo." },
      { num: "③", titulo: "Expande detalles",    desc: "Clic en cualquier fila para ver descripción técnica, costo exacto, latencia adicional y certificaciones." },
      { num: "④", titulo: "Envía al Integrador", desc: "Clic en 'Enviar'. El componente aparece en el Inbox del Integrador. Envía 1-2 candidatos por pista, no todos." },
    ],
    tips: [
      "Ordena por costo o latencia para no sobrepasar los límites",
      "Si el Analista dice 'Risk & Compliance', filtra por esa área primero",
      "No inundes el Inbox — el Integrador se confunde con demasiadas piezas",
    ],
  },
  {
    id         : "integrador",
    nombre     : "Integrador",
    alias      : "Ensamblador de Arquitectura",
    color      : "#EF4444",
    screenshot : "/screenshot_integrador.png",
    resumen    : "Ensamblas la solución final. Recibes piezas del Buscador en el Inbox y las colocas en los slots del Blueprint Canvas, vigilando que el presupuesto y la latencia no superen los límites del ticket.",
    anotaciones: [
      { id: "d1", top: "13%", left: "0%",  ancho: "54%", alto: "8%",   color: "#38bdf8", label: "① Gauge Presupuesto — si se pone rojo no puedes desplegar",  labelPos: "right" },
      { id: "d2", top: "13%", left: "55%", ancho: "44%", alto: "8%",   color: "#10b981", label: "② Gauge Latencia — suma de ms de todos los componentes",      labelPos: "right" },
      { id: "d3", top: "1%",  left: "87%", ancho: "12%", alto: "12%",  color: "#f59e0b", label: "③ Timer — tiempo límite del ticket",                          labelPos: "left"  },
      { id: "d4", top: "21%", left: "0%",  ancho: "90%", alto: "76%",  color: "#a78bfa", label: "④ Blueprint Canvas — slots vacíos donde colocar las piezas",  labelPos: "right" },
      { id: "d5", top: "21%", left: "91%", ancho: "8%",  alto: "76%",  color: "#ef4444", label: "⑤ Inbox — piezas recibidas del Buscador",                     labelPos: "left"  },
      { id: "d6", top: "94%", left: "0%",  ancho: "90%", alto: "5%",   color: "#10b981", label: "⑥ Botón Deploy — se activa verde cuando todo está correcto",   labelPos: "right" },
    ],
    pasos: [
      { num: "①", titulo: "Revisa el Inbox",       desc: "Panel derecho con las piezas del Buscador. Cada tarjeta muestra nombre, dominio BIAN, costo y latencia." },
      { num: "②", titulo: "Ensambla los Slots",    desc: "Clic en una pieza del Inbox para seleccionarla, luego clic en el slot vacío donde quieres colocarla." },
      { num: "③", titulo: "Vigila los Gauges",     desc: "Presupuesto y Latencia arriba. Si se ponen rojos y parpadean, cambia alguna pieza por una más económica o rápida." },
      { num: "④", titulo: "Despliega la Solución", desc: "Cuando todos los slots estén llenos y los gauges estén verdes, el botón Deploy se activa. Haz clic para validar." },
    ],
    tips: [
      "El nombre de cada slot te indica qué tipo de componente va ahí",
      "Puedes remover y reemplazar piezas antes de desplegar",
      "Coordina con el Analista si no estás seguro del orden",
    ],
  },
];

// ─── Componente de anotación sobre la imagen ──────────────────────────────────
function Annotation({ ann }) {
  return (
    <div
      style={{
        position : "absolute",
        top      : ann.top,
        left     : ann.left,
        width    : ann.ancho,
        height   : ann.alto,
        border   : `2px solid ${ann.color}`,
        borderRadius: "4px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position  : "absolute",
          top       : "50%",
          transform : "translateY(-50%)",
          ...(ann.labelPos === "right"
            ? { left: "calc(100% + 6px)" }
            : { right: "calc(100% + 6px)" }),
          background : ann.color,
          color      : "#fff",
          fontSize   : "9px",
          fontWeight : "600",
          padding    : "3px 7px",
          borderRadius: "4px",
          whiteSpace  : "nowrap",
          lineHeight  : "1.3",
          maxWidth    : "200px",
          whiteSpace  : "normal",
        }}
      >
        {ann.label}
      </div>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function ManualPage() {
  const [rolActivo, setRolActivo] = useState("project_manager");
  const rol = ROLES.find((r) => r.id === rolActivo);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-black">
            <span className="text-indigo-400">Architecture</span>{" "}
            <span className="text-red-400">Chaos</span>
            <span className="text-zinc-600 font-normal text-sm ml-2">— Manual del Juego</span>
          </h1>
          <div className="flex gap-3">
            <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors px-3 py-1.5 border border-zinc-800 rounded-lg">
              ← Lobby
            </Link>
            <Link href="/auditoria" className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors px-3 py-1.5 border border-zinc-800 rounded-lg">
              Modo Auditoría
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">

        {/* Intro */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Guía rápida por rol</h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
            Selecciona tu rol para ver exactamente qué hace tu pantalla y cómo jugar.
            Cada jugador solo necesita leer su pestaña — 2 minutos antes de empezar.
          </p>
        </div>

        {/* Tabs de roles */}
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRolActivo(r.id)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all border-2"
              style={
                rolActivo === r.id
                  ? { background: r.color, borderColor: r.color, color: "#fff" }
                  : { background: "transparent", borderColor: "#3f3f46", color: "#71717a" }
              }
            >
              {r.nombre}
            </button>
          ))}
        </div>

        {/* Panel del rol activo */}
        {rol && (
          <div className="space-y-6">

            {/* Descripción del rol */}
            <div
              className="p-4 rounded-xl border text-sm leading-relaxed"
              style={{ borderColor: `${rol.color}40`, background: `${rol.color}10`, color: "#d4d4d8" }}
            >
              <span className="font-bold" style={{ color: rol.color }}>{rol.nombre} — {rol.alias}:</span>{" "}
              {rol.resumen}
            </div>

            {/* Imagen anotada */}
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Tu pantalla</p>
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <img
                  src={rol.screenshot}
                  alt={`Pantalla del ${rol.nombre}`}
                  className="w-full block"
                  style={{ opacity: 0.75 }}
                />
                {/* Anotaciones superpuestas */}
                <div className="absolute inset-0">
                  {rol.anotaciones.map((ann) => (
                    <Annotation key={ann.id} ann={ann} />
                  ))}
                </div>
              </div>
            </div>

            {/* Pasos */}
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Qué hacer paso a paso</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rol.pasos.map((p) => (
                  <div
                    key={p.num}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1"
                  >
                    <p className="text-sm font-bold" style={{ color: rol.color }}>
                      {p.num} {p.titulo}
                    </p>
                    <p className="text-sm text-zinc-400 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{ borderColor: `${rol.color}30`, background: `${rol.color}08` }}
            >
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: rol.color }}>
                Tips clave
              </p>
              {rol.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span style={{ color: rol.color }} className="shrink-0 mt-0.5">▸</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Separador */}
        <div className="border-t border-zinc-800" />

        {/* Flujo general */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-white">Cómo funciona una ronda</h3>
          <div className="grid gap-3">
            {[
              { num: "①", color: "#6366F1", titulo: "Servidor activa el ticket",    desc: "Todos ven el nombre y descripción del problema bancario. Solo el Analista recibe el briefing confidencial con la solución." },
              { num: "②", color: "#F59E0B", titulo: "Analista dicta síntomas",      desc: "El Analista lee el briefing y dicta pistas técnicas al equipo por el chat, sin revelar los nombres de los componentes." },
              { num: "③", color: "#10B981", titulo: "Buscador localiza las piezas", desc: "Escucha las pistas, busca en el directorio de 18 Service Domains BIAN y envía los candidatos al Integrador." },
              { num: "④", color: "#EF4444", titulo: "Integrador ensambla",          desc: "Coloca las piezas en los slots correctos vigilando que el presupuesto y la latencia estén dentro del límite." },
              { num: "⑤", color: "#10B981", titulo: "Deploy y validación",          desc: "El Integrador despliega. El servidor valida. Si es correcto: puntos para el equipo y el siguiente ticket se activa automáticamente." },
            ].map((paso) => (
              <div key={paso.num} className="flex gap-4 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-xl font-black shrink-0 mt-0.5" style={{ color: paso.color }}>{paso.num}</span>
                <div>
                  <p className="font-bold text-sm text-white mb-1">{paso.titulo}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{paso.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ganar / Perder */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-2">
            <p className="font-bold text-emerald-400 text-sm">Ganan si...</p>
            {["Resuelven todos los tickets antes de que acabe el tiempo", "El Pánico del Sistema nunca llega al 100%", "Cada solución respeta el presupuesto y la latencia máxima"].map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="text-emerald-600 shrink-0">✓</span>{r}
              </div>
            ))}
          </div>
          <div className="p-4 bg-red-950/20 border border-red-800/50 rounded-xl space-y-2">
            <p className="font-bold text-red-400 text-sm">Pierden si...</p>
            {["El Pánico del Sistema llega al 100%", "No resuelven todos los tickets a tiempo", "Fallan demasiados QTE (alertas de sistema legacy) seguidos"].map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="text-red-600 shrink-0">✗</span>{r}
              </div>
            ))}
          </div>
        </div>

        {/* Link al examen */}
        <div className="p-5 bg-indigo-950/30 border border-indigo-800/50 rounded-2xl flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-indigo-300 text-sm">Modo Auditoría — Examen individual BIAN</p>
            <p className="text-xs text-zinc-500 mt-1">20 preguntas · BIAN v14 · Certificado digital con ≥70%</p>
          </div>
          <Link href="/auditoria" className="shrink-0 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all">
            Ir al Examen →
          </Link>
        </div>

        <footer className="border-t border-zinc-800 pt-5 text-center">
          <p className="text-xs text-zinc-700">
            Architecture Chaos · Portafolio TIC 2026 · Basado en BIAN Service Landscape v14
          </p>
        </footer>
      </div>
    </div>
  );
}