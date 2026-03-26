/**
 * server/rooms/roomHandlers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handlers de Socket.io para la gestión del ciclo de vida de las salas:
 * crear, unirse, cambiar rol, marcar listo y abandonar.
 *
 * Todos los handlers siguen el mismo patrón:
 *   1. Validar parámetros de entrada
 *   2. Llamar a RoomManager (lógica pura, sin efectos de red)
 *   3. Emitir eventos al cliente/sala según el resultado
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const RoomManager = require("./RoomManager");
const GameConfig  = require("../game/GameConfig");
const logger      = require("../utils/logger");

/**
 * Registra todos los event-handlers de sala en el socket dado.
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 */
function registerRoomHandlers(socket, io) {

  // ── room:create ────────────────────────────────────────────────────────────
  // Payload: { playerName: string, roleId: string }
  // Respuesta positiva: "room:state" con el estado inicial de la sala
  // Respuesta negativa: "room:error" con { message }
  socket.on("room:create", ({ playerName, roleId } = {}) => {
    logger.info(`[room:create] socket=${socket.id}  name="${playerName}"  role="${roleId}"`);

    if (!playerName?.trim()) {
      return socket.emit("room:error", { message: "El nombre del jugador es obligatorio." });
    }

    try {
      const { roomId, room } = RoomManager.createRoom(socket.id, playerName, roleId);

      // Unir el socket a la room de Socket.io para broadcast posterior
      socket.join(roomId);
      // Guardar el roomId en el socket para acceso rápido en disconnect
      socket.data.roomId = roomId;

      logger.info(`[room:create] Sala creada: ${roomId}  host=${socket.id}`);

      socket.emit("room:state", _sanitizeRoom(room));
    } catch (err) {
      logger.error(`[room:create] Error: ${err.message}`);
      socket.emit("room:error", { message: "No se pudo crear la sala. Intenta de nuevo." });
    }
  });

  // ── room:join ──────────────────────────────────────────────────────────────
  // Payload: { roomCode: string, playerName: string, roleId: string }
  socket.on("room:join", ({ roomCode, playerName, roleId } = {}) => {
    const code = roomCode?.trim().toUpperCase();
    logger.info(`[room:join] socket=${socket.id}  code="${code}"  name="${playerName}"`);

    if (!code || !playerName?.trim()) {
      return socket.emit("room:error", { message: "Código de sala y nombre son obligatorios." });
    }

    const result = RoomManager.joinRoom(code, socket.id, playerName, roleId);

    if (!result.ok) {
      return socket.emit("room:error", { message: result.error });
    }

    const room = GameConfig.getRoom(code);

    socket.join(code);
    socket.data.roomId = code;

    logger.info(`[room:join] ${socket.id} se unió a sala ${code}`);

    // Enviar el estado completo al recién unido
    socket.emit("room:state", _sanitizeRoom(room));

    // Notificar a los demás que entró alguien nuevo
    socket.to(code).emit("room:player_joined", {
      player: room.players.find((p) => p.socketId === socket.id),
      players: room.players,
    });
  });

  // ── player:select_role ────────────────────────────────────────────────────
  // Payload: { roleId: string }
  socket.on("player:select_role", ({ roleId } = {}) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const result = RoomManager.updatePlayerRole(roomId, socket.id, roleId);

    if (!result.ok) {
      return socket.emit("room:error", { message: result.error });
    }

    const room = GameConfig.getRoom(roomId);

    // Notificar a toda la sala (incluido el emisor) del cambio de rol
    io.to(roomId).emit("room:player_updated", result.player);

    logger.info(`[player:select_role] ${socket.id} → rol="${roleId}" en sala=${roomId}`);
  });

  // ── player:ready ──────────────────────────────────────────────────────────
  // Payload: { isReady: boolean }
  socket.on("player:ready", ({ isReady } = {}) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    RoomManager.setPlayerReady(roomId, socket.id, isReady);

    const room    = GameConfig.getRoom(roomId);
    const player  = room?.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    logger.info(`[player:ready] ${socket.id}  isReady=${isReady}  sala=${roomId}`);

    io.to(roomId).emit("room:player_updated", player);
  });

  // ── game:request_start ────────────────────────────────────────────────────
  // Solo el host puede emitir esto.
  socket.on("game:request_start", ({ roomId } = {}) => {
    const rid = roomId ?? socket.data.roomId;
    logger.info(`[game:request_start] host=${socket.id}  sala=${rid}`);

    const result = RoomManager.startGame(rid, socket.id);

    if (!result.ok) {
      return socket.emit("room:error", { message: result.error });
    }

    const room = GameConfig.getRoom(rid);

    // Emitir inicio de partida a todos en la sala
    // El cliente redirige a /game/:roomId al recibir este evento
    io.to(rid).emit("game:start", {
      roomId: rid,
      gameState: result.gameState,
    });

    logger.info(`[game:request_start] Partida iniciada en sala ${rid}`);

    // Emitir el primer ticket a todos (versión pública)
    _emitCurrentTicket(io, rid, room);
  });

  // ── room:leave ────────────────────────────────────────────────────────────
  socket.on("room:leave", () => {
    _handleLeave(socket, io);
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    _handleLeave(socket, io);
  });
}

// ─── Helpers privados ─────────────────────────────────────────────────────────

/**
 * Lógica compartida de salida/desconexión.
 */
function _handleLeave(socket, io) {
  const { room, wasEmpty, roomId } = RoomManager.removePlayer(socket.id);

  if (!roomId) return; // No estaba en ninguna sala

  socket.leave(roomId);
  socket.data.roomId = null;

  logger.info(`[room:leave] ${socket.id} abandonó sala=${roomId}  vacía=${wasEmpty}`);

  if (!wasEmpty && room) {
    // Notificar al resto de jugadores
    io.to(roomId).emit("room:player_left", {
      socketId: socket.id,
      players : room.players,
      newHostId: room.hostSocketId,
    });
  }
}

/**
 * Emite el estado público del ticket actual a todos en la sala.
 * El Analista recibe adicionalmente su briefing privado.
 */
function _emitCurrentTicket(io, roomId, room) {
  const ticketId    = room?.gameState?.currentTicketId;
  if (!ticketId) return;

  const publicTicket = GameConfig.getPublicTicket(ticketId);
  if (!publicTicket) return;

  // Broadcast público a toda la sala
  io.to(roomId).emit("game:ticket_active", { ticket: publicTicket });

  // Briefing privado SOLO al Analista
  const analista = room.players.find((p) => p.roleId === "analista");
  if (analista) {
    const briefing = GameConfig.getAnalystBriefing(ticketId);
    io.to(analista.socketId).emit("game:analyst_briefing", {
      ticketId,
      briefing,
    });
    logger.info(`[_emitCurrentTicket] Briefing enviado al Analista ${analista.socketId}`);
  }
}

/**
 * Elimina información sensible antes de enviar al cliente.
 * Nunca filtra socketIds al cliente excepto el propio jugador.
 */
function _sanitizeRoom(room) {
  return {
    roomId   : room.roomId,
    status   : room.status,
    players  : room.players,            // incluye socketId para que el cliente identifique el "yo"
    gameState: room.gameState
      ? {
          currentTicketId  : room.gameState.currentTicketId,
          currentTicketIndex: room.gameState.currentTicketIndex,
          panicLevel       : room.gameState.panicLevel,
          score            : room.gameState.score,
          ticketsCompleted : room.gameState.ticketsCompleted,
        }
      : null,
  };
}

module.exports = { registerRoomHandlers, _emitCurrentTicket };
