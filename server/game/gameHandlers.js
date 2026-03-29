/**
 * server/game/gameHandlers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handlers del game loop principal:
 *
 *   buscador:send_component     → retransmite la pieza al Integrador
 *   integrador:submit_solution  → valida la solución contra el JSON y responde
 *   game:qte_response           → evalúa respuesta a Quick Time Event
 *
 * Principio de seguridad:
 *   La validación de la solución ocurre EXCLUSIVAMENTE aquí, en el servidor,
 *   comparando contra `solucion_correcta` del JSON original.
 *   El cliente nunca recibe la solución correcta.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const GameConfig  = require("./GameConfig");
const RoomManager = require("../rooms/RoomManager");
const { _emitCurrentTicket } = require("../rooms/roomHandlers");
const logger      = require("../utils/logger");

/**
 * Registra todos los event-handlers del juego en el socket dado.
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 */
function registerGameHandlers(socket, io) {

  // ╔══════════════════════════════════════════════════════════════════════════
  // ║  buscador:send_component
  // ║  ─────────────────────────────────────────────────────────────────────
  // ║  El Buscador selecciona un componente del Directorio y lo envía.
  // ║  El servidor lo reenvía a TODOS en la sala (incluido el Integrador)
  // ║  para que aparezca en el Inbox de IntegratorStation.
  // ║
  // ║  Payload: { roomId, componentId, componentData }
  // ║  Emit a toda la sala: "buscador:send_component" con { componentData }
  // ╚══════════════════════════════════════════════════════════════════════════
  socket.on("buscador:send_component", ({ roomId, componentId, componentData } = {}) => {
    const rid = roomId ?? socket.data.roomId;
    logger.info(`[buscador:send_component] socket=${socket.id}  sala=${rid}  comp=${componentId}`);

    // Validaciones básicas
    if (!rid)         return socket.emit("game:error", { message: "No estás en ninguna sala." });
    if (!componentId) return socket.emit("game:error", { message: "componentId es obligatorio." });

    const room = GameConfig.getRoom(rid);
    if (!room)        return socket.emit("game:error", { message: "Sala no encontrada." });
    if (room.status !== "playing")
                      return socket.emit("game:error", { message: "La partida no está activa." });

    // Verificar que el emisor tiene rol de buscador (o es bypass de dev)
    const sender = room.players.find((p) => p.socketId === socket.id);
    if (sender?.roleId && sender.roleId !== "buscador") {
      logger.warn(`[buscador:send_component] Rol incorrecto: ${sender.roleId}`);
      // En dev se permite; en prod podrías retornar error aquí.
    }

    // Enriquecer con datos del servidor (evita que el cliente manipule el payload)
    const serverComp = GameConfig.getComponentById(componentId);
    const safeComponentData = serverComp ?? componentData; // fallback a lo que mandó el cliente

    if (!safeComponentData) {
      return socket.emit("game:error", { message: `Componente "${componentId}" no encontrado.` });
    }

    // Retransmitir a TODA la sala
    io.to(rid).emit("buscador:send_component", {
      componentId,
      componentData: safeComponentData,
      sentBy: {
        socketId: socket.id,
        name    : sender?.name ?? "Buscador",
      },
    });

    logger.info(`[buscador:send_component] Retransmitido a sala=${rid}  comp=${componentId}`);
  });


  // ╔══════════════════════════════════════════════════════════════════════════
  // ║  integrador:submit_solution
  // ║  ─────────────────────────────────────────────────────────────────────
  // ║  El Integrador envía su solución ensamblada para validación.
  // ║
  // ║  Payload: { roomId, ticketId, slotMap, totalCost, totalLatency }
  // ║    slotMap: { slot_1: "COMP-001", slot_2: "COMP-004", ... }
  // ║
  // ║  El servidor valida:
  // ║    1. Que el ticketId coincide con el ticket activo de la sala
  // ║    2. Que cada slotId tiene el componentId correcto según solucion_correcta
  // ║    3. Que el costo total ≤ presupuesto_usd
  // ║    4. Que la latencia total ≤ latencia_maxima_ms
  // ║
  // ║  Emit PRIVADO al Integrador: "server:solution_result"
  // ║  Emit a toda la sala (si correcto): "game:ticket_solved"
  // ╚══════════════════════════════════════════════════════════════════════════
  socket.on("integrador:submit_solution", ({
    roomId, ticketId, slotMap, totalCost, totalLatency,
  } = {}) => {
    const rid = roomId ?? socket.data.roomId;
    logger.info(`[integrador:submit_solution] socket=${socket.id}  sala=${rid}  ticket=${ticketId}`);

    // ── 1. Validaciones de contexto ────────────────────────────────────────
    if (!rid || !ticketId || !slotMap) {
      return socket.emit("server:solution_result", {
        correct      : false,
        incorrectSlots: [],
        message      : "Payload incompleto: roomId, ticketId y slotMap son obligatorios.",
      });
    }

    const room = GameConfig.getRoom(rid);

    if (!room) {
      return socket.emit("server:solution_result", {
        correct: false, incorrectSlots: [], message: "Sala no encontrada.",
      });
    }

    if (room.status !== "playing") {
      return socket.emit("server:solution_result", {
        correct: false, incorrectSlots: [], message: "La partida no está activa.",
      });
    }

    // ── 2. Verificar que es el ticket activo ───────────────────────────────
    const activeTicketId = room.gameState?.currentTicketId;
    if (ticketId !== activeTicketId) {
      logger.warn(`[submit_solution] ticketId enviado (${ticketId}) ≠ activo (${activeTicketId})`);
      return socket.emit("server:solution_result", {
        correct: false,
        incorrectSlots: [],
        message: `El ticket "${ticketId}" ya no es el activo. Ticket actual: "${activeTicketId}".`,
      });
    }

    // ── 3. Obtener escenario con solución (server-side only) ───────────────
    const escenario = GameConfig.getEscenarioById(ticketId);
    if (!escenario) {
      return socket.emit("server:solution_result", {
        correct: false, incorrectSlots: [], message: "Escenario no encontrado en el servidor.",
      });
    }

    const solucionCorrecta  = escenario.solucion_correcta ?? {};
    const slots             = escenario.slots_solucion     ?? [];
    const presupuesto       = escenario.presupuesto_usd;
    const latenciaMaxima    = escenario.latencia_maxima_ms;

    // ── 4. Validación de slots ─────────────────────────────────────────────
    const incorrectSlots = [];

    for (const [slotId, expectedCompId] of Object.entries(solucionCorrecta)) {
      const placedCompId = slotMap[slotId];

      if (placedCompId !== expectedCompId) {
        const slotDef   = slots.find((s) => s.id === slotId);
        const placedComp = placedCompId ? GameConfig.getComponentById(placedCompId) : null;

        incorrectSlots.push({
          slotId,
          slotName  : slotDef?.nombre ?? slotId,
          placed    : placedComp?.nombre ?? (placedCompId ?? "vacío"),
          expected  : null, // No revelar la respuesta correcta al cliente
        });
      }
    }

    // ── 5. Validación de restricciones económicas (recalculada server-side) ─
    const recalcCost    = _recalculateCost(slotMap);
    const recalcLatency = _recalculateLatency(slotMap);

    const overBudget  = recalcCost    > presupuesto;
    const overLatency = recalcLatency > latenciaMaxima;

    const correct = incorrectSlots.length === 0 && !overBudget && !overLatency;

    // ── 6. Construir respuesta ─────────────────────────────────────────────
    let message;
    if (correct) {
      message = `Arquitectura validada ✓ — Costo: $${recalcCost.toLocaleString("es-ES")} · Latencia: ${recalcLatency}ms`;
    } else if (overBudget) {
      message = `Presupuesto excedido: $${recalcCost.toLocaleString("es-ES")} > $${presupuesto.toLocaleString("es-ES")}`;
    } else if (overLatency) {
      message = `Latencia excedida: ${recalcLatency}ms > ${latenciaMaxima}ms`;
    } else {
      message = `${incorrectSlots.length} slot${incorrectSlots.length !== 1 ? "s" : ""} incorrecto${incorrectSlots.length !== 1 ? "s" : ""}. Revisa la asignación de componentes.`;
    }

    logger.info(
      `[submit_solution] resultado=${correct}  sala=${rid}  ticket=${ticketId}  ` +
      `incorrectos=${incorrectSlots.length}  overBudget=${overBudget}  overLat=${overLatency}`
    );

    // Resultado privado al Integrador (incluye detalles del error)
    socket.emit("server:solution_result", {
      correct,
      incorrectSlots,
      message,
      recap: correct
        ? {
            totalCost   : recalcCost,
            totalLatency: recalcLatency,
            score       : _calculateScore(escenario, room.gameState),
          }
        : null,
    });

    // ── 7. Si correcto → notificar a toda la sala y avanzar ticket ─────────
    if (correct) {
      const puntaje = _calculateScore(escenario, room.gameState);
      RoomManager.addScore(rid, puntaje);

      // Broadcast de victoria en este ticket
      io.to(rid).emit("game:ticket_solved", {
        ticketId,
        solvedBy: {
          socketId: socket.id,
          name    : room.players.find((p) => p.socketId === socket.id)?.name ?? "Integrador",
        },
        score   : puntaje,
        totalScore: room.gameState.score,
        recap   : {
          totalCost   : recalcCost,
          totalLatency: recalcLatency,
          explanation : escenario.explicacion_solucion,
        },
      });

      // Avanzar al siguiente ticket tras 4 segundos (tiempo para leer el resultado)
      setTimeout(() => {
        const advance = RoomManager.advanceTicket(rid);

        if (advance.finished) {
          const finalRoom = GameConfig.getRoom(rid);
          io.to(rid).emit("game:finished", {
            totalScore      : finalRoom?.gameState?.score ?? 0,
            ticketsCompleted: finalRoom?.gameState?.ticketsCompleted ?? [],
          });
          logger.info(`[game:finished] sala=${rid}  score=${finalRoom?.gameState?.score}`);
        } else {
          const updatedRoom = GameConfig.getRoom(rid);
          _emitCurrentTicket(io, rid, updatedRoom);
          logger.info(`[advance_ticket] sala=${rid}  next=${advance.nextTicketId}`);
        }
      }, 4000);
    }
  });


  // ╔══════════════════════════════════════════════════════════════════════════
  // ║  analystClue — Escape Room envia pista al Buscador
  // ║  El EscapeRoomStation emite este evento cuando el Analista
  // ║  hace clic en "Enviar al Buscador" sobre un objeto del mapa.
  // ╚══════════════════════════════════════════════════════════════════════════
  socket.on("analystClue", (payload) => {
    const rid = payload.roomId ?? socket.data.roomId;
    if (!rid) return;
    // Reenviar a toda la sala — el BuscadorStation lo escucha
    io.to(rid).emit("analystClue", payload);
    logger.info(`[analystClue] sala=${rid} tag=${payload.clueTag}`);
  });

  // ╔══════════════════════════════════════════════════════════════════════════
  // ║  panicUpdate — Client Director sube/baja el nivel de pánico
  // ║  El ClientDirectorStation emite este evento según el resultado
  // ║  de la negociación con el cliente.
  // ╚══════════════════════════════════════════════════════════════════════════
  socket.on("panicUpdate", ({ roomId, delta } = {}) => {
    const rid = roomId ?? socket.data.roomId;
    if (!rid) return;
    const room = GameConfig.getRoom(rid);
    if (!room) return;

    // Actualizar el pánico de la sala
    room.gameState = room.gameState ?? {};
    const current = room.gameState.panicLevel ?? 0;
    const next    = Math.max(0, Math.min(100, current + delta));
    room.gameState.panicLevel = next;

    // Broadcast a toda la sala
    io.to(rid).emit("game:qte_result", { panicLevel: next });

    // Derrota si llega a 100
    if (next >= 100) {
      io.to(rid).emit("game:panic_defeat");
    }

    logger.info(`[panicUpdate] sala=${rid} delta=${delta} panico=${next}`);
  });

  // ╔══════════════════════════════════════════════════════════════════════════
  // ║  team:chat_message
  // ║  El Analista (u otro jugador) envía un mensaje al chat del equipo.
  // ║  El servidor lo retransmite a toda la sala con timestamp.
  // ╚══════════════════════════════════════════════════════════════════════════
  socket.on("team:chat_message", (msg) => {
    const rid = msg.roomId ?? socket.data.roomId;
    if (!rid) return;
    // Retransmitir a todos en la sala (incluido el emisor para confirmación)
    io.to(rid).emit("team:chat_message", {
      ...msg,
      id: Date.now(),
    });
  });

  // ╔══════════════════════════════════════════════════════════════════════════
  // ║  game:request_current_state
  // ║  ─────────────────────────────────────────────────────────────────────
  // ║  El cliente lo emite al montar GameBoard si activeTicket está vacío.
  // ║  Resuelve la race condition: el socket del Lobby recibió game:ticket_active
  // ║  pero GameBoard aún no existía. El servidor reenvía el estado actual.
  // ║
  // ║  Payload: { roomId }
  // ╚══════════════════════════════════════════════════════════════════════════
  socket.on("game:request_current_state", ({ roomId } = {}) => {
    const rid  = roomId ?? socket.data.roomId;
    const room = GameConfig.getRoom(rid);

    if (!room || room.status !== "playing") return;

    const ticketId     = room.gameState?.currentTicketId;
    const publicTicket = ticketId ? GameConfig.getPublicTicket(ticketId) : null;

    if (!publicTicket) return;

    // Reenviar ticket solo al socket que lo pidió
    socket.emit("game:ticket_active", { ticket: publicTicket });

    // Si es el Analista, reenviar también el briefing privado
    const player = room.players.find((p) => p.socketId === socket.id);
    if (player?.roleId === "analista") {
      const briefing = GameConfig.getAnalystBriefing(ticketId);
      socket.emit("game:analyst_briefing", { ticketId, briefing });
    }

    logger.info(`[game:request_current_state] Reenvío a socket=${socket.id}  ticket=${ticketId}`);
  });

  // ╔══════════════════════════════════════════════════════════════════════════
  // ║  game:qte_response
  // ║  ─────────────────────────────────────────────────────────────────────
  // ║  Respuesta a un Quick Time Event del sistema legacy.
  // ║  Payload: { roomId, qteId, sequence: string[] }
  // ╚══════════════════════════════════════════════════════════════════════════
  socket.on("game:qte_response", ({ roomId, qteId, sequence } = {}) => {
    const rid = roomId ?? socket.data.roomId;
    logger.info(`[game:qte_response] socket=${socket.id}  sala=${rid}  qte=${qteId}`);

    const room = GameConfig.getRoom(rid);
    if (!room || room.status !== "playing") return;

    const qteDef = (GameConfig.getPublicConfig().eventos_qte ?? []).find((q) => q.id === qteId);
    // Usar el JSON completo para la validación
    const qteDefFull = require("../../public/configuracion_juego.json")
      ?.eventos_qte?.find((q) => q.id === qteId);

    if (!qteDefFull) return;

    const expected       = qteDefFull.secuencia_teclas ?? [];
    const responseCorrect = JSON.stringify(sequence) === JSON.stringify(expected);

    if (responseCorrect) {
      // Reducir pánico
      const newPanic = Math.max(0, (room.gameState?.panicLevel ?? 0) - (qteDefFull.recompensa_exito ?? 5));
      room.gameState.panicLevel = newPanic;

      io.to(rid).emit("game:qte_result", {
        qteId, success: true, panicLevel: newPanic,
        message: `QTE resuelto — Pánico reducido a ${newPanic}`,
      });
    } else {
      const newPanic = RoomManager.applyPanic(rid, qteDefFull.penalizacion_fallo ?? 15);

      io.to(rid).emit("game:qte_result", {
        qteId, success: false, panicLevel: newPanic,
        message: `QTE fallido — Pánico aumenta a ${newPanic}`,
      });

      // Si el pánico llega al máximo, fin del juego
      const salaCfg = GameConfig.getSalaConfig();
      if (newPanic >= (salaCfg.nivel_panico_maximo ?? 100)) {
        room.status = "finished";
        io.to(rid).emit("game:panic_defeat", {
          message: GameConfig.getTextos().mensaje_derrota ?? "Sistema colapsado.",
        });
        logger.info(`[game:panic_defeat] sala=${rid}`);
      }
    }
  });
}

// ─── Helpers privados de cálculo ──────────────────────────────────────────────

/**
 * Recalcula el costo total de la solución enviada consultando el JSON
 * del servidor para evitar manipulación de datos desde el cliente.
 */
function _recalculateCost(slotMap) {
  return Object.values(slotMap).reduce((sum, compId) => {
    const comp = GameConfig.getComponentById(compId);
    return sum + (comp?.costo_usd ?? 0);
  }, 0);
}

/**
 * Recalcula la latencia total de la solución server-side.
 */
function _recalculateLatency(slotMap) {
  return Object.values(slotMap).reduce((sum, compId) => {
    const comp = GameConfig.getComponentById(compId);
    return sum + (comp?.latencia_add_ms ?? 0);
  }, 0);
}

/**
 * Calcula el puntaje: puntaje_base + bonus por tiempo restante.
 * El bonus decrece linealmente con el tiempo transcurrido.
 */
function _calculateScore(escenario, gameState) {
  if (!escenario || !gameState) return 0;

  const base        = escenario.puntaje_base    ?? 1000;
  const bonusMax    = escenario.bonus_tiempo     ?? 500;
  const timeLimit   = escenario.tiempo_limite_seg ?? 240;

  const elapsed     = gameState.startedAt
    ? Math.floor((Date.now() - new Date(gameState.startedAt).getTime()) / 1000)
    : timeLimit;

  const timeRatio   = Math.max(0, 1 - elapsed / timeLimit);
  const bonus       = Math.floor(bonusMax * timeRatio);

  return base + bonus;
}

module.exports = { registerGameHandlers };