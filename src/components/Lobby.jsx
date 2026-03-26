"use client";

/**
 * src/components/Lobby.jsx
 * Usa el socket singleton — mismo socketId en Lobby y en GameBoard.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter }         from "next/navigation";
import { getSocket }         from "../lib/socketSingleton";
import { useGameStore }      from "../store/gameStore";

const MAX_PLAYERS = 4;
const MIN_PLAYERS = 1; // 1 para testing solo; cambiar a 2 en producción

// ─── Formas SVG ───────────────────────────────────────────────────────────────
const ROLE_SHAPES = {
  hexagon: ({ color }) => (
    <svg viewBox="0 0 48 48" className="w-10 h-10">
      <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill={color} opacity="0.2" stroke={color} strokeWidth="2"/>
      <polygon points="24,10 38,18 38,30 24,38 10,30 10,18" fill={color} opacity="0.5"/>
    </svg>
  ),
  circle: ({ color }) => (
    <svg viewBox="0 0 48 48" className="w-10 h-10">
      <circle cx="24" cy="24" r="20" fill={color} opacity="0.2" stroke={color} strokeWidth="2"/>
      <circle cx="24" cy="24" r="12" fill={color} opacity="0.6"/>
    </svg>
  ),
  square: ({ color }) => (
    <svg viewBox="0 0 48 48" className="w-10 h-10">
      <rect x="4" y="4" width="40" height="40" rx="4" fill={color} opacity="0.2" stroke={color} strokeWidth="2"/>
      <rect x="12" y="12" width="24" height="24" rx="2" fill={color} opacity="0.6"/>
    </svg>
  ),
  diamond: ({ color }) => (
    <svg viewBox="0 0 48 48" className="w-10 h-10">
      <polygon points="24,2 46,24 24,46 2,24" fill={color} opacity="0.2" stroke={color} strokeWidth="2"/>
      <polygon points="24,10 38,24 24,38 10,24" fill={color} opacity="0.6"/>
    </svg>
  ),
};

function RoleCard({ role, isSelected, isTaken, takenBy, onClick }) {
  const Shape = ROLE_SHAPES[role.icono_forma] || ROLE_SHAPES.circle;
  return (
    <button
      onClick={() => !isTaken && onClick(role.id)}
      disabled={isTaken}
      className={[
        "relative flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200",
        "focus:outline-none",
        isTaken   ? "opacity-50 cursor-not-allowed border-gray-700 bg-gray-800/30"
        : isSelected ? "bg-gray-800/70 shadow-lg scale-[1.02] cursor-pointer"
        :              "border-gray-700 bg-gray-800/30 hover:bg-gray-800/60 hover:border-gray-500 cursor-pointer",
      ].join(" ")}
      style={isSelected ? { borderColor: role.color } : {}}
    >
      {isTaken && (
        <span className="absolute top-2 right-2 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
          {takenBy || "Ocupado"}
        </span>
      )}
      <div className="flex items-center gap-3">
        <Shape color={role.color} />
        <div>
          <p className="font-bold text-sm" style={{ color: role.color }}>{role.nombre}</p>
          <p className="text-xs text-gray-400 font-mono">{role.alias_juego}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{role.descripcion}</p>
      {isSelected && (
        <ul className="mt-1 space-y-1">
          {role.responsabilidades.slice(0, 3).map((r, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
              <span style={{ color: role.color }} className="mt-0.5 shrink-0">▸</span>{r}
            </li>
          ))}
        </ul>
      )}
      {isSelected && (
        <div className="absolute bottom-2 right-3 text-xs font-bold" style={{ color: role.color }}>
          ✓ Seleccionado
        </div>
      )}
    </button>
  );
}

function PlayerAvatar({ player, rolesMap }) {
  const role  = rolesMap[player.roleId];
  const Shape = role ? (ROLE_SHAPES[role.icono_forma] || ROLE_SHAPES.circle) : null;
  return (
    <div className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-2">
      {Shape ? <Shape color={role.color} /> : (
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
          <span className="text-gray-400 text-xs">?</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{player.name}</p>
        <p className="text-xs text-gray-400 truncate">{role ? role.nombre : "Sin rol"}</p>
      </div>
      {player.isReady && <span className="ml-auto text-green-400 text-xs font-bold shrink-0">✓ Listo</span>}
    </div>
  );
}

function ConnectionStatus({ status }) {
  const cfg = {
    connecting: { dot: "bg-yellow-400 animate-pulse", text: "Conectando...", color: "text-yellow-400" },
    connected:  { dot: "bg-green-400",                text: "Conectado",     color: "text-green-400"  },
    error:      { dot: "bg-red-400",                  text: "Sin conexión",  color: "text-red-400"    },
    idle:       { dot: "bg-gray-600",                 text: "Desconectado",  color: "text-gray-500"   },
  }[status] || { dot: "bg-gray-600", text: "—", color: "text-gray-500" };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className={`text-xs font-mono ${cfg.color}`}>{cfg.text}</span>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function Lobby() {
  const router = useRouter();
  const { setPlayerIdentity, setRoomState: storeSetRoomState,
          upsertPlayer, removePlayer, refreshHostStatus,
          setGameConfig: storeSetGameConfig } = useGameStore();

  // ── Socket singleton ────────────────────────────────────────────────────────
  const socket = getSocket();

  // ── Estado local ────────────────────────────────────────────────────────────
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [errorMsg,          setErrorMsg]         = useState("");
  const [isJoining,         setIsJoining]        = useState(false);
  const [isReady,           setIsReady]          = useState(false);
  const [localRoomState,    setLocalRoomState]   = useState(null);
  const [playerName,        setPlayerName]       = useState("");
  const [roomCode,          setRoomCode]         = useState("");
  const [selectedRoleId,    setSelectedRoleId]   = useState(null);
  const [isCreatingRoom,    setIsCreatingRoom]   = useState(true);
  const [gameConfig,        setGameConfig]       = useState(null);
  const [configLoading,     setConfigLoading]    = useState(true);

  // ── Cargar JSON ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/configuracion_juego.json")
      .then((r) => r.json())
      .then((data) => { setGameConfig(data); storeSetGameConfig(data); })
      .catch(() => setErrorMsg("No se pudo cargar la configuración. Recarga la página."))
      .finally(() => setConfigLoading(false));
  }, [storeSetGameConfig]);

  // ── Conectar socket y registrar eventos ────────────────────────────────────
  useEffect(() => {
    // Conectar si no está conectado
    if (!socket.connected) {
      setConnectionStatus("connecting");
      socket.connect();
    } else {
      setConnectionStatus("connected");
    }

    const onConnect = () => { setConnectionStatus("connected"); setErrorMsg(""); };
    const onDisconnect = () => setConnectionStatus("idle");
    const onConnectError = (err) => {
      setConnectionStatus("error");
      setErrorMsg(`Sin conexión al servidor: ${err.message}`);
    };
    const onRoomState = (state) => {
      setLocalRoomState(state);
      storeSetRoomState(state, socket.id);
      setIsJoining(false);
      setErrorMsg("");
    };
    const onRoomError = ({ message }) => { setErrorMsg(message); setIsJoining(false); };
    const onPlayerUpdated = (p) => {
      upsertPlayer(p);
      setLocalRoomState((prev) => prev
        ? { ...prev, players: prev.players.map((pl) => pl.socketId === p.socketId ? p : pl) }
        : prev);
    };
    const onPlayerJoined = ({ players }) => {
      players.forEach(upsertPlayer);
      setLocalRoomState((prev) => prev ? { ...prev, players } : prev);
    };
    const onPlayerLeft = ({ socketId, players, newHostId }) => {
      removePlayer(socketId);
      if (newHostId) refreshHostStatus(newHostId);
      setLocalRoomState((prev) => prev ? { ...prev, players } : prev);
    };
    // game:start — el socket singleton sigue vivo durante la navegación
    const onGameStart = ({ roomId }) => router.push(`/game/${roomId}`);

    socket.on("connect",              onConnect);
    socket.on("disconnect",           onDisconnect);
    socket.on("connect_error",        onConnectError);
    socket.on("room:state",           onRoomState);
    socket.on("room:error",           onRoomError);
    socket.on("room:player_updated",  onPlayerUpdated);
    socket.on("room:player_joined",   onPlayerJoined);
    socket.on("room:player_left",     onPlayerLeft);
    socket.on("game:start",           onGameStart);

    return () => {
      // Solo quitar los listeners del Lobby — NO desconectar el socket
      socket.off("connect",             onConnect);
      socket.off("disconnect",          onDisconnect);
      socket.off("connect_error",       onConnectError);
      socket.off("room:state",          onRoomState);
      socket.off("room:error",          onRoomError);
      socket.off("room:player_updated", onPlayerUpdated);
      socket.off("room:player_joined",  onPlayerJoined);
      socket.off("room:player_left",    onPlayerLeft);
      socket.off("game:start",          onGameStart);
    };
  }, [socket, router, storeSetRoomState, upsertPlayer, removePlayer, refreshHostStatus]);

  // ── Derivados ───────────────────────────────────────────────────────────────
  const rolesMap = gameConfig
    ? Object.fromEntries(gameConfig.roles.map((r) => [r.id, r]))
    : {};

  const takenRoles = localRoomState
    ? Object.fromEntries(
        localRoomState.players
          .filter((p) => p.roleId && p.socketId !== socket.id)
          .map((p) => [p.roleId, p.name])
      )
    : {};

  const isHost          = localRoomState?.players[0]?.socketId === socket.id;
  const canJoin         = playerName.trim().length >= 2 && !!selectedRoleId && connectionStatus === "connected" && !isJoining && !localRoomState;
  const canJoinExisting = canJoin && !isCreatingRoom && roomCode.trim().length === 6;
  const canToggleReady  = !!localRoomState && !!selectedRoleId && !isJoining;
  const allPlayersReady = !!localRoomState && localRoomState.players.length >= MIN_PLAYERS && localRoomState.players.every((p) => p.isReady);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreateRoom = useCallback(() => {
    if (!canJoin) return;
    setIsJoining(true);
    setErrorMsg("");
    setPlayerIdentity(playerName.trim(), selectedRoleId);
    socket.emit("room:create", { playerName: playerName.trim(), roleId: selectedRoleId });
  }, [canJoin, socket, playerName, selectedRoleId, setPlayerIdentity]);

  const handleJoinRoom = useCallback(() => {
    if (!canJoinExisting) return;
    setIsJoining(true);
    setErrorMsg("");
    setPlayerIdentity(playerName.trim(), selectedRoleId);
    socket.emit("room:join", { roomCode: roomCode.trim().toUpperCase(), playerName: playerName.trim(), roleId: selectedRoleId });
  }, [canJoinExisting, socket, roomCode, playerName, selectedRoleId, setPlayerIdentity]);

  const handleSelectRole = useCallback((roleId) => {
    setSelectedRoleId((prev) => (prev === roleId ? null : roleId));
    if (localRoomState) {
      socket.emit("player:select_role", { roleId });
      setPlayerIdentity(playerName, roleId);
    }
  }, [localRoomState, socket, playerName, setPlayerIdentity]);

  const handleToggleReady = useCallback(() => {
    if (!canToggleReady) return;
    const next = !isReady;
    setIsReady(next);
    socket.emit("player:ready", { isReady: next });
  }, [canToggleReady, isReady, socket]);

  const handleStartGame = useCallback(() => {
    if (!isHost || !allPlayersReady || !localRoomState) return;
    socket.emit("game:request_start", { roomId: localRoomState.roomId });
  }, [isHost, allPlayersReady, socket, localRoomState]);

  const handleLeaveRoom = useCallback(() => {
    socket.emit("room:leave");
    setLocalRoomState(null);
    setIsReady(false);
    setErrorMsg("");
  }, [socket]);

  const handleKeyDown = useCallback((e) => {
    if (e.key !== "Enter") return;
    isCreatingRoom ? handleCreateRoom() : handleJoinRoom();
  }, [isCreatingRoom, handleCreateRoom, handleJoinRoom]);

  // ── Renders de carga / error ────────────────────────────────────────────────
  if (configLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 font-mono text-sm">Cargando configuración...</p>
      </div>
    </div>
  );

  if (!gameConfig) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="text-red-400 text-4xl">⚠</div>
        <p className="text-red-300 font-mono">{errorMsg}</p>
      </div>
    </div>
  );

  // ── Render Principal ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">
              <span className="text-indigo-400">Architecture</span>{" "}
              <span className="text-red-400">Chaos</span>
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{gameConfig.textos_ui.etiqueta_tema}</p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus status={connectionStatus} />
            <a href="/manual" className="text-xs text-gray-400 hover:text-emerald-400 transition-colors border border-gray-700 px-3 py-1.5 rounded-lg hover:border-emerald-600">
              📖 Manual
            </a>
            <a href="/auditoria" className="text-xs text-gray-400 hover:text-indigo-400 transition-colors border border-gray-700 px-3 py-1.5 rounded-lg hover:border-indigo-600">
              {gameConfig.textos_ui.boton_auditoria} →
            </a>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">

          {/* Hero */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">
              {localRoomState ? `Sala: ${localRoomState.roomId}` : "Unirse a la Misión"}
            </h2>
            <p className="text-gray-400 text-sm">
              {localRoomState
                ? `${localRoomState.players.length}/${MAX_PLAYERS} jugadores conectados`
                : gameConfig.textos_ui.subtitulo_juego}
            </p>
          </div>

          {/* Panel pre-sala */}
          {!localRoomState && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tu nombre</label>
                <input
                  type="text" placeholder="Ej: María González"
                  value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={handleKeyDown} maxLength={24}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <div className="flex rounded-xl border border-gray-700 overflow-hidden">
                  <button onClick={() => setIsCreatingRoom(true)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${isCreatingRoom ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
                    Crear sala
                  </button>
                  <button onClick={() => setIsCreatingRoom(false)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${!isCreatingRoom ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
                    Unirse con código
                  </button>
                </div>
                {!isCreatingRoom && (
                  <input
                    type="text" placeholder="Código de sala (6 caracteres)"
                    value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown} maxLength={6}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                )}
              </div>

              <button
                onClick={isCreatingRoom ? handleCreateRoom : handleJoinRoom}
                disabled={isCreatingRoom ? !canJoin : !canJoinExisting}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  (isCreatingRoom ? canJoin : canJoinExisting)
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-[0.98]"
                    : "bg-gray-800 text-gray-600 cursor-not-allowed"
                }`}
              >
                {isJoining
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Conectando...</span>
                  : isCreatingRoom ? gameConfig.textos_ui.boton_iniciar : "Unirse a la Sala"}
              </button>

              {!selectedRoleId && playerName.trim().length >= 2 && (
                <p className="text-xs text-yellow-500 text-center">↑ Selecciona un rol para continuar</p>
              )}
            </div>
          )}

          {/* Panel en sala */}
          {localRoomState && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Código de sala</p>
                  <div className="font-mono text-2xl font-black text-indigo-400 tracking-[0.2em]">{localRoomState.roomId}</div>
                  <p className="text-xs text-gray-600 mt-0.5">Comparte con tu equipo</p>
                </div>
                <button onClick={handleToggleReady} disabled={!canToggleReady}
                  className={`px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${isReady ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>
                  {isReady ? "✓ Listo" : "Marcar Listo"}
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Jugadores listos</span>
                  <span>{localRoomState.players.filter((p) => p.isReady).length}/{localRoomState.players.length}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: localRoomState.players.length ? `${(localRoomState.players.filter((p) => p.isReady).length / localRoomState.players.length) * 100}%` : "0%" }} />
                </div>
              </div>

              {isHost && (
                <button onClick={handleStartGame} disabled={!allPlayersReady}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${allPlayersReady ? "bg-green-600 hover:bg-green-500 text-white shadow-lg active:scale-[0.98]" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}>
                  {allPlayersReady ? "🚀 Iniciar Partida" : `Esperando ${localRoomState.players.length < MIN_PLAYERS ? `${MIN_PLAYERS - localRoomState.players.length} jugador(es) más` : "que todos estén listos"}...`}
                </button>
              )}
              {!isHost && <p className="text-xs text-gray-600 text-center">El host ({localRoomState.players[0]?.name}) iniciará la partida.</p>}

              <button onClick={handleLeaveRoom} className="w-full py-2 text-xs text-gray-600 hover:text-red-400 transition-colors">
                Abandonar sala
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">⚠ {errorMsg}</div>
          )}

          {/* Roles */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Roles disponibles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gameConfig.roles.map((role) => (
                <RoleCard key={role.id} role={role}
                  isSelected={selectedRoleId === role.id}
                  isTaken={Boolean(takenRoles[role.id])}
                  takenBy={takenRoles[role.id]}
                  onClick={handleSelectRole} />
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <aside className="space-y-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Jugadores</h3>
              <span className="text-xs font-mono text-gray-600">{localRoomState?.players.length || 0}/{MAX_PLAYERS}</span>
            </div>
            {localRoomState?.players.length ? (
              <div className="space-y-2">
                {localRoomState.players.map((player, idx) => (
                  <div key={player.socketId} className="relative">
                    <PlayerAvatar player={player} rolesMap={rolesMap} />
                    {idx === 0 && <span className="absolute top-1 right-2 text-xs text-yellow-500">★ Host</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 text-center py-4">Crea o únete a una sala para ver los jugadores.</p>
            )}
            {localRoomState && Array.from({ length: MAX_PLAYERS - localRoomState.players.length }).map((_, i) => (
              <div key={`e-${i}`} className="flex items-center gap-2 border border-dashed border-gray-800 rounded-lg px-3 py-2">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center">
                  <span className="text-gray-700 text-lg">+</span>
                </div>
                <p className="text-xs text-gray-700">Esperando jugador...</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sobre el juego</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{gameConfig._meta.descripcion}</p>
            <div className="space-y-1.5 pt-1">
              {[["Escenarios", gameConfig.escenarios.length], ["Componentes", gameConfig.directorio_componentes.length], ["Jugadores", `${MIN_PLAYERS}–${MAX_PLAYERS}`], ["Versión", gameConfig._meta.version]].map(([l, v]) => (
                <div key={l} className="flex justify-between text-xs">
                  <span className="text-gray-600">{l}</span>
                  <span className="text-gray-300 font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-xs text-gray-700 font-mono">Architecture Chaos v{gameConfig._meta.version} · Portafolio TIC 2026</p>
          <p className="text-xs text-gray-700">{gameConfig._meta.tema}</p>
        </div>
      </footer>
    </div>
  );
}
