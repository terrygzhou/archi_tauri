# Archi Desktop

Open-source ArchiMate modeling tool — Eclipse RCP → Tauri migration.

## Stack

- **Backend**: Rust + Tauri 2 (async commands, Tokio runtime)
- **Frontend**: React 18 + TypeScript + Vite 6 + mxGraph
- **DB**: SQLite (sqlx, lazy pool via `once_cell::sync::Lazy`)
- **State**: Zustand stores + command pattern

## Project Structure

```
├── web/                    # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── App.tsx         # Root component
│   │   ├── components/     # Toolbar, Explorer, PropertiesPanel, Palette, DiagramCanvas, StatusBar
│   │   ├── diagram/        # mxGraph wrapper, graph.ts
│   │   ├── stores/         # Zustand: modelStore, diagramStore, uiStore, commandStack
│   │   ├── styles/         # global.css
│   │   ├── hooks/          # useKeyboardShortcuts
│   │   ├── types/          # domain types, mxgraph.d.ts
│   │   └── utils/          # constants, formatters
│   └── package.json
├── src/                    # Rust backend
│   ├── main.rs             # Tauri entry, command handler registration
│   ├── commands/           # Tauri IPC: file, model, diagram, LLM, storage
│   ├── db/                 # SQLite connection pool (once_cell::Lazy)
│   ├── models/             # Model, Element, Relationship, Diagram schemas
│   ├── serializer/         # Archi XML format (read/write .archimate)
│   └── error.rs            # thiserror AppError
├── Cargo.toml              # Rust dependencies
├── tauri.conf.json         # Tauri config (window, CSP, bundling)
└── package.json            # Root scripts
```

## Setup

```bash
# Backend
cargo build

# Frontend
cd web && npm install

# Dev (Vite + Tauri hot reload)
npm run tauri dev

# Frontend only
cd web && npm run dev
```

## Commands

```bash
cargo build              # Rust
cargo test               # Rust tests
npm run typecheck          # TypeScript check
npm run lint               # ESLint
npm run test               # Vitest
npm run build              # Vite production bundle
npm run tauri dev          # Full dev loop
npm run tauri build        # Production binaries
```

## Architecture

### Backend Commands

| Command | Description |
|---------|-------------|
| `open_file`, `save_file`, `new_file`, `export_model` | File I/O, .archimate serialization |
| `create_model`, `get_model`, `update_model`, `delete_model` | Model CRUD |
| `list_models`, `search_models` | Model queries |
| `create_diagram`, `get_diagram`, `update_diagram`, `delete_diagram` | Diagram CRUD |
| `add_element_to_diagram`, `remove_element_from_diagram` | Element ↔ diagram linking |
| `export_diagram_svg`, `export_diagram_png` | SVG/PNG export (resvg) |
| `configure_provider`, `map_to_capabilities`, `generate_description` | LLM integration |
| `run_migrations`, `get_db_info` | SQLite schema management |

### State Stores

| Store | Purpose |
|-------|---------|
| `modelStore` | Active ArchiMate model, elements, diagrams |
| `diagramStore` | Diagram state, active diagram, element selection |
| `uiStore` | Panel positions, toolbar/statusbar visibility, preferences |
| `commandStack` | Undo/redo command history |

### DB

SQLite with lazy initialization via `once_cell::sync::Lazy<SqlitePool>`. Pool connects lazily to the app data directory — no sync runtime needed.

## License

GPL-3.0