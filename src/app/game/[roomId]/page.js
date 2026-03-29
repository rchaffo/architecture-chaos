"use client";

/**
 * src/app/game/[roomId]/page.js
 * GameBoard — Fase 2
 * Conecta los 4 roles: EscapeRoom (Analista), ClientDirector, BuscadorStation, Integrador+Efectos
 */

import { useEffect, useState } from "react";
import { useParams }           from "next/navigation";
import { useGameStore }        from "../../../store/gameStore";
import { useGameSocket }       from "../../../hooks/useSocket";

import EscapeRoomStation       from "../../../components/EscapeRoomStation";
import ClientDirectorStation   from "../../../components/ClientDirectorStation";
import BuscadorStation         from "../../../components/BuscadorStation";
import IntegratorStation       from "../../../components/IntegratorStation";
import {
  IntegratorEffectsProvider,
  IntegratorEffectsStyles,
} from "../../../components/IntegratorEffects";

export default function GameBoard() {
  const { roomId } = useParams();
  const socket = useGameSocket(roomId);

  const {
    playerRole,
    playerName,
    activeTicket,
    analystBriefing,
    gameConfig,
    ticketsCompleted,
    score,
    panicLevel,
  } = useGameStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  // Spinner mientras llega el primer ticket
  if (!activeTicket) {
    return (
      <main className="h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 font-mono text-sm">Cargando misión...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-zinc-950 text-white overflow-hidden">

      {/* ── Analista — Escape Room ── */}
      {playerRole === "analista" && (
        <EscapeRoomStation
          socket={socket}
          soloMode={false}
          activeTicket={activeTicket}
          playerName={playerName}
          roomId={roomId}
        />
      )}

      {/* ── Project Manager → Client Director ── */}
      {playerRole === "project_manager" && (
        <ClientDirectorStation
          socket={socket}
          soloMode={false}
          activeTicket={activeTicket}
          playerName={playerName}
          roomId={roomId}
          panicLevel={panicLevel}
          score={score}
        />
      )}

      {/* ── Buscador — con trivia ── */}
      {playerRole === "buscador" && (
        <BuscadorStation
          socket={socket}
          soloMode={false}
          components={gameConfig?.directorio_componentes ?? []}
          activeTicket={activeTicket}
          roomId={roomId}
          playerName={playerName}
        />
      )}

      {/* ── Integrador — con efectos visuales ── */}
      {playerRole === "integrador" && (
        <>
          <IntegratorEffectsStyles />
          <IntegratorEffectsProvider>
            <IntegratorStation
              activeTicket={activeTicket}
              allComponents={gameConfig?.directorio_componentes ?? []}
              socket={socket}
              roomId={roomId}
              isMyTurn={true}
            />
          </IntegratorEffectsProvider>
        </>
      )}

    </main>
  );
}