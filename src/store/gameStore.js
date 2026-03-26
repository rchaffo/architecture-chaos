/**
 * src/store/gameStore.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Store global Zustand para Architecture Chaos.
 *
 * Estructura real del proyecto:
 *   src/
 *     store/gameStore.js       ← este archivo
 *     hooks/useSocket.js
 *     components/...
 *     app/game/[roomId]/page.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from "zustand";

const INITIAL_ROOM = {
  playerName : "",
  playerRole : null,   // "project_manager" | "analista" | "buscador" | "integrador"
  socketId   : null,
  roomId     : null,
  players    : [],
  roomStatus : "idle", // "idle" | "waiting" | "playing" | "finished"
  isHost     : false,
};

const INITIAL_GAME = {
  activeTicket    : null,
  analystBriefing : null,
  inbox           : [],   // componentes recibidos del Buscador → Inbox del Integrador
  score           : 0,
  panicLevel      : 0,
  ticketsCompleted: [],
  solutionResult  : null, // { correct, message, incorrectSlots, recap }
  gameConfig      : null, // config pública cargada del servidor
};

export const useGameStore = create((set) => ({
  ...INITIAL_ROOM,
  ...INITIAL_GAME,

  // ── Room ──────────────────────────────────────────────────────────────────

  setPlayerIdentity(name, role) {
    set({ playerName: name, playerRole: role });
  },

  setRoomState(roomState, mySocketId) {
    set({
      roomId    : roomState.roomId,
      players   : roomState.players  ?? [],
      roomStatus: roomState.status   ?? "waiting",
      socketId  : mySocketId,
      isHost    : roomState.players?.[0]?.socketId === mySocketId,
    });
  },

  upsertPlayer(player) {
    set((state) => {
      const exists = state.players.find((p) => p.socketId === player.socketId);
      return {
        players: exists
          ? state.players.map((p) => p.socketId === player.socketId ? player : p)
          : [...state.players, player],
      };
    });
  },

  removePlayer(socketId) {
    set((state) => ({
      players: state.players.filter((p) => p.socketId !== socketId),
    }));
  },

  refreshHostStatus(newHostId) {
    set((state) => ({ isHost: state.socketId === newHostId }));
  },

  // ── Game ──────────────────────────────────────────────────────────────────

  setActiveTicket(ticket) {
    set({ activeTicket: ticket, inbox: [], solutionResult: null });
  },

  setAnalystBriefing(briefing) {
    set({ analystBriefing: briefing });
  },

  addToInbox(componentData) {
    set((state) => {
      if (state.inbox.find((c) => c.id === componentData.id)) return state;
      return { inbox: [...state.inbox, componentData] };
    });
  },

  setSolutionResult(result) {
    set({ solutionResult: result });
  },

  updateGameMetrics({ score, panicLevel, ticketsCompleted } = {}) {
    set((state) => ({
      score            : score            ?? state.score,
      panicLevel       : panicLevel       ?? state.panicLevel,
      ticketsCompleted : ticketsCompleted ?? state.ticketsCompleted,
    }));
  },

  setGameConfig(config) {
    set({ gameConfig: config });
  },

  // ── Reset ─────────────────────────────────────────────────────────────────

  resetGame() { set({ ...INITIAL_GAME }); },
  resetAll()  { set({ ...INITIAL_ROOM, ...INITIAL_GAME }); },
}));
