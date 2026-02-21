const { generateId } = require('../utils/idGenerator');

/**
 * In-memory game store.
 * Maps gameId → game state object.
 */
class GameStore {
  constructor() {
    /** @type {Map<string, object>} */
    this.games = new Map();
  }

  /**
   * Create a new game between two players with random colour assignment.
   */
  createGame(player1, player2) {
    const gameId = generateId('game');
    const p1White = Math.random() > 0.5;

    const game = {
      gameId,
      players: {
        white: p1White ? player1 : player2,
        black: p1White ? player2 : player1,
      },
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      currentTurn: 'white',
      moveHistory: [],
      status: 'active', // active | check | checkmate | stalemate | draw | resigned
      startTime: Date.now(),
      lastMoveTime: Date.now(),
      timers: { white: 600_000, black: 600_000 }, // 10 min each
      capturedPieces: { white: [], black: [] },
    };

    this.games.set(gameId, game);
    return game;
  }

  getGame(gameId) {
    return this.games.get(gameId) || null;
  }

  updateGame(gameId, updates) {
    const g = this.games.get(gameId);
    if (g) Object.assign(g, updates);
  }

  deleteGame(gameId) {
    this.games.delete(gameId);
  }

  /**
   * Look up the game a socket is currently playing in.
   */
  getGameBySocketId(socketId) {
    for (const game of this.games.values()) {
      if (
        game.players.white.socketId === socketId ||
        game.players.black.socketId === socketId
      ) {
        return game;
      }
    }
    return null;
  }

  /**
   * Return all games still in "active" or "check" status.
   */
  getActiveGames() {
    return Array.from(this.games.values()).filter(
      (g) => g.status === 'active' || g.status === 'check'
    );
  }
}

module.exports = new GameStore();
