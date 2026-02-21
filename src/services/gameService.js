const gameStore = require('../store/gameStore');
const { Chess } = require('chess.js');

/**
 * Core game logic service.
 * All chess validation is done server-side via chess.js.
 */
class GameService {
  createGame(player1, player2) {
    return gameStore.createGame(player1, player2);
  }

  getGame(gameId) {
    return gameStore.getGame(gameId);
  }

  /**
   * Apply a move to the given game.
   * @param {string} gameId
   * @param {string} socketId  – the player making the move
   * @param {{ from: string, to: string, promotion?: string }} move
   * @returns {object}  move result + new game status
   */
  makeMove(gameId, socketId, move) {
    const game = gameStore.getGame(gameId);
    if (!game) throw new Error('Game not found');

    const playerColor = this.getPlayerColor(game, socketId);
    if (!playerColor) throw new Error('You are not in this game');
    if (playerColor !== game.currentTurn) throw new Error('Not your turn');

    const chess = new Chess(game.fen);

    let result;
    try {
      result = chess.move(move);
    } catch {
      throw new Error('Illegal move');
    }
    if (!result) throw new Error('Illegal move');

    // Track captured piece
    if (result.captured) {
      game.capturedPieces[playerColor].push(result.captured);
    }

    // Update game state
    game.fen = chess.fen();
    game.currentTurn = game.currentTurn === 'white' ? 'black' : 'white';
    game.lastMoveTime = Date.now();
    game.moveHistory.push({
      moveNumber: Math.floor(game.moveHistory.length / 2) + 1,
      color: playerColor,
      san: result.san,
      from: result.from,
      to: result.to,
      timestamp: Date.now(),
    });

    // Determine status
    let status = 'active';
    if (chess.isCheckmate()) status = 'checkmate';
    else if (chess.isStalemate()) status = 'stalemate';
    else if (chess.isDraw()) status = 'draw';
    else if (chess.isCheck()) status = 'check';
    game.status = status;

    return {
      move: result,
      newFEN: game.fen,
      capturedPiece: result.captured || null,
      gameStatus: status,
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      winner: status === 'checkmate' ? playerColor : null,
    };
  }

  /**
   * Get legal moves for a square (verbose chess.js objects).
   */
  getLegalMoves(gameId, square) {
    const game = gameStore.getGame(gameId);
    if (!game) throw new Error('Game not found');

    const chess = new Chess(game.fen);
    return chess
      .moves({ square, verbose: true })
      .map((m) => ({ from: m.from, to: m.to, san: m.san, flags: m.flags }));
  }

  /**
   * Handle resignation.
   */
  resignGame(gameId, socketId) {
    const game = gameStore.getGame(gameId);
    if (!game) throw new Error('Game not found');

    const loser = this.getPlayerColor(game, socketId);
    const winner = loser === 'white' ? 'black' : 'white';
    game.status = 'resigned';

    return { winner, loser };
  }

  /**
   * Delete a finished game from memory.
   */
  endGame(gameId) {
    gameStore.deleteGame(gameId);
  }

  // ── helpers ──

  getPlayerColor(game, socketId) {
    if (game.players.white.socketId === socketId) return 'white';
    if (game.players.black.socketId === socketId) return 'black';
    return null;
  }

  getOpponentSocketId(game, socketId) {
    return game.players.white.socketId === socketId
      ? game.players.black.socketId
      : game.players.white.socketId;
  }
}

module.exports = new GameService();
