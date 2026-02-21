const { Server } = require('socket.io');
const corsOptions = require('../config/cors');
const playerService = require('../services/playerService');
const matchmakingService = require('../services/matchmakingService');
const gameService = require('../services/gameService');
const gameStore = require('../store/gameStore');

const registerMatchmakingHandler = require('./handlers/matchmakingHandler');
const registerGameHandler = require('./handlers/gameHandler');

/**
 * Create the Socket.IO server and wire up all event handlers.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { ...corsOptions, credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`✅ Player connected: ${socket.id}`);

    // Create a temporary player session
    const player = playerService.createPlayer(socket.id);

    // Immediately tell the client who they are
    socket.emit('player:created', {
      playerId: player.playerId,
      displayName: player.displayName,
    });

    // Register handler groups
    registerMatchmakingHandler(io, socket, player);
    registerGameHandler(io, socket);

    // ── Disconnect ──
    socket.on('disconnect', () => {
      console.log(`❌ Player disconnected: ${socket.id} (${player.displayName})`);

      // Remove from matchmaking queue
      matchmakingService.removeFromQueue(socket.id);

      // Handle ongoing game
      const game = gameStore.getGameBySocketId(socket.id);
      if (game && (game.status === 'active' || game.status === 'check')) {
        const opponentSocketId = gameService.getOpponentSocketId(game, socket.id);

        // Notify opponent immediately
        io.to(opponentSocketId).emit('player:disconnected', {
          message: 'Opponent disconnected',
        });

        // Grace period: if game still exists after 10 s → opponent wins
        setTimeout(() => {
          const g = gameStore.getGame(game.gameId);
          if (g && (g.status === 'active' || g.status === 'check')) {
            const winner = gameService.getPlayerColor(g, opponentSocketId);

            io.to(opponentSocketId).emit('game:over', {
              result: 'disconnect',
              winner,
              message: 'You win! Opponent disconnected.',
            });

            gameService.endGame(game.gameId);
          }
        }, 10_000);
      }

      // Remove player session
      playerService.removePlayer(socket.id);
    });
  });

  // ── Periodic cleanup: remove games older than 2 hours ──
  setInterval(() => {
    const now = Date.now();
    for (const game of gameStore.getActiveGames()) {
      if (now - game.startTime > 2 * 60 * 60 * 1000) {
        console.log(`🗑️  Cleaning up stale game: ${game.gameId}`);
        gameService.endGame(game.gameId);
      }
    }
  }, 5 * 60 * 1000);

  return io;
}

module.exports = initializeSocket;
