const matchmakingService = require('../../services/matchmakingService');
const playerService = require('../../services/playerService');
const queueStore = require('../../store/queueStore');

/**
 * Register matchmaking socket events.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {object} player  – the player record created on connection
 */
function registerMatchmakingHandler(io, socket, player) {
  // ── Join the matchmaking queue ──
  socket.on('matchmaking:join', () => {
    console.log(`🔍 ${player.displayName} joining matchmaking…`);

    playerService.setSearching(socket.id);

    socket.emit('matchmaking:searching', {
      displayName: player.displayName,
      queuePosition: queueStore.size + 1,
    });

    const result = matchmakingService.addAndTryMatch(player);

    if (result.matched) {
      startGame(io, result);
    } else {
      const status = matchmakingService.getQueueStatus(socket.id);
      socket.emit('matchmaking:waiting', {
        queuePosition: status.position,
        totalInQueue: status.total,
      });
    }
  });

  // ── Cancel search ──
  socket.on('matchmaking:cancel', () => {
    console.log(`❌ ${player.displayName} cancelled matchmaking`);
    matchmakingService.removeFromQueue(socket.id);
    playerService.setIdle(socket.id);
    socket.emit('matchmaking:cancelled');
  });
}

/**
 * Notify both players that a game has started.
 */
function startGame(io, { game, player1, player2 }) {
  console.log(`🎮 Match found! ${player1.displayName} vs ${player2.displayName}`);

  // Update statuses
  playerService.setInGame(player1.socketId, game.gameId);
  playerService.setInGame(player2.socketId, game.gameId);

  // Join the Socket.IO room for this game
  io.sockets.sockets.get(player1.socketId)?.join(game.gameId);
  io.sockets.sockets.get(player2.socketId)?.join(game.gameId);

  // Tell each player their colour and opponent
  const colorOf = (sid) =>
    game.players.white.socketId === sid ? 'white' : 'black';

  io.to(player1.socketId).emit('matchmaking:found', {
    gameId: game.gameId,
    yourColor: colorOf(player1.socketId),
    opponent: player2.displayName,
    timeControl: { initial: 600, increment: 0 },
  });

  io.to(player2.socketId).emit('matchmaking:found', {
    gameId: game.gameId,
    yourColor: colorOf(player2.socketId),
    opponent: player1.displayName,
    timeControl: { initial: 600, increment: 0 },
  });

  // Broadcast game:started to the room
  io.to(game.gameId).emit('game:started', {
    gameId: game.gameId,
    players: {
      white: { displayName: game.players.white.displayName },
      black: { displayName: game.players.black.displayName },
    },
    initialFEN: game.fen,
    currentTurn: 'white',
  });
}

module.exports = registerMatchmakingHandler;
