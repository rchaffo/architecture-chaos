"use client";
 
/**
 * src/app/manual/page.js
 * Manual interactivo de cómo se juega Architecture Chaos
 */
 
import { useState } from "react";
import Link from "next/link";
 
// ─── Datos del manual ─────────────────────────────────────────────────────────
const ROLES = [
  {
    id: "project_manager",
    nombre: "Project Manager",
    alias: "Triage Controller",
    color: "#6366F1",
    emoji: "⬡",
    resumen: "Ves el panorama completo. Tu pantalla es un tablero Kanban con todos los tickets de la misión.",
    pantalla: "Tablero Kanban con 3 columnas: Backlog → En Progreso → Completado",
    pasos: [
      { paso: 1, titulo: "Observa el tablero", descripcion: "Al entrar verás todos los escenarios del juego organizados en columnas. El ticket que el equipo está resolviendo ahora aparece en 'En Progreso' con el badge ACTIVO en azul." },
      { paso: 2, titulo: "Monitorea el Pánico", descripcion: "En la barra superior hay un medidor de 'Pánico del Sistema' (0–100%). Si llega al 100% el equipo pierde. Avisa al equipo cuando supere el 50%." },
      { paso: 3, titulo: "Monitorea el Score", descripcion: "El score del equipo aparece en la esquina superior derecha. Cada ticket resuelto suma puntos. Más rápido = más bonus." },
      { paso: 4, titulo: "Informa al equipo", descripcion: "Usa el chat del equipo para comunicar cuántos tickets quedan, el nivel de pánico, y el tiempo disponible. Eres el 'cuadro de mando' del grupo." },
      { paso: 5, titulo: "Los tickets avanzan solos", descripcion: "No necesitas mover tickets manualmente — el servidor los mueve automáticamente cuando el Integrador despliega la solución correcta. Tu rol es de observación y comunicación." },
    ],
    tips: [
      "Anuncia el nivel de pánico cada vez que suba más del 20%",
      "Avisa cuántos tickets quedan para que el equipo sepa el tiempo disponible",
      "Si ves que un ticket tiene pocas piezas en el Inbox del Integrador, avísale al Buscador",
    ],
    noHacer: "No puedes resolver los tickets directamente ni cambiar el orden — eso lo decide el servidor según el JSON",
  },
  {
    id: "analista",
    nombre: "Analista",
    alias: "Chef de Requerimientos",
    color: "#F59E0B",
    emoji: "●",
    resumen: "Eres el único que conoce la solución completa. Tu trabajo es dictar pistas al Buscador sin revelar directamente los nombres de los componentes.",
    pantalla: "3 paneles: Briefing confidencial (izquierda) | Chat del equipo (centro) | Pistas rápidas (derecha)",
    pasos: [
      { paso: 1, titulo: "Lee el Briefing Confidencial", descripcion: "En el panel izquierdo, sección en rojo 'SOLO PARA TI', encontrarás la descripción completa del problema: qué falló, por qué, y cuáles son los 4 componentes exactos que lo resuelven en orden." },
      { paso: 2, titulo: "Lee los Síntomas del ticket", descripcion: "Debajo del briefing verás los 4 slots que el Integrador debe llenar. Cada slot tiene un nombre descriptivo (ej: 'Protocol Bridge REST→SOAP'). Eso te indica qué tipo de componente busca el Buscador." },
      { paso: 3, titulo: "Dicta síntomas al Buscador", descripcion: "Usa el chat central para describir síntomas técnicos SIN decir el nombre del componente. Ejemplo: en vez de decir 'API Gateway', di 'El sistema destino solo habla SOAP, necesitamos algo que traduzca el protocolo'." },
      { paso: 4, titulo: "Usa las Pistas Rápidas", descripcion: "En el panel derecho hay botones de pistas predefinidas. Al hacer clic en uno, se envía automáticamente al chat del equipo. Úsalos cuando el Buscador esté perdido." },
      { paso: 5, titulo: "Valida con el Integrador", descripcion: "Cuando el Integrador arme la solución, él te avisará por chat. Confirma si está correcto o indica qué slot está mal sin revelar el componente exacto." },
    ],
    tips: [
      "Describe el PROBLEMA que resuelve el componente, no su nombre",
      "Da pistas del Business Area: 'Busca en Risk & Compliance' o 'Es un dominio de Operations'",
      "Menciona características: 'Tiene latencia baja', 'Es de tipo GATEWAY', 'El riesgo es BAJO'",
      "Si el Buscador no encuentra, usa el botón de pista del panel derecho",
    ],
    noHacer: "Nunca digas el nombre exacto del componente (API Gateway, CICS Adapter, etc.) — eso arruina el juego",
  },
  {
    id: "buscador",
    nombre: "Buscador",
    alias: "Navegador de Directorio",
    color: "#10B981",
    emoji: "■",
    resumen: "Eres el motor de búsqueda del equipo. Escuchas las pistas del Analista y encuentras los componentes correctos en el directorio de 18 Service Domains BIAN.",
    pantalla: "Directorio con barra de búsqueda, filtros y tabla de 18 componentes BIAN",
    pasos: [
      { paso: 1, titulo: "Escucha al Analista", descripcion: "El Analista te dará síntomas por el chat. Ej: 'El sistema destino solo habla SOAP'. Eso te indica que necesitas buscar algo relacionado con traducción de protocolos." },
      { paso: 2, titulo: "Usa la barra de búsqueda", descripcion: "Escribe palabras clave en la barra: 'SOAP', 'gateway', 'pagos', 'AML', 'cuenta'. El directorio filtra en tiempo real sobre los 18 componentes disponibles." },
      { paso: 3, titulo: "Usa los filtros", descripcion: "Si la búsqueda da muchos resultados, refina con los filtros: ÁREA (Operations / Risk & Compliance / Sales & Service / Customer Management), TIPO (SERVICIO BIAN / GATEWAY / ADAPTADOR LEGACY) y RIESGO (BAJO / MEDIO / ALTO)." },
      { paso: 4, titulo: "Expande para ver detalles", descripcion: "Haz clic en cualquier fila para ver la descripción técnica completa, los tags de búsqueda, el costo en USD, la latencia adicional y las certificaciones. Esto te ayuda a confirmar si es el componente correcto." },
      { paso: 5, titulo: "Envía al Integrador", descripcion: "Cuando estés seguro, haz clic en 'Enviar al Integrador'. El componente aparecerá en el Inbox del Integrador. Puedes enviar varios candidatos — el Integrador decide cuál usar." },
    ],
    tips: [
      "Puedes cambiar entre vista Tabla (más información) y vista Tarjetas (más visual)",
      "Ordena por costo o latencia para ayudar al Integrador a no sobrepasar los límites",
      "Si el Analista dice 'Business Area Operations', filtra por esa área primero",
      "Envía 1 o 2 componentes candidatos por pista — no inundes el Inbox del Integrador",
    ],
    noHacer: "No envíes todos los componentes a la vez — el Integrador se confunde y pierde tiempo descartando",
  },
  {
    id: "integrador",
    nombre: "Integrador",
    alias: "Ensamblador de Arquitectura",
    color: "#EF4444",
    emoji: "◆",
    resumen: "Eres quien arma la solución final. Recibes las piezas del Buscador y las colocas en los slots correctos cuidando el presupuesto y la latencia.",
    pantalla: "Blueprint Canvas con slots vacíos (centro) | Inbox de piezas recibidas (derecha) | Gauges de presupuesto y latencia (arriba)",
    pasos: [
      { paso: 1, titulo: "Observa los Slots", descripcion: "En el centro verás el 'Blueprint Canvas' con los slots vacíos del ticket activo. Cada slot tiene un nombre descriptivo (ej: 'Protocol Bridge REST→SOAP') que te indica qué tipo de componente va ahí." },
      { paso: 2, titulo: "Revisa el Inbox", descripcion: "En el panel derecho aparecen los componentes que el Buscador te va enviando. Cada tarjeta muestra el nombre, dominio BIAN, costo en USD, latencia adicional y nivel de riesgo." },
      { paso: 3, titulo: "Vigila los Gauges", descripcion: "En la barra superior hay dos medidores: PRESUPUESTO (no exceder el límite en USD del ticket) y LATENCIA TOTAL (no exceder los ms máximos). Si alguno se pone rojo y parpadea, debes cambiar alguna pieza." },
      { paso: 4, titulo: "Ensambla la arquitectura", descripcion: "Haz clic en una pieza del Inbox para seleccionarla (se resalta), luego haz clic en el slot vacío donde quieres colocarla. Si te equivocas, haz clic en la X del slot para removerla." },
      { paso: 5, titulo: "Despliega cuando estés listo", descripcion: "Cuando todos los slots estén llenos y ningún gauge esté en rojo, el botón 'Desplegar Solución' se activa en verde. Haz clic — el servidor valida la solución y si es correcta, el ticket se completa." },
    ],
    tips: [
      "El nombre de cada slot te da la pista más importante sobre qué componente va ahí",
      "Si el presupuesto está al límite, pide al Buscador componentes más baratos",
      "Puedes remover y reemplazar piezas todas las veces que necesites antes de desplegar",
      "Coordina con el Analista por chat si no estás seguro del orden de los slots",
    ],
    noHacer: "No presiones Desplegar si algún gauge está en rojo — el servidor rechazará la solución aunque las piezas sean correctas",
  },
];
 
const FLUJO_GENERAL = [
  { icono: "①", titulo: "El servidor activa el ticket", desc: "Todos ven el nombre y la descripción pública del problema bancario. Solo el Analista recibe el briefing confidencial con la solución." },
  { icono: "②", titulo: "El Analista dicta síntomas", desc: "El Analista lee el briefing y dicta pistas técnicas al equipo por el chat, sin revelar los nombres de los componentes." },
  { icono: "③", titulo: "El Buscador localiza las piezas", desc: "El Buscador escucha las pistas, busca en el directorio de 18 Service Domains BIAN y envía los candidatos al Integrador." },
  { icono: "④", titulo: "El Integrador ensambla la solución", desc: "El Integrador coloca las piezas en los slots correctos, vigilando que el presupuesto y la latencia estén dentro del límite." },
  { icono: "⑤", titulo: "Deploy y validación", desc: "El Integrador despliega. El servidor valida contra el JSON. Si es correcto: puntos para el equipo y el siguiente ticket se activa automáticamente." },
];
 
// ─── Sub-componentes ──────────────────────────────────────────────────────────
function RoleTab({ rol, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(rol.id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
        isActive
          ? "border-current text-white"
          : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
      }`}
      style={isActive ? { borderColor: rol.color, background: `${rol.color}20` } : {}}
    >
      <span style={{ color: rol.color }}>{rol.emoji}</span>
      {rol.nombre}
    </button>
  );
}
 
function StepCard({ paso, titulo, descripcion, color }) {
  return (
    <div className="flex gap-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 mt-0.5"
        style={{ background: `${color}30`, color }}
      >
        {paso}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-zinc-100">{titulo}</p>
        <p className="text-sm text-zinc-400 leading-relaxed">{descripcion}</p>
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black">
              <span className="text-indigo-400">Architecture</span>{" "}
              <span className="text-red-400">Chaos</span>
              <span className="text-zinc-600 font-normal text-sm ml-2">— Manual del Juego</span>
            </h1>
          </div>
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
 
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-14">
 
        {/* Sección 1: Qué es el juego */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-800 bg-indigo-950/50 text-indigo-400 text-xs font-mono">
            ¿Qué es Architecture Chaos?
          </div>
          <h2 className="text-3xl font-black text-white">
            Un juego cooperativo para aprender BIAN
          </h2>
          <p className="text-zinc-400 leading-relaxed max-w-2xl">
            Architecture Chaos es una plataforma de capacitación multijugador donde 2 a 4 personas
            asumen roles distintos dentro de un banco y deben colaborar en tiempo real para resolver
            incidentes de modernización bancaria usando los estándares <strong className="text-white">BIAN v14</strong>.
          </p>
          <p className="text-zinc-400 leading-relaxed max-w-2xl">
            Cada ticket es un caso real de arquitectura bancaria — el mismo tipo de problema que
            aparece en los <strong className="text-white">exámenes de certificación BIAN Foundation</strong>.
            La diferencia es que aquí lo resuelven en equipo, bajo presión de tiempo.
          </p>
        </section>
 
        {/* Sección 2: Flujo general */}
        <section className="space-y-6">
          <h2 className="text-xl font-black text-white border-b border-zinc-800 pb-3">
            Cómo funciona una ronda
          </h2>
          <div className="grid gap-4">
            {FLUJO_GENERAL.map((paso) => (
              <div key={paso.icono} className="flex gap-4 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-2xl font-black text-indigo-400 shrink-0">{paso.icono}</span>
                <div>
                  <p className="font-bold text-zinc-100 mb-1">{paso.titulo}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{paso.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl">
            <p className="text-sm text-amber-300">
              <strong>⚡ Eventos QTE (Quick Time Events):</strong> Aleatoriamente, el sistema legacy
              falla y aparece una alerta. Cualquier jugador libre debe ir a la consola y completar
              la secuencia de teclas antes de que el tiempo se acabe — o el nivel de Pánico sube.
            </p>
          </div>
        </section>
 
        {/* Sección 3: Los 4 roles */}
        <section className="space-y-6">
          <h2 className="text-xl font-black text-white border-b border-zinc-800 pb-3">
            Los 4 roles — qué hace cada uno
          </h2>
 
          {/* Tabs de roles */}
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <RoleTab key={r.id} rol={r} isActive={rolActivo === r.id} onClick={setRolActivo} />
            ))}
          </div>
 
          {/* Contenido del rol activo */}
          {rol && (
            <div className="space-y-6 p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
 
              {/* Header del rol */}
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shrink-0"
                  style={{ background: `${rol.color}20`, color: rol.color }}
                >
                  {rol.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{rol.nombre}</h3>
                  <p className="text-sm font-mono" style={{ color: rol.color }}>{rol.alias}</p>
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{rol.resumen}</p>
                </div>
              </div>
 
              {/* Pantalla */}
              <div className="px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-950/60">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Tu pantalla</p>
                <p className="text-sm text-zinc-300 font-mono">{rol.pantalla}</p>
              </div>
 
              {/* Pasos */}
              <div>
                <p className="text-xs text-zinc-600 uppercase tracking-widest mb-4">Paso a paso</p>
                <div className="space-y-5">
                  {rol.pasos.map((p) => (
                    <StepCard key={p.paso} {...p} color={rol.color} />
                  ))}
                </div>
              </div>
 
              {/* Tips y no hacer */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: rol.color }}>
                    ✓ Tips
                  </p>
                  {rol.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                      <span style={{ color: rol.color }} className="shrink-0 mt-0.5">▸</span>
                      {tip}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest">✗ No hacer</p>
                  <div className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="text-red-600 shrink-0 mt-0.5">▸</span>
                    {rol.noHacer}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
 
        {/* Sección 4: Los medidores */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-white border-b border-zinc-800 pb-3">
            Los medidores que debes vigilar
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { nombre: "Presupuesto", color: "#38bdf8", desc: "Suma del costo USD de los componentes colocados en los slots. Si supera el límite del ticket, la barra se pone roja y no puedes desplegar." },
              { nombre: "Latencia Total", color: "#10b981", desc: "Suma de los ms adicionales de cada componente. Si supera el máximo del ticket, la barra se pone roja. Debes cambiar por componentes más rápidos." },
              { nombre: "Pánico del Sistema", color: "#ef4444", desc: "Sube cuando fallan los QTE o se acaba el tiempo de un ticket. Si llega al 100%, el equipo pierde. Lo ve el Project Manager en su pantalla." },
            ].map((m) => (
              <div key={m.nombre} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                  <p className="font-bold text-sm text-white">{m.nombre}</p>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>
 
        {/* Sección 5: El directorio BIAN */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-white border-b border-zinc-800 pb-3">
            El Directorio de Componentes BIAN
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Hay <strong className="text-white">18 Service Domains</strong> disponibles en el directorio,
            organizados según el estándar BIAN v14. Cada componente tiene:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              ["ID único", "COMP-001 a COMP-018"],
              ["Dominio BIAN", "Ej: Payment Execution, Fraud Detection"],
              ["Business Area", "Operations / Risk & Compliance / Sales & Service / Customer Mgmt"],
              ["Costo en USD", "Contribuye al presupuesto total del ticket"],
              ["Latencia adicional (+ms)", "Contribuye a la latencia total del ticket"],
              ["Nivel de Riesgo", "BAJO / MEDIO / ALTO — informativo"],
              ["Tags de búsqueda", "Palabras clave para encontrarlo rápido"],
              ["Cumplimiento regulatorio", "PCI-DSS, ISO 20022, GDPR, SWIFT CSP, etc."],
            ].map(([campo, desc]) => (
              <div key={campo} className="flex gap-3 text-sm">
                <span className="text-indigo-400 font-mono shrink-0">▸</span>
                <span>
                  <strong className="text-zinc-200">{campo}:</strong>{" "}
                  <span className="text-zinc-500">{desc}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
 
        {/* Sección 6: Cómo ganar */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-white border-b border-zinc-800 pb-3">
            Cómo ganar (y perder)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-2">
              <p className="font-bold text-emerald-400">🏆 Ganan si...</p>
              <ul className="space-y-1.5 text-sm text-zinc-400">
                <li className="flex gap-2"><span className="text-emerald-600">✓</span>Resuelven todos los tickets antes de que el tiempo se acabe</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span>El Pánico del Sistema nunca llega al 100%</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span>Cada solución tiene el costo y latencia dentro de los límites</li>
              </ul>
            </div>
            <div className="p-4 bg-red-950/20 border border-red-800/50 rounded-xl space-y-2">
              <p className="font-bold text-red-400">💀 Pierden si...</p>
              <ul className="space-y-1.5 text-sm text-zinc-400">
                <li className="flex gap-2"><span className="text-red-600">✗</span>El Pánico del Sistema llega al 100%</li>
                <li className="flex gap-2"><span className="text-red-600">✗</span>No resuelven todos los tickets en el tiempo total</li>
                <li className="flex gap-2"><span className="text-red-600">✗</span>Fallan demasiados QTE seguidos</li>
              </ul>
            </div>
          </div>
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-400">
            <strong className="text-white">Puntuación:</strong> Cada ticket tiene un puntaje base.
            Si lo resuelven rápido, reciben un bonus de tiempo. El score total es la suma de todos
            los tickets completados más los bonos acumulados.
          </div>
        </section>
 
        {/* Sección 7: Modo Auditoría */}
        <section className="p-6 bg-indigo-950/30 border border-indigo-800/50 rounded-2xl space-y-3">
          <h2 className="text-lg font-black text-indigo-300">Modo Auditoría — Examen Individual</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Además del modo multijugador, existe el <strong className="text-white">Modo Auditoría</strong>:
            un examen individual de 20 preguntas basado en el estándar BIAN v14, similar al examen
            oficial de certificación BIAN Foundation. Cada pregunta tiene su propio timer.
            Con ≥70% recibes tu certificado digital.
          </p>
          <Link
            href="/auditoria"
            className="inline-block px-5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all"
          >
            Ir al Examen →
          </Link>
        </section>
 
        {/* Footer */}
        <footer className="border-t border-zinc-800 pt-6 text-center">
          <p className="text-xs text-zinc-700">
            Architecture Chaos — Portafolio TIC 2026 · Basado en BIAN Service Landscape v14
          </p>
        </footer>
      </div>
    </div>
  );
}