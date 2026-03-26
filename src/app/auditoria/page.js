"use client";

/**
 * src/app/auditoria/page.js
 * Página del Modo Auditoría — Examen de Certificación BIAN
 */

import { useState, useEffect } from "react";
import AuditoriaMode from "../../components/AuditoriaMode";
import { useGameStore } from "../../store/gameStore";

export default function AuditoriaPage() {
  const { playerName, gameConfig, setGameConfig } = useGameStore();
  const [config, setConfig] = useState(gameConfig);
  const [loading, setLoading] = useState(!gameConfig);

  // Cargar el JSON si no está en el store (acceso directo a /auditoria)
  useEffect(() => {
    if (gameConfig) { setConfig(gameConfig); return; }
    fetch("/configuracion_juego.json")
      .then((r) => r.json())
      .then((data) => { setConfig(data); setGameConfig(data); })
      .finally(() => setLoading(false));
  }, [gameConfig, setGameConfig]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 font-mono text-sm">Cargando examen...</p>
        </div>
      </div>
    );
  }

  return (
    <AuditoriaMode
      gameConfig={config}
      playerName={playerName || ""}
    />
  );
}
