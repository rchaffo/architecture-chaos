/**
 * server/game/GameConfig.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Singleton que carga `configuracion_juego.json` una sola vez al arrancar el
 * servidor y expone helpers de lectura.
 *
 * NUNCA modifica el JSON original ni filtra datos sensibles hacia el cliente
 * directamente — use getPublicTicket() / getPublicConfig() para eso.
 *
 * Las soluciones correctas (solucion_correcta) NUNCA salen del servidor.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const path = require("path");
const fs   = require("fs");

// ─── Ruta al JSON (busca en public/ relativo al proyecto Next.js) ─────────────
const CONFIG_PATH = path.resolve(
  __dirname,
  "../../public/configuracion_juego.json"
);

// ─── Carga y validación básica ────────────────────────────────────────────────
let _config;

try {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  _config   = JSON.parse(raw);

  // Validación mínima de estructura
  const required = ["escenarios", "directorio_componentes", "roles", "configuracion_sala"];
  for (const key of required) {
    if (!_config[key]) throw new Error(`Falta la clave raíz: "${key}"`);
  }

  console.log(
    `[GameConfig] JSON cargado — ` +
    `${_config.escenarios.length} escenarios, ` +
    `${_config.directorio_componentes.length} componentes, ` +
    `${_config.roles.length} roles`
  );
} catch (err) {
  console.error(`[GameConfig] ERROR cargando configuracion_juego.json:\n  ${err.message}`);
  console.error(`  Ruta esperada: ${CONFIG_PATH}`);
  process.exit(1);
}

// ─── Estado de salas activas (en memoria) ─────────────────────────────────────
// Mapa roomId → RoomState (definido en RoomManager.js)
const _rooms = new Map();

// ─── Helpers privados ─────────────────────────────────────────────────────────

/**
 * Elimina solucion_correcta y descripcion_analista_solo de un escenario.
 * Solo se envían al Analista en un evento privado.
 */
function _stripSensitive(escenario) {
  // eslint-disable-next-line no-unused-vars
  const { solucion_correcta, descripcion_analista_solo, ...pub } = escenario;
  return pub;
}

// ─── API pública ──────────────────────────────────────────────────────────────

module.exports = {
  // ── Acceso al JSON completo (solo server-side) ───────────────────────────

  /** Devuelve el array completo de escenarios (con soluciones). Solo para validación interna. */
  getAllEscenarios() {
    return _config.escenarios;
  },

  /** Devuelve un escenario por su ID. Incluye solucion_correcta. Solo server-side. */
  getEscenarioById(id) {
    return _config.escenarios.find((e) => e.id === id) ?? null;
  },

  /** Devuelve el directorio completo de componentes. */
  getAllComponents() {
    return _config.directorio_componentes;
  },

  /** Devuelve un componente por ID. */
  getComponentById(id) {
    return _config.directorio_componentes.find((c) => c.id === id) ?? null;
  },

  /** Devuelve los roles definidos en el JSON. */
  getRoles() {
    return _config.roles;
  },

  /** Devuelve la configuración de sala (jugadores_min, jugadores_max, etc.). */
  getSalaConfig() {
    return _config.configuracion_sala;
  },

  /** Devuelve los textos de UI. */
  getTextos() {
    return _config.textos_ui ?? {};
  },

  // ── Versiones seguras para enviar al cliente ─────────────────────────────

  /**
   * Devuelve el escenario sin solucion_correcta ni descripcion_analista_solo.
   * Seguro para broadcast a todos los jugadores.
   */
  getPublicTicket(id) {
    const esc = this.getEscenarioById(id);
    if (!esc) return null;
    return _stripSensitive(esc);
  },

  /**
   * Devuelve la descripcion_analista_solo de un escenario.
   * Solo debe emitirse al socket del Analista, nunca en broadcast.
   */
  getAnalystBriefing(id) {
    const esc = this.getEscenarioById(id);
    return esc?.descripcion_analista_solo ?? null;
  },

  /**
   * Config completa sin soluciones para el endpoint HTTP GET /api/config.
   */
  getPublicConfig() {
    return {
      _meta               : _config._meta,
      configuracion_sala  : _config.configuracion_sala,
      roles               : _config.roles,
      textos_ui           : _config.textos_ui,
      directorio_componentes: _config.directorio_componentes,
      escenarios          : _config.escenarios.map(_stripSensitive),
    };
  },

  // ── Estado de salas en memoria ───────────────────────────────────────────

  getRooms()           { return _rooms; },
  getRoom(roomId)      { return _rooms.get(roomId) ?? null; },
  setRoom(roomId, val) { _rooms.set(roomId, val); },
  deleteRoom(roomId)   { _rooms.delete(roomId); },

  // ── Métricas (expuestas en /health) ──────────────────────────────────────

  getRoomCount() {
    return _rooms.size;
  },

  getTotalPlayerCount() {
    let total = 0;
    for (const room of _rooms.values()) {
      total += room.players?.length ?? 0;
    }
    return total;
  },

  getSummary() {
    return (
      `${_config.escenarios.length} escenarios | ` +
      `${_config.directorio_componentes.length} componentes | ` +
      `${_config.roles.length} roles`
    );
  },
};
