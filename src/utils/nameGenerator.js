const adjectives = [
  'Swift', 'Brave', 'Clever', 'Noble', 'Wise', 'Bold', 'Silent', 'Mighty',
  'Fierce', 'Calm', 'Daring', 'Mystic', 'Royal', 'Cunning', 'Valiant',
  'Shadow', 'Iron', 'Golden', 'Silver', 'Crystal', 'Phantom', 'Thunder',
  'Crimson', 'Stealth', 'Rapid', 'Lucky', 'Tricky', 'Ancient', 'Electric',
  'Cosmic',
];

const pieces = [
  'Knight', 'Bishop', 'Rook', 'Queen', 'King', 'Pawn', 'Castle', 'Crown',
  'Gambit', 'Check', 'Fortress', 'Fianchetto', 'Tempo', 'Fork', 'Sacrifice',
  'Zugzwang', 'Grandmaster', 'Champion', 'Strategist', 'Tactician',
];

/**
 * Generate a chess-themed display name like "BraveKnight42".
 */
function generateUniqueName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const piece = pieces[Math.floor(Math.random() * pieces.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${piece}${num}`;
}

module.exports = { generateUniqueName };
