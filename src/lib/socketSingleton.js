/**
 * src/lib/socketSingleton.js
 * ─────────────────────────────────────────────────────────────────────────────
 * UN SOLO socket para toda la app.
 *
 * El Lobby lo usa para crear/unirse a la sala.
 * GameBoard lo reutiliza — mismo socket, mismo socketId, misma room de Socket.io.
 * Así el servidor puede enviar game:ticket_active al socket correcto sin importar
 * en qué página esté el cliente.
 * ─────────────────────────────────────────────────────────────────────────────
 */
 
import { io } from "socket.io-client";
 
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";
 
// Módulo-level singleton — se crea una sola vez por sesión del navegador
let socket = null;
 
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect         : false, // conectar manualmente desde el Lobby
      reconnectionAttempts: 5,
      timeout             : 8000,
    });
  }
  return socket;
}