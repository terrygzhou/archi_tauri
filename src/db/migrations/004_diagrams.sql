-- Migration 004: Diagrams tables
-- Stores diagram layouts for visual ArchiMate modeling

CREATE TABLE IF NOT EXISTS diagrams (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    width REAL NOT NULL DEFAULT 1920.0,
    height REAL NOT NULL DEFAULT 1080.0,
    grid_size REAL NOT NULL DEFAULT 20.0,
    layout TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    modified_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Element positions within diagrams (one row per element placement in a diagram)
CREATE TABLE IF NOT EXISTS diagram_elements (
    id TEXT PRIMARY KEY,
    diagram_id TEXT NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
    element_id TEXT NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    x REAL NOT NULL DEFAULT 0.0,
    y REAL NOT NULL DEFAULT 0.0,
    width REAL NOT NULL DEFAULT 100.0,
    height REAL NOT NULL DEFAULT 50.0,
    z_index INTEGER DEFAULT 0,
    locked INTEGER DEFAULT 0,
    opacity REAL DEFAULT 1.0,
    UNIQUE(diagram_id, element_id)
);

-- Connections between elements within diagrams
CREATE TABLE IF NOT EXISTS diagram_connections (
    id TEXT PRIMARY KEY,
    diagram_id TEXT NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'association',
    style TEXT DEFAULT '{}',
    route TEXT DEFAULT '[]',
    UNIQUE(diagram_id, source_id, target_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diagrams_model_id ON diagrams(model_id);
CREATE INDEX IF NOT EXISTS idx_diagram_elements_diagram ON diagram_elements(diagram_id);
CREATE INDEX IF NOT EXISTS idx_diagram_elements_element ON diagram_elements(element_id);
CREATE INDEX IF NOT EXISTS idx_diagram_connections_diagram ON diagram_connections(diagram_id);
CREATE INDEX IF NOT EXISTS idx_diagram_connections_source ON diagram_connections(source_id);
CREATE INDEX IF NOT EXISTS idx_diagram_connections_target ON diagram_connections(target_id);
