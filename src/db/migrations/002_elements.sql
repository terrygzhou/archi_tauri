-- Migration 002: Elements table
-- Stores ArchiMate elements (business processes, applications, etc.)

CREATE TABLE IF NOT EXISTS elements (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    element_type TEXT NOT NULL,
    description TEXT,
    stereotype TEXT,
    tags TEXT DEFAULT '[]',
    custom_properties TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_elements_model_id ON elements(model_id);
CREATE INDEX IF NOT EXISTS idx_elements_type ON elements(element_type);
CREATE INDEX IF NOT EXISTS idx_elements_name ON elements(name);
