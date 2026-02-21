const gameService = require('../../services/gameService');

/**
 * Register in-game socket events (moves, resign, legal-moves).
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function registerGameHandler(io, socket) {
  // ── Make a move ──
  socket.on('game:move', ({ gameId, move }) => {
    try {
      const result = gameService.makeMove(gameId, socket.id, move);
      const game = gameService.getGame(gameId);

      // Broadcast to both players in the room
      io.to(gameId).emit('game:move', {
        move: result.move,
        newFEN: result.newFEN,
        currentTurn: game.currentTurn,
        capturedPiece: result.capturedPiece,
        moveHistory: game.moveHistory,
      });

      // ── Game-ending conditions ──
      if (result.isCheckmate) {
        io.to(gameId).emit('game:over', {
          result: 'checkmate',
          winner: result.winner,
          message: `${result.winner === 'white' ? 'White' : 'Black'} wins by checkmate!`,
        });
        scheduleCleanup(gameId);
      } else if (result.isStalemate) {
        io.to(gameId).emit('game:over', {
          result: 'stalemate',
          message: 'Game drawn by stalemate',
        });
        scheduleCleanup(gameId);
      } else if (result.isDraw) {
        io.to(gameId).emit('game:over', {
          result: 'draw',
          message: 'Game drawn',
        });
        scheduleCleanup(gameId);
      } else if (result.isCheck) {
        io.to(gameId).emit('game:check', {
          color: game.currentTurn, // the side now in check
        });
      }
    } catch (err) {
      socket.emit('error', { code: 'INVALID_MOVE', message: err.message });
    }
  });

  // ── Request legal moves for a square ──
  socket.on('game:getLegalMoves', ({ gameId, square }) => {
    try {
      const moves = gameService.getLegalMoves(gameId, square);
      socket.emit('game:legalMoves', { square, moves });
    } catch (err) {
      socket.emit('error', { code: 'ERROR', message: err.message });
    }
  });

  // ── Resign ──
  socket.on('game:resign', ({ gameId }) => {
    try {
      const { winner, loser } = gameService.resignGame(gameId, socket.id);

      io.to(gameId).emit('game:over', {
        result: 'resignation',
        winner,
        message: `${loser === 'white' ? 'White' : 'Black'} resigned. ${winner === 'white' ? 'White' : 'Black'} wins!`,
      });

      scheduleCleanup(gameId);
    } catch (err) {
      socket.emit('error', { code: 'ERROR', message: err.message });
    }
  });
}

/** Delete the game from memory after a short delay so clients can read the final state. */
function scheduleCleanup(gameId) {
  setTimeout(() => {
    gameService.endGame(gameId);
  }, 5_000);
}

module.exports = registerGameHandler;
