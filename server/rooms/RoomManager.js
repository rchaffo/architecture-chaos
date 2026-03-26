/**
 * server/rooms/RoomManager.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Funciones puras para crear y mutar el estado de las salas.
 * No tiene side-effects de red — solo opera sobre objetos JS.
 *
 * Estructura de una sala (RoomState):
 * {
 *   roomId      : string               // Código de 6 letras mayúsculas
 *   hostSocketId: string               // Primer jugador en unirse
 *   status      : "waiting"|"playing"|"finished"
 *   players     : PlayerState[]
 *   gameState   : GameState | null     // null hasta que inicia la partida
 *   createdAt   : Date
 * }
 *
 * PlayerState:
 * {
 *   socketId : string
 *   name     : string
 *   roleId   : string | null
 *   isReady  : boolean
 * }
 *
 * GameState:
 * {
 *   currentTicketIndex : number        // índice en escenarios[]
 *   currentTicketId    : string
 *   startedAt          : Date
 *   panicLevel         : number        // 0–100
 *   score              : number
 *   ticketsCompleted   : string[]      // IDs de tickets ya resueltos
 * }
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const GameConfig = require("../game/GameConfig");

// ─── Generador de código de sala ──────────────────────────────────────────────
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Sin I/O para evitar confusión visual

/**
 * Genera un código de sala de 6 caracteres único entre las salas activas.
 * @returns {string}
 */
function generateRoomCode() {
  const rooms = GameConfig.getRooms();
  let code;
  let attempts = 0;
  do {
    code = Array.from({ length: 6 }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join("");
    attempts++;
    if (attempts > 1000) throw new Error("No se pudo generar un código de sala único");
  } while (rooms.has(code));
  return code;
}

// ─── Factory de sala ──────────────────────────────────────────────────────────

/**
 * Crea el estado inicial de una sala con el primer jugador como host.
 * @param {string} socketId
 * @param {string} playerName
 * @param {string} roleId
 * @returns {{ roomId: string, room: RoomState }}
 */
function createRoom(socketId, playerName, roleId) {
  const roomId = generateRoomCode();

  const room = {
    roomId,
    hostSocketId: socketId,
    status      : "waiting",
    players     : [
      {
        socketId,
        name   : playerName.trim().slice(0, 24),
        roleId : roleId ?? null,
        isReady: false,
      },
    ],
    gameState: null,
    createdAt: new Date(),
  };

  GameConfig.setRoom(roomId, room);
  return { roomId, room };
}

// ─── Mutaciones de sala ───────────────────────────────────────────────────────

/**
 * Añade un jugador a una sala existente.
 * @returns {{ ok: boolean, error?: string }}
 */
function joinRoom(roomId, socketId, playerName, roleId) {
  const room    = GameConfig.getRoom(roomId);
  const salaCfg = GameConfig.getSalaConfig();

  if (!room)                                    return { ok: false, error: "Sala no encontrada" };
  if (room.status !== "waiting")                return { ok: false, error: "La partida ya ha comenzado" };
  if (room.players.length >= salaCfg.jugadores_max)
                                                return { ok: false, error: `Sala llena (máx. ${salaCfg.jugadores_max} jugadores)` };
  if (room.players.find((p) => p.socketId === socketId))
                                                return { ok: false, error: "Ya estás en esta sala" };

  // Verificar que el rol no esté tomado
  if (roleId && room.players.find((p) => p.roleId === roleId))
                                                return { ok: false, error: "Ese rol ya está ocupado" };

  room.players.push({
    socketId,
    name   : playerName.trim().slice(0, 24),
    roleId : roleId ?? null,
    isReady: false,
  });

  return { ok: true };
}

/**
 * Actualiza el rol de un jugador dentro de una sala.
 */
function updatePlayerRole(roomId, socketId, roleId) {
  const room = GameConfig.getRoom(roomId);
  if (!room) return { ok: false, error: "Sala no encontrada" };

  // Verificar que el rol no esté tomado por otro jugador
  const takenBy = room.players.find(
    (p) => p.roleId === roleId && p.socketId !== socketId
  );
  if (takenBy) return { ok: false, error: "Ese rol ya está ocupado" };

  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) return { ok: false, error: "Jugador no encontrado" };

  player.roleId = roleId;
  return { ok: true, player };
}

/**
 * Marca a un jugador como listo/no listo.
 */
function setPlayerReady(roomId, socketId, isReady) {
  const room   = GameConfig.getRoom(roomId);
  const player = room?.players.find((p) => p.socketId === socketId);
  if (!player) return;
  player.isReady = Boolean(isReady);
}

/**
 * Elimina un jugador de su sala. Si era el host, transfiere al siguiente.
 * Si la sala queda vacía, la elimina.
 * @returns {{ room: RoomState|null, wasEmpty: boolean }}
 */
function removePlayer(socketId) {
  for (const [roomId, room] of GameConfig.getRooms()) {
    const idx = room.players.findIndex((p) => p.socketId === socketId);
    if (idx === -1) continue;

    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      GameConfig.deleteRoom(roomId);
      return { room: null, wasEmpty: true, roomId };
    }

    // Transferir host si era el que se fue
    if (room.hostSocketId === socketId) {
      room.hostSocketId = room.players[0].socketId;
    }

    return { room, wasEmpty: false, roomId };
  }

  return { room: null, wasEmpty: false, roomId: null };
}

/**
 * Encuentra la sala a la que pertenece un socketId.
 * @returns {{ room: RoomState|null, roomId: string|null }}
 */
function findRoomBySocket(socketId) {
  for (const [roomId, room] of GameConfig.getRooms()) {
    if (room.players.find((p) => p.socketId === socketId)) {
      return { room, roomId };
    }
  }
  return { room: null, roomId: null };
}

/**
 * Inicializa el GameState cuando el host arranca la partida.
 * @returns {{ ok: boolean, error?: string, gameState?: GameState }}
 */
function startGame(roomId, socketId) {
  const room    = GameConfig.getRoom(roomId);
  const salaCfg = GameConfig.getSalaConfig();

  if (!room)                                 return { ok: false, error: "Sala no encontrada" };
  if (room.hostSocketId !== socketId)        return { ok: false, error: "Solo el host puede iniciar" };
  if (room.status !== "waiting")             return { ok: false, error: "La partida ya está en curso" };
  if (room.players.length < salaCfg.jugadores_min)
    return { ok: false, error: `Se necesitan mínimo ${salaCfg.jugadores_min} jugadores` };
  if (!room.players.every((p) => p.isReady))
    return { ok: false, error: "No todos los jugadores están listos" };

  const escenarios = GameConfig.getAllEscenarios();
  if (!escenarios.length)                    return { ok: false, error: "No hay escenarios configurados" };

  const gameState = {
    currentTicketIndex: 0,
    currentTicketId   : escenarios[0].id,
    startedAt         : new Date(),
    panicLevel        : 0,
    score             : 0,
    ticketsCompleted  : [],
  };

  room.status    = "playing";
  room.gameState = gameState;

  return { ok: true, gameState };
}

/**
 * Avanza al siguiente ticket después de resolver uno.
 * @returns {{ ok: boolean, finished?: boolean, nextTicketId?: string }}
 */
function advanceTicket(roomId) {
  const room       = GameConfig.getRoom(roomId);
  const escenarios = GameConfig.getAllEscenarios();

  if (!room?.gameState) return { ok: false };

  const { currentTicketIndex, currentTicketId } = room.gameState;

  // Registrar ticket completado
  if (!room.gameState.ticketsCompleted.includes(currentTicketId)) {
    room.gameState.ticketsCompleted.push(currentTicketId);
  }

  const nextIndex = currentTicketIndex + 1;

  if (nextIndex >= escenarios.length) {
    room.status = "finished";
    return { ok: true, finished: true };
  }

  room.gameState.currentTicketIndex = nextIndex;
  room.gameState.currentTicketId    = escenarios[nextIndex].id;

  return { ok: true, finished: false, nextTicketId: escenarios[nextIndex].id };
}

/**
 * Aplica penalización de pánico (QTE fallido, timeout, etc.)
 * @returns {number} nuevo nivel de pánico
 */
function applyPanic(roomId, amount) {
  const room = GameConfig.getRoom(roomId);
  if (!room?.gameState) return 0;

  const salaCfg = GameConfig.getSalaConfig();
  room.gameState.panicLevel = Math.min(
    (room.gameState.panicLevel ?? 0) + amount,
    salaCfg.nivel_panico_maximo ?? 100
  );
  return room.gameState.panicLevel;
}

/**
 * Suma puntos al score de la sala.
 */
function addScore(roomId, points) {
  const room = GameConfig.getRoom(roomId);
  if (!room?.gameState) return;
  room.gameState.score = (room.gameState.score ?? 0) + points;
}

module.exports = {
  generateRoomCode,
  createRoom,
  joinRoom,
  updatePlayerRole,
  setPlayerReady,
  removePlayer,
  findRoomBySocket,
  startGame,
  advanceTicket,
  applyPanic,
  addScore,
};
