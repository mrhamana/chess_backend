const playerStore = require('../store/playerStore');

/**
 * Thin service layer over playerStore.
 * Keeps socket handlers free of direct store access.
 */
class PlayerService {
  createPlayer(socketId) {
    return playerStore.createPlayer(socketId);
  }

  getPlayer(socketId) {
    return playerStore.getPlayer(socketId);
  }

  setSearching(socketId) {
    playerStore.updateStatus(socketId, 'searching');
  }

  setInGame(socketId, gameId) {
    playerStore.updateStatus(socketId, 'in-game', gameId);
  }

  setIdle(socketId) {
    playerStore.updateStatus(socketId, 'idle', null);
  }

  removePlayer(socketId) {
    playerStore.removePlayer(socketId);
  }
}

module.exports = new PlayerService();
