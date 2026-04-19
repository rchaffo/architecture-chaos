"use client";

/**
 * src/components/Lobby.jsx
 * Rediseño visual v2 · Mantiene toda la lógica de socket singleton intacta.
 * Flujo: choose (crear/unirme) → form → room (en sala, esperando start).
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "../lib/socketSingleton";
import { useGameStore } from "../store/gameStore";

const MAX_PLAYERS = 4;
const MIN_PLAYERS = 1; // cambiar a 2 en producción

// Paleta consistente con AuditoriaMode
const C = {
  base: '#0A0E14', surface: '#14181F', raised: '#1C212B',
  border: '#1C212B', borderStrong: '#3A414F',
  text: '#E6E8EC', muted: '#9CA3AF', hint: '#6B7280',
  accent: '#60A5FA', accentDark: '#042C53',
  success: '#34D399', successDark: '#04342C',
  warning: '#FBBF24', danger: '#F87171',
};

const ANIM = `
@keyframes ac-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ac-pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
@keyframes ac-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
@keyframes ac-breath { 0%,100% { opacity: 1; } 50% { opacity: .82; } }
.lob-fadein { animation: ac-fadein .45s ease-out both; }
.lob-pulse-dot { animation: ac-pulse-dot 1.4s ease-in-out infinite; }
.lob-spin { animation: ac-spin 1s linear infinite; }
.lob-breath { animation: ac-breath 2.4s ease-in-out infinite; }
.lob-btn { transition: transform .12s ease, opacity .15s ease, border-color .15s ease, background .15s ease; cursor: pointer; }
.lob-btn:hover:not(:disabled) { opacity: .92; }
.lob-btn:active:not(:disabled) { transform: scale(.98); }
.lob-card { transition: transform .15s ease, border-color .15s ease, background .15s ease; cursor: pointer; }
.lob-card:hover:not(:disabled) { transform: translateY(-2px); border-color: ${C.borderStrong}; }
.lob-role { transition: transform .12s ease, border-color .15s ease, background .15s ease; }
.lob-role:hover:not(:disabled) { transform: translateY(-1px); }
.lob-input:focus { border-color: ${C.accent}; outline: none; }
`;

// ─── Formas SVG por rol ────────────────────────────────────────────────────
const ROLE_SHAPES = {
  hexagon: ({ color, size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill={color} opacity="0.2" stroke={color} strokeWidth="2" />
      <polygon points="24,10 38,18 38,30 24,38 10,30 10,18" fill={color} opacity="0.5" />
    </svg>
  ),
  circle: ({ color, size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill={color} opacity="0.2" stroke={color} strokeWidth="2" />
      <circle cx="24" cy="24" r="12" fill={color} opacity="0.6" />
    </svg>
  ),
  square: ({ color, size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <rect x="4" y="4" width="40" height="40" rx="4" fill={color} opacity="0.2" stroke={color} strokeWidth="2" />
      <rect x="12" y="12" width="24" height="24" rx="2" fill={color} opacity="0.6" />
    </svg>
  ),
  diamond: ({ color, size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <polygon points="24,2 46,24 24,46 2,24" fill={color} opacity="0.2" stroke={color} strokeWidth="2" />
      <polygon points="24,10 38,24 24,38 10,24" fill={color} opacity="0.6" />
    </svg>
  ),
};
function Shape({ kind, color, size }) {
  const Cmp = ROLE_SHAPES[kind] || ROLE_SHAPES.circle;
  return <Cmp color={color} size={size} />;
}

// ─── Componente Principal ──────────────────────────────────────────────────
export default function Lobby() {
  const router = useRouter();
  const {
    setPlayerIdentity,
    setRoomState: storeSetRoomState,
    upsertPlayer, removePlayer, refreshHostStatus,
    setGameConfig: storeSetGameConfig,
  } = useGameStore();

  const socket = getSocket();

  // ── Estado (lógica original intacta) ─────────────────────────────────────
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [localRoomState, setLocalRoomState] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(true);
  const [gameConfig, setGameConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  // NUEVO: paso del flujo — 'choose' o 'form'. Cuando hay localRoomState, se muestra pantalla de sala.
  const [lobbyStep, setLobbyStep] = useState('choose');

  // ── Cargar JSON (igual que original) ─────────────────────────────────────
  useEffect(() => {
    fetch("/configuracion_juego.json")
      .then((r) => r.json())
      .then((data) => { setGameConfig(data); storeSetGameConfig(data); })
      .catch(() => setErrorMsg("No se pudo cargar la configuración. Recarga la página."))
      .finally(() => setConfigLoading(false));
  }, [storeSetGameConfig]);

  // ── Socket + listeners (igual que original) ──────────────────────────────
  useEffect(() => {
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
    const onGameStart = ({ roomId }) => router.push(`/game/${roomId}`);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("room:state", onRoomState);
    socket.on("room:error", onRoomError);
    socket.on("room:player_updated", onPlayerUpdated);
    socket.on("room:player_joined", onPlayerJoined);
    socket.on("room:player_left", onPlayerLeft);
    socket.on("game:start", onGameStart);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("room:state", onRoomState);
      socket.off("room:error", onRoomError);
      socket.off("room:player_updated", onPlayerUpdated);
      socket.off("room:player_joined", onPlayerJoined);
      socket.off("room:player_left", onPlayerLeft);
      socket.off("game:start", onGameStart);
    };
  }, [socket, router, storeSetRoomState, upsertPlayer, removePlayer, refreshHostStatus]);

  // ── Derivados ────────────────────────────────────────────────────────────
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

  const isHost = localRoomState?.players[0]?.socketId === socket.id;
  const canJoin = playerName.trim().length >= 2 && !!selectedRoleId && connectionStatus === "connected" && !isJoining && !localRoomState;
  const canJoinExisting = canJoin && !isCreatingRoom && roomCode.trim().length === 6;
  const canToggleReady = !!localRoomState && !!selectedRoleId && !isJoining;
  const allPlayersReady = !!localRoomState && localRoomState.players.length >= MIN_PLAYERS && localRoomState.players.every((p) => p.isReady);

  // ── Handlers (igual que original) ────────────────────────────────────────
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
    setLobbyStep('choose');
    setSelectedRoleId(null);
    setRoomCode("");
  }, [socket]);

  const handleKeyDown = useCallback((e) => {
    if (e.key !== "Enter") return;
    isCreatingRoom ? handleCreateRoom() : handleJoinRoom();
  }, [isCreatingRoom, handleCreateRoom, handleJoinRoom]);

  // ── Renders de carga / error ─────────────────────────────────────────────
  if (configLoading) {
    return (
      <FullScreen>
        <style dangerouslySetInnerHTML={{ __html: ANIM }} />
        <div style={{ textAlign: 'center' }}>
          <div className="lob-spin" style={{ width: 32, height: 32, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px' }} />
          <p style={{ color: C.muted, fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>Cargando configuración…</p>
        </div>
      </FullScreen>
    );
  }
  if (!gameConfig) {
    return (
      <FullScreen>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: C.danger, fontSize: 32, marginBottom: 10 }}>⚠</div>
          <p style={{ color: C.danger, fontFamily: 'ui-monospace, monospace' }}>{errorMsg}</p>
        </div>
      </FullScreen>
    );
  }

  // Determinar la pantalla activa
  const activeScreen = localRoomState ? 'room' : lobbyStep;

  return (
    <div style={{ minHeight: '100vh', background: C.base, color: C.text, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      {/* Header */}
      <Header connectionStatus={connectionStatus} textos={gameConfig.textos_ui} />

      {/* Body */}
      <main style={{ flex: 1, maxWidth: 960, margin: '0 auto', width: '100%', padding: '32px 20px' }}>
        {activeScreen === 'choose' && (
          <ChooseScreen
            onCreate={() => { setIsCreatingRoom(true); setLobbyStep('form'); }}
            onJoin={() => { setIsCreatingRoom(false); setLobbyStep('form'); }}
            gameConfig={gameConfig}
          />
        )}

        {activeScreen === 'form' && (
          <FormScreen
            mode={isCreatingRoom ? 'create' : 'join'}
            gameConfig={gameConfig}
            playerName={playerName} setPlayerName={setPlayerName}
            roomCode={roomCode} setRoomCode={setRoomCode}
            selectedRoleId={selectedRoleId}
            onSelectRole={handleSelectRole}
            takenRoles={takenRoles}
            onKeyDown={handleKeyDown}
            canJoin={isCreatingRoom ? canJoin : canJoinExisting}
            isJoining={isJoining}
            onSubmit={isCreatingRoom ? handleCreateRoom : handleJoinRoom}
            onBack={() => setLobbyStep('choose')}
            errorMsg={errorMsg}
          />
        )}

        {activeScreen === 'room' && localRoomState && (
          <RoomScreen
            roomState={localRoomState}
            rolesMap={rolesMap}
            gameConfig={gameConfig}
            selectedRoleId={selectedRoleId}
            onSelectRole={handleSelectRole}
            takenRoles={takenRoles}
            isHost={isHost}
            isReady={isReady}
            canToggleReady={canToggleReady}
            onToggleReady={handleToggleReady}
            allPlayersReady={allPlayersReady}
            onStartGame={handleStartGame}
            onLeave={handleLeaveRoom}
            mySocketId={socket.id}
            errorMsg={errorMsg}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '14px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 11, color: C.hint, fontFamily: 'ui-monospace, monospace', margin: 0 }}>Architecture Chaos v{gameConfig._meta.version} · Portafolio TIC 2026</p>
          <p style={{ fontSize: 11, color: C.hint, margin: 0 }}>Juego hecho por <span style={{ color: C.muted }}>Renzo Mauricio Renato Chaffo Vega</span></p>
        </div>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SUBCOMPONENTES
// ════════════════════════════════════════════════════════════════════════════

function Header({ connectionStatus, textos }) {
  const cfg = {
    connecting: { dot: C.warning, text: "Conectando…", pulse: true },
    connected:  { dot: C.success, text: "Conectado",    pulse: false },
    error:      { dot: C.danger,  text: "Sin conexión", pulse: false },
    idle:       { dot: C.hint,    text: "Desconectado", pulse: false },
  }[connectionStatus] || { dot: C.hint, text: "—", pulse: false };

  return (
    <header style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#818CF8' }}>Architecture</span>{' '}
            <span style={{ color: C.danger }}>Chaos</span>
          </h1>
          <p style={{ fontSize: 11, color: C.hint, fontFamily: 'ui-monospace, monospace', margin: '2px 0 0' }}>{textos.etiqueta_tema}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={cfg.pulse ? 'lob-pulse-dot' : ''} style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot }} />
            <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: cfg.dot }}>{cfg.text}</span>
          </div>
          <a href="/manual" className="lob-btn" style={{ fontSize: 12, color: C.text, border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}>Manual</a>
          <a href="/auditoria" className="lob-btn" style={{ fontSize: 12, color: C.accent, border: `1px solid ${C.accent}55`, padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}>{textos.boton_auditoria} →</a>
        </div>
      </div>
    </header>
  );
}

// ─── Pantalla 1: Choose (Crear o Unirme) ───────────────────────────────────
function ChooseScreen({ onCreate, onJoin, gameConfig }) {
  return (
    <div className="lob-fadein" style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.2em', fontWeight: 500, marginBottom: 10 }}>
          BANKING ARCHITECTURE TRAINING · BIAN v14
        </div>
        <h2 style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.15, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
          Capacita a tu equipo en<br />arquitectura bancaria
        </h2>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>
          {gameConfig.textos_ui.subtitulo_juego}
        </p>
      </div>

      {/* Dos cards grandes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
        <button onClick={onCreate} className="lob-card" style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '28px 24px',
          textAlign: 'left', color: C.text, fontFamily: 'inherit',
        }}>
          <div style={{ width: 40, height: 40, background: `${C.accent}1A`, border: `1px solid ${C.accent}55`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 2 V14 M2 8 H14" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" /></svg>
          </div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>NUEVA PARTIDA</div>
          <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>Crear sala</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Empieza una partida nueva y comparte el código con tu equipo (hasta {MAX_PLAYERS} jugadores).</div>
          <div style={{ marginTop: 16, fontSize: 12, color: C.accent, fontWeight: 500 }}>Crear →</div>
        </button>

        <button onClick={onJoin} className="lob-card" style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '28px 24px',
          textAlign: 'left', color: C.text, fontFamily: 'inherit',
        }}>
          <div style={{ width: 40, height: 40, background: `${C.success}1A`, border: `1px solid ${C.success}55`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 8 H13 M9 4 L13 8 L9 12" stroke={C.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>TENGO UN CÓDIGO</div>
          <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>Unirme a una sala</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Introduce el código de 6 caracteres que te compartieron para entrar a una partida existente.</div>
          <div style={{ marginTop: 16, fontSize: 12, color: C.success, fontWeight: 500 }}>Unirme →</div>
        </button>
      </div>

      {/* Stats del juego */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatSmall label="ROLES" value="4" />
        <StatSmall label="ESCENARIOS" value={gameConfig.escenarios.length} />
        <StatSmall label="COMPONENTES" value={gameConfig.directorio_componentes.length} />
        <StatSmall label="JUGADORES" value={`${MIN_PLAYERS}–${MAX_PLAYERS}`} />
      </div>

      {/* Vista previa de roles */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 14 }}>LOS 4 ROLES DEL JUEGO</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {gameConfig.roles.map(role => (
            <div key={role.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ marginBottom: 8 }}><Shape kind={role.icono_forma} color={role.color} size={32} /></div>
              <div style={{ fontSize: 12, fontWeight: 500, color: role.color, lineHeight: 1.2 }}>{role.nombre}</div>
              <div style={{ fontSize: 10, color: C.hint, fontFamily: 'ui-monospace, monospace', marginTop: 3 }}>{role.alias_juego}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Pantalla 2: Form (datos + rol) ────────────────────────────────────────
function FormScreen({ mode, gameConfig, playerName, setPlayerName, roomCode, setRoomCode, selectedRoleId, onSelectRole, takenRoles, onKeyDown, canJoin, isJoining, onSubmit, onBack, errorMsg }) {
  const isCreate = mode === 'create';
  const title = isCreate ? 'Crear sala nueva' : 'Unirme a una sala';
  const subtitle = isCreate ? 'Configura tu jugador y elige un rol. Al crear, obtendrás un código para compartir.' : 'Introduce el código que te compartieron, elige tu nombre y rol.';

  return (
    <div className="lob-fadein" style={{ maxWidth: 760, margin: '0 auto' }}>
      <button onClick={onBack} className="lob-btn" style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 13, marginBottom: 18, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Volver
      </button>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: isCreate ? C.accent : C.success, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>
          {isCreate ? 'NUEVA PARTIDA' : 'TENGO UN CÓDIGO'}
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 500, margin: '0 0 6px', letterSpacing: '-0.01em' }}>{title}</h2>
        <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }}>{subtitle}</p>
      </div>

      {/* Datos básicos */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <div style={{ marginBottom: isCreate ? 0 : 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8 }}>TU NOMBRE</label>
          <input
            type="text"
            className="lob-input"
            placeholder="Ej: María González"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={24}
            style={{ width: '100%', boxSizing: 'border-box', background: C.raised, border: `1px solid ${C.border}`, borderRadius: 6, padding: '11px 14px', fontSize: 14, color: C.text, outline: 'none', fontFamily: 'inherit' }}
          />
        </div>

        {!isCreate && (
          <div>
            <label style={{ display: 'block', fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8 }}>CÓDIGO DE SALA</label>
            <input
              type="text"
              className="lob-input"
              placeholder="6 caracteres"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={onKeyDown}
              maxLength={6}
              style={{ width: '100%', boxSizing: 'border-box', background: C.raised, border: `1px solid ${C.border}`, borderRadius: 6, padding: '11px 14px', fontSize: 18, color: C.text, outline: 'none', fontFamily: 'ui-monospace, monospace', textAlign: 'center', letterSpacing: '0.3em' }}
            />
          </div>
        )}
      </div>

      {/* Selector de rol */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 10 }}>ELIGE TU ROL</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {gameConfig.roles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              isSelected={selectedRoleId === role.id}
              isTaken={Boolean(takenRoles[role.id])}
              takenBy={takenRoles[role.id]}
              onClick={onSelectRole}
            />
          ))}
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: `${C.danger}15`, border: `1px solid ${C.danger}55`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.danger, marginBottom: 14 }}>⚠ {errorMsg}</div>
      )}

      {/* Botón principal */}
      <button
        onClick={onSubmit}
        disabled={!canJoin}
        className="lob-btn"
        style={{
          width: '100%',
          background: canJoin ? (isCreate ? C.accent : C.success) : C.raised,
          color: canJoin ? (isCreate ? C.accentDark : C.successDark) : C.hint,
          border: `1px solid ${canJoin ? (isCreate ? C.accent : C.success) : C.borderStrong}`,
          padding: '13px 22px', borderRadius: 8, fontSize: 14, fontWeight: 500,
          cursor: canJoin ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        {isJoining ? (
          <>
            <span className="lob-spin" style={{ width: 14, height: 14, border: `2px solid currentColor`, borderTopColor: 'transparent', borderRadius: '50%' }} />
            Conectando…
          </>
        ) : (
          isCreate ? 'Crear sala →' : 'Unirme a la sala →'
        )}
      </button>

      {!selectedRoleId && playerName.trim().length >= 2 && (
        <p style={{ fontSize: 12, color: C.warning, textAlign: 'center', marginTop: 10 }}>↑ Elige un rol para continuar</p>
      )}
    </div>
  );
}

// ─── Pantalla 3: Room (dentro de la sala) ──────────────────────────────────
function RoomScreen({ roomState, rolesMap, gameConfig, selectedRoleId, onSelectRole, takenRoles, isHost, isReady, canToggleReady, onToggleReady, allPlayersReady, onStartGame, onLeave, mySocketId, errorMsg }) {
  const totalReady = roomState.players.filter(p => p.isReady).length;
  const progress = roomState.players.length > 0 ? (totalReady / roomState.players.length) * 100 : 0;

  return (
    <div className="lob-fadein" style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Header de sala */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>CÓDIGO DE SALA · COMPARTE CON TU EQUIPO</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 32, color: C.accent, fontWeight: 500, letterSpacing: '0.2em' }}>{roomState.roomId}</div>
            <button onClick={() => navigator.clipboard?.writeText(roomState.roomId)} className="lob-btn" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: '6px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'inherit' }} title="Copiar código">
              Copiar
            </button>
          </div>
        </div>
        <button onClick={onLeave} className="lob-btn" style={{ background: 'transparent', border: `1px solid ${C.borderStrong}`, color: C.muted, padding: '8px 14px', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}>
          Abandonar sala
        </button>
      </div>

      {/* Grid de slots de jugadores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 18 }}>
        {Array.from({ length: MAX_PLAYERS }).map((_, idx) => {
          const player = roomState.players[idx];
          if (player) {
            const role = rolesMap[player.roleId];
            const isMe = player.socketId === mySocketId;
            const isHostSlot = idx === 0;
            return (
              <div key={player.socketId} style={{
                background: C.surface,
                border: `1px solid ${isMe ? (role?.color || C.accent) + '88' : C.border}`,
                borderRadius: 10, padding: 14, position: 'relative',
              }}>
                {isHostSlot && (
                  <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, color: C.warning, letterSpacing: '0.08em', fontWeight: 500 }}>★ HOST</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  {role ? <Shape kind={role.icono_forma} color={role.color} size={36} /> : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.raised, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: C.muted, fontSize: 11 }}>?</span>
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.name} {isMe && <span style={{ fontSize: 10, color: C.muted }}>(tú)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: role?.color || C.muted, marginTop: 2 }}>{role ? role.nombre : 'Sin rol'}</div>
                  </div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 500, padding: '4px 8px', borderRadius: 4, display: 'inline-block',
                  background: player.isReady ? `${C.success}20` : `${C.muted}15`,
                  color: player.isReady ? C.success : C.muted,
                }}>
                  {player.isReady ? '✓ Listo' : 'Esperando…'}
                </div>
              </div>
            );
          }
          return (
            <div key={`empty-${idx}`} style={{ background: 'transparent', border: `1px dashed ${C.border}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 102 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px dashed ${C.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <span style={{ color: C.hint, fontSize: 18 }}>+</span>
              </div>
              <div style={{ fontSize: 11, color: C.hint }}>Esperando jugador…</div>
            </div>
          );
        })}
      </div>

      {/* Progreso de readys */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.muted, letterSpacing: '0.05em' }}>Jugadores listos</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: C.text, fontWeight: 500 }}>{totalReady} / {roomState.players.length}</span>
        </div>
        <div style={{ height: 5, background: C.raised, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? C.success : C.accent, transition: 'width .4s ease, background .3s ease' }} />
        </div>
      </div>

      {/* Controles */}
      <div style={{ display: 'grid', gridTemplateColumns: isHost ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 16 }}>
        <button
          onClick={onToggleReady}
          disabled={!canToggleReady}
          className="lob-btn"
          style={{
            background: isReady ? C.success : C.raised,
            color: isReady ? C.successDark : C.text,
            border: `1px solid ${isReady ? C.success : C.borderStrong}`,
            padding: '13px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            cursor: canToggleReady ? 'pointer' : 'not-allowed',
          }}
        >
          {isReady ? '✓ Estás listo (click para cancelar)' : 'Marcar como listo'}
        </button>

        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!allPlayersReady}
            className={allPlayersReady ? 'lob-btn lob-breath' : 'lob-btn'}
            style={{
              background: allPlayersReady ? C.accent : C.raised,
              color: allPlayersReady ? C.accentDark : C.hint,
              border: `1px solid ${allPlayersReady ? C.accent : C.borderStrong}`,
              padding: '13px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: allPlayersReady ? 'pointer' : 'not-allowed',
            }}
          >
            {allPlayersReady ? 'Iniciar partida →' : (roomState.players.length < MIN_PLAYERS ? `Esperando ${MIN_PLAYERS - roomState.players.length} jugador(es) más` : 'Esperando a que todos estén listos')}
          </button>
        )}
      </div>

      {!isHost && (
        <p style={{ fontSize: 12, color: C.hint, textAlign: 'center', marginBottom: 16 }}>
          El host ({roomState.players[0]?.name}) iniciará la partida cuando todos estén listos.
        </p>
      )}

      {/* Cambio de rol dentro de la sala */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 10 }}>TU ROL · PUEDES CAMBIARLO ANTES DE INICIAR</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {gameConfig.roles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              isSelected={selectedRoleId === role.id}
              isTaken={Boolean(takenRoles[role.id])}
              takenBy={takenRoles[role.id]}
              onClick={onSelectRole}
              compact
            />
          ))}
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: `${C.danger}15`, border: `1px solid ${C.danger}55`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.danger }}>⚠ {errorMsg}</div>
      )}
    </div>
  );
}

// ─── RoleCard rediseñada ───────────────────────────────────────────────────
function RoleCard({ role, isSelected, isTaken, takenBy, onClick, compact }) {
  const disabled = isTaken;
  return (
    <button
      onClick={() => !disabled && onClick(role.id)}
      disabled={disabled}
      className="lob-role"
      style={{
        position: 'relative',
        background: isSelected ? `${role.color}10` : C.surface,
        border: `1px solid ${isSelected ? role.color : C.border}`,
        borderRadius: 10,
        padding: compact ? '12px 14px' : '14px 16px',
        textAlign: 'left',
        color: C.text,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      {isTaken && (
        <span style={{
          position: 'absolute', top: 8, right: 10,
          fontSize: 10, color: C.muted,
          background: C.raised, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '0.03em',
        }}>
          {takenBy || 'Ocupado'}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Shape kind={role.icono_forma} color={role.color} size={compact ? 32 : 36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: role.color, lineHeight: 1.2 }}>{role.nombre}</div>
          <div style={{ fontSize: 10, color: C.hint, fontFamily: 'ui-monospace, monospace', marginTop: 2 }}>{role.alias_juego}</div>
        </div>
        {isSelected && (
          <span style={{ fontSize: 11, color: role.color, fontWeight: 500 }}>✓</span>
        )}
      </div>
      {!compact && (
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {role.descripcion}
        </p>
      )}
    </button>
  );
}

// ─── StatSmall helper ──────────────────────────────────────────────────────
function StatSmall({ label, value }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 18, color: C.text, fontWeight: 500, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── FullScreen helper (para loading/error) ────────────────────────────────
function FullScreen({ children }) {
  return <div style={{ minHeight: '100vh', background: C.base, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>{children}</div>;
}
