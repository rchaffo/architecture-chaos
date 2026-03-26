/**
 * server/utils/logger.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Logger minimalista sin dependencias externas.
 * En producción se puede reemplazar por Winston o Pino sin tocar los handlers.
 *
 * Niveles: info | warn | error | debug
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const IS_DEV = (process.env.NODE_ENV ?? "development") !== "production";

const LEVELS = {
  debug : { color: "\x1b[36m", prefix: "DBG" }, // cyan
  info  : { color: "\x1b[32m", prefix: "INF" }, // green
  warn  : { color: "\x1b[33m", prefix: "WRN" }, // yellow
  error : { color: "\x1b[31m", prefix: "ERR" }, // red
};
const RESET = "\x1b[0m";

function _log(level, message) {
  const { color, prefix } = LEVELS[level] ?? LEVELS.info;
  const ts = new Date().toISOString().replace("T", " ").slice(0, 23);

  if (IS_DEV) {
    console.log(`${color}[${prefix}]${RESET} ${ts}  ${message}`);
  } else {
    // Formato JSON para plataformas cloud (Railway, Fly, Render)
    console.log(JSON.stringify({ level, ts, msg: message }));
  }
}

const logger = {
  info : (msg) => _log("info",  msg),
  warn : (msg) => _log("warn",  msg),
  error: (msg) => _log("error", msg),
  debug: (msg) => IS_DEV && _log("debug", msg),
};

module.exports = logger;
