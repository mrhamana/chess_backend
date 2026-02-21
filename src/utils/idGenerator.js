/**
 * Generate a prefixed unique ID.
 * @param {string} prefix  e.g. 'player', 'game'
 * @returns {string}
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

module.exports = { generateId };
