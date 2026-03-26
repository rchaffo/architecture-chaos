/**
 * src/hooks/useSocket.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook que:
 *  1. Devuelve siempre el mismo socket singleton (mismo socketId entre páginas)
 *  2. Registra todos los listeners del juego UNA sola vez
 *  3. Al montar en GameBoard, emite "game:request_ticket" para que el servidor
 *     reenvíe el ticket activo — resuelve la race condition de navegación
 * ─────────────────────────────────────────────────────────────────────────────
 */
 
"use client";
 
import { useEffect }    from "react";
import { useRouter }    from "next/navigation";
import { getSocket }    from "../lib/socketSingleton";
import { useGameStore } from "../store/gameStore";
 
export function useSocket() {
  const router  = useRouter();
  const socket  = getSocket();
 
  const {
    setRoomState,
    upsertPlayer,
    removePlayer,
    refreshHostStatus,
    setActiveTicket,
    setAnalystBriefing,
    addToInbox,
    setSolutionResult,
    updateGameMetrics,
  } = useGameStore.getState();
 
  useEffect(() => {
    // Evitar registrar listeners duplicados si el hook se monta varias veces
    if (socket.hasListeners("game:ticket_active")) return;
 
    // ── Sala ────────────────────────────────────────────────────────────────
    socket.on("room:state",          (rs)          => setRoomState(rs, socket.id));
    socket.on("room:player_joined",  ({ players }) => players.forEach(upsertPlayer));
    socket.on("room:player_updated", (player)      => upsertPlayer(player));
    socket.on("room:player_left",    ({ socketId, newHostId }) => {
      removePlayer(socketId);
      if (newHostId) refreshHostStatus(newHostId);
    });
 
    // ── Inicio ───────────────────────────────────────────────────────────────
    socket.on("game:start", ({ roomId }) => {
      router.push(`/game/${roomId}`);
    });
 
    // ── Ticket ───────────────────────────────────────────────────────────────
    socket.on("game:ticket_active",    ({ ticket })   => setActiveTicket(ticket));
    socket.on("game:analyst_briefing", ({ briefing }) => setAnalystBriefing(briefing));
 
    // ── Game loop ────────────────────────────────────────────────────────────
    socket.on("buscador:send_component",  ({ componentData }) => addToInbox(componentData));
    socket.on("server:solution_result",   (result) => {
      setSolutionResult(result);
      if (result.recap) updateGameMetrics({ score: result.recap.score });
    });
    socket.on("game:ticket_solved", ({ totalScore }) => updateGameMetrics({ score: totalScore }));
    socket.on("game:qte_result",    ({ panicLevel }) => updateGameMetrics({ panicLevel }));
 
    // ── Fin ──────────────────────────────────────────────────────────────────
    socket.on("game:finished", ({ totalScore, ticketsCompleted }) => {
      updateGameMetrics({ score: totalScore, ticketsCompleted });
      router.push("/results");
    });
    socket.on("game:panic_defeat", () => router.push("/results"));
 
    // No cleanup: el singleton vive toda la sesión
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps
 
  return socket;
}
 
/**
 * Hook especializado para GameBoard.
 * Además de registrar listeners, pide al servidor el ticket activo
 * por si el cliente llegó aquí después de una navegación (race condition).
 */
export function useGameSocket(roomId) {
  const socket = useSocket();
  const { activeTicket, roomId: storeRoomId } = useGameStore();
 
  useEffect(() => {
    if (!roomId || !socket.connected) return;
    // Si ya tenemos el ticket en el store, no hace falta pedirlo
    if (activeTicket) return;
 
    // Pedir al servidor que reenvíe el estado actual de la partida
    socket.emit("game:request_current_state", { roomId });
  }, [socket, roomId, activeTicket]); // eslint-disable-line react-hooks/exhaustive-deps
 
  return socket;
}