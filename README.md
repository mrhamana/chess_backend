# Chess Backend – In-Memory

Lightweight real-time chess server. **No database** – everything in RAM.

## Quick Start

```bash
cd backend
cp .env.example .env   # edit if needed
npm install
npm run dev            # nodemon, auto-restarts on changes
```

Server starts on `http://localhost:5000`.

## How It Works

1. Player connects via WebSocket → gets an auto-generated name (e.g. "BraveKnight42")
2. Clicks "Play" → `matchmaking:join` → added to in-memory queue
3. Two players in queue → matched → random colours → game starts
4. Moves validated server-side with **chess.js**
5. Game ends → deleted from memory after 5 s

## Socket Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `matchmaking:join` | – | Enter the matchmaking queue |
| `matchmaking:cancel` | – | Leave the queue |
| `game:move` | `{ gameId, move }` | Make a move (`move = { from, to, promotion? }`) |
| `game:getLegalMoves` | `{ gameId, square }` | Request legal moves for a square |
| `game:resign` | `{ gameId }` | Resign the current game |

### Server → Client

| Event | Description |
|---|---|
| `player:created` | Your temp session (playerId, displayName) |
| `matchmaking:searching` | Confirmed queued |
| `matchmaking:waiting` | Queue position update |
| `matchmaking:found` | Match found – colour, opponent, gameId |
| `matchmaking:cancelled` | Left the queue |
| `game:started` | Game begins – board, players, turn |
| `game:move` | A move was made – new FEN, history |
| `game:check` | A king is in check |
| `game:over` | Game ended – result, winner, message |
| `game:legalMoves` | Legal moves response |
| `player:disconnected` | Opponent disconnected |
| `error` | Error with code + message |

## Project Structure

```
backend/
├── src/
│   ├── config/          # env, CORS
│   ├── store/           # in-memory Maps & queue
│   ├── services/        # matchmaking, game, player logic
│   ├── sockets/         # Socket.IO handlers
│   ├── utils/           # name & id generators
│   ├── app.js           # Express (health-check only)
│   └── server.js        # entry point
├── .env.example
└── package.json
```

## Notes

- Server restart = all games lost (by design)
- No auth, no database, no REST API (except `/health`)
- Old games auto-cleaned every 5 min (>2 h idle)
