/**
 * server/index.js — Architecture Chaos · WebSocket Server
 * ─────────────────────────────────────────────────────────────────────────────
 * Entry point: Express HTTP + Socket.io, montados en el mismo puerto.
 *
 * Inicia con:
 *   node server/index.js
 *   PORT=3001 node server/index.js
 *
 * Variables de entorno opcionales:
 *   PORT          Puerto del servidor            (default: 3001)
 *   CLIENT_ORIGIN URL del cliente Next.js        (default: http://localhost:3000)
 *   NODE_ENV      "production" | "development"   (default: development)
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const http    = require("http");
const express = require("express");
const { Server } = require("socket.io");
const path    = require("path");

const { registerRoomHandlers } = require("./rooms/roomHandlers");
const { registerGameHandlers } = require("./game/gameHandlers");
const GameConfig                = require("./game/GameConfig");
const logger                    = require("./utils/logger");

// ─── Configuración ────────────────────────────────────────────────────────────
const PORT          = parseInt(process.env.PORT ?? "3001", 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";
const IS_DEV        = (process.env.NODE_ENV ?? "development") !== "production";

// ─── Express ──────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

app.use(express.json());

/** Health-check para load balancers y Railway/Render/Fly deploys */
app.get("/health", (_req, res) => {
  res.json({
    status : "ok",
    uptime : Math.floor(process.uptime()),
    rooms  : GameConfig.getRoomCount(),
    players: GameConfig.getTotalPlayerCount(),
  });
});

/** Devuelve los metadatos de configuración del juego (sin soluciones) */
app.get("/api/config", (_req, res) => {
  res.json(GameConfig.getPublicConfig());
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin : CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
  pingTimeout  : 20_000,
  pingInterval : 10_000,
});

// ── Middleware de logging por conexión ────────────────────────────────────────
io.use((socket, next) => {
  logger.info(`[CONNECT] socket=${socket.id}  addr=${socket.handshake.address}`);
  next();
});

// ── Registro de handlers por socket ──────────────────────────────────────────
io.on("connection", (socket) => {
  logger.info(`[SOCKET] connected  id=${socket.id}`);

  // Inyectar referencia a io en el socket para que los handlers puedan
  // emitir a la sala completa sin importar el módulo.
  socket.io = io;

  registerRoomHandlers(socket, io);
  registerGameHandlers(socket, io);

  socket.on("disconnect", (reason) => {
    logger.info(`[SOCKET] disconnected  id=${socket.id}  reason=${reason}`);
  });
});

// ─── Arranque ─────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`────────────────────────────────────────────`);
  logger.info(` Architecture Chaos — Game Server`);
  logger.info(` Puerto   : ${PORT}`);
  logger.info(` Cliente  : ${CLIENT_ORIGIN}`);
  logger.info(` Entorno  : ${IS_DEV ? "development" : "production"}`);
  logger.info(` Config   : ${GameConfig.getSummary()}`);
  logger.info(`────────────────────────────────────────────`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`[SERVER] ${signal} recibido — cerrando...`);
  io.close(() => {
    server.close(() => {
      logger.info("[SERVER] Cerrado limpiamente.");
      process.exit(0);
    });
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
