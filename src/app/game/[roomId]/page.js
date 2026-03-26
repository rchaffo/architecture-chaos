"use client";
 
import { useEffect, useState }  from "react";
import { useParams }            from "next/navigation";
import { useGameStore }         from "../../../store/gameStore";
import { useGameSocket }        from "../../../hooks/useSocket";
import DirectoryStation         from "../../../components/DirectoryStation";
import IntegratorStation        from "../../../components/IntegratorStation";
import AnalystStation           from "../../../components/AnalystStation";
import TriageStation            from "../../../components/TriageStation";
 
export default function GameBoard() {
  const { roomId } = useParams();
  const socket     = useGameSocket(roomId);
 
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
 
      {/* ── Buscador ── */}
      {playerRole === "buscador" && (
        <DirectoryStation
          components={gameConfig?.directorio_componentes ?? []}
          activeTicket={activeTicket}
          socket={socket}
          roomId={roomId}
          isMyTurn={true}
        />
      )}
 
      {/* ── Integrador ── */}
      {playerRole === "integrador" && (
        <IntegratorStation
          activeTicket={activeTicket}
          allComponents={gameConfig?.directorio_componentes ?? []}
          socket={socket}
          roomId={roomId}
          isMyTurn={true}
        />
      )}
 
      {/* ── Analista ── */}
      {playerRole === "analista" && (
        <AnalystStation
          activeTicket={activeTicket}
          analystBriefing={analystBriefing}
          socket={socket}
          roomId={roomId}
          playerName={playerName}
          isMyTurn={true}
        />
      )}
 
      {/* ── Project Manager ── */}
      {playerRole === "project_manager" && (
        <TriageStation
          activeTicket={activeTicket}
          allTickets={gameConfig?.escenarios ?? []}
          ticketsCompleted={ticketsCompleted}
          score={score}
          panicLevel={panicLevel}
          roomId={roomId}
        />
      )}
 
    </main>
  );
}