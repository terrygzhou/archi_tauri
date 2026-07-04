-- Migration 003: Relationships table
-- Stores connections between ArchiMate elements

CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    description TEXT,
    properties TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_relationships_model_id ON relationships(model_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);
