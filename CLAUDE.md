# CLAUDE.md

## Project Overview

Murdle is a web app for creating and solving Murdle-style logic grid puzzles (inspired by the book series by G.T. Karber). Users create "mysteries" with suspects, weapons, and locations, then use an interactive logic grid to deduce the solution by marking cells with X (eliminated) or checkmark (confirmed).

## Tech Stack

- **Backend**: Node.js + Express (CommonJS, no transpilation)
- **Frontend**: Single-page app in vanilla HTML/CSS/JS (`public/index.html`)
- **Storage**: In-memory (no database; data resets on server restart)
- **Containerization**: Docker with `docker-compose.yml`

## Project Structure

```
.
├── server.js              # Express server, REST API, static file serving
├── public/
│   └── index.html         # Entire frontend SPA (HTML + CSS + JS inline)
├── package.json           # Node dependencies (express only)
├── Dockerfile             # Node 20 Alpine image
├── docker-compose.yml     # Runs on port 3020
├── .dockerignore
└── .gitignore
```

## Running the App

```bash
# With Docker (preferred)
docker compose up -d        # Starts on http://localhost:3020

# Without Docker
npm install
npm start                   # or: node server.js
```

**Port**: 3020 (hardcoded in `server.js` line 5 and `docker-compose.yml`)

## REST API

All endpoints are in `server.js`. No authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mysteries` | List all mysteries |
| GET | `/api/mysteries/:id` | Get a single mystery |
| POST | `/api/mysteries` | Create a mystery (body: `{title, description, suspects[], weapons[], locations[]}`) |
| PUT | `/api/mysteries/:id/grid` | Update grid state (body: `{grid: {"row-col": "x"|"check"|""}}`) |
| DELETE | `/api/mysteries/:id` | Delete a mystery |

## Frontend Architecture

The frontend is a single `public/index.html` file with three views toggled via JS:

1. **List View** (`#list-view`) — shows all mysteries as cards
2. **Create View** (`#create-view`) — form to create a new mystery with tag-based category builders
3. **Puzzle View** (`#puzzle-view`) — displays mystery info and the interactive logic grid

### Logic Grid Layout

The grid follows the standard Murdle book format:
- **Columns**: Suspects | Locations
- **Rows**: Weapons | Locations
- The bottom-right block (Locations vs Locations) has its diagonal and below disabled
- Thick borders separate category blocks
- Cells cycle through: empty → X (red) → checkmark (green) → empty

### Key Frontend Functions

- `buildGrid()` — Renders the entire HTML table for the logic grid
- `toggleCell(key)` — Cycles a cell's state and saves to server
- `esc(str)` — HTML-escapes strings for safe rendering
- `showListView()` / `showCreateView()` / `showPuzzleView(mystery)` — View navigation

## Grid State Format

Grid state is stored as an object keyed by `"rowIndex-colIndex"` strings:
- `""` or missing = empty cell
- `"x"` = eliminated (red X)
- `"check"` = confirmed (green checkmark)

Row/column indices are sequential across all category groups (e.g., for 3 suspects + 3 locations, columns 0-2 are suspects, 3-5 are locations).

## Conventions

- **No build step** — the app runs directly with `node server.js`, no Webpack/Babel/TypeScript
- **No external frontend dependencies** — all CSS and JS is inline in `index.html`
- **Single dependency** — Express is the only npm package
- **Visual style** — dark serif typography, parchment-colored background (#f5f0e8), red accent (#c0392b), mimicking the Murdle book aesthetic
- **XSS prevention** — user input is escaped via the `esc()` function before inserting into HTML

## Known Limitations

- Data is in-memory only; restarts lose all mysteries
- No input validation limits on category item count
- No user authentication
- Grid auto-saves on every cell click (no debouncing)
