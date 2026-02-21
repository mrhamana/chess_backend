const { generateId } = require('../utils/idGenerator');
const { generateUniqueName } = require('../utils/nameGenerator');

/**
 * In-memory player store.
 * Maps socketId → player data. Lifetime = socket connection.
 */
class PlayerStore {
  constructor() {
    /** @type {Map<string, object>} socketId → player */
    this.players = new Map();
  }

  /**
   * Create a new temporary player session for the given socket.
   */
  createPlayer(socketId) {
    const player = {
      socketId,
      playerId: generateId('player'),
      displayName: generateUniqueName(),
      createdAt: Date.now(),
      status: 'idle', // 'idle' | 'searching' | 'in-game'
      currentGameId: null,
    };
    this.players.set(socketId, player);
    return player;
  }

  getPlayer(socketId) {
    return this.players.get(socketId) || null;
  }

  updateStatus(socketId, status, gameId = null) {
    const p = this.players.get(socketId);
    if (p) {
      p.status = status;
      if (gameId !== null) p.currentGameId = gameId;
    }
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  get size() {
    return this.players.size;
  }
}

module.exports = new PlayerStore();
