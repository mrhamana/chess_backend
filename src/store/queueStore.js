/**
 * In-memory matchmaking queue.
 * A simple FIFO array of player objects waiting for a game.
 */
class QueueStore {
  constructor() {
    /** @type {Array<object>} */
    this.queue = [];
  }

  /**
   * Add a player to the queue (no-op if already present).
   */
  add(player) {
    if (this.queue.some((p) => p.socketId === player.socketId)) return;
    this.queue.push({ ...player, joinedQueueAt: Date.now() });
  }

  /**
   * Remove a player from the queue by socketId.
   */
  remove(socketId) {
    this.queue = this.queue.filter((p) => p.socketId !== socketId);
  }

  /**
   * 1-based position of the player in the queue (0 = not found).
   */
  position(socketId) {
    const idx = this.queue.findIndex((p) => p.socketId === socketId);
    return idx === -1 ? 0 : idx + 1;
  }

  get size() {
    return this.queue.length;
  }

  /**
   * If at least two players are waiting, pop the first two and return them.
   * @returns {{ player1: object, player2: object } | null}
   */
  matchPair() {
    if (this.queue.length < 2) return null;
    const player1 = this.queue.shift();
    const player2 = this.queue.shift();
    return { player1, player2 };
  }
}

module.exports = new QueueStore();
