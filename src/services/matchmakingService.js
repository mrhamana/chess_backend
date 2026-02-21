const queueStore = require('../store/queueStore');
const gameService = require('./gameService');

/**
 * In-memory matchmaking.
 * First-come-first-served pairing: when two players are in the queue they
 * are immediately matched and a game is created.
 */
class MatchmakingService {
  /**
   * Add a player and attempt an instant match.
   * @returns {{ matched: boolean, game?: object, player1?: object, player2?: object }}
   */
  addAndTryMatch(player) {
    queueStore.add(player);
    return this.tryMatch();
  }

  removeFromQueue(socketId) {
    queueStore.remove(socketId);
  }

  tryMatch() {
    const pair = queueStore.matchPair();
    if (!pair) return { matched: false };

    const { player1, player2 } = pair;
    const game = gameService.createGame(player1, player2);

    return { matched: true, game, player1, player2 };
  }

  getQueueStatus(socketId) {
    return {
      position: queueStore.position(socketId),
      total: queueStore.size,
    };
  }
}

module.exports = new MatchmakingService();
