//! Database schema module.
//!
//! Exposes migration files and provides schema inspection utilities.

pub mod connection;

/// All migration file paths in order.
/// Used by the migration runner to apply schema changes.
pub const MIGRATIONS: &[(&str, &str)] = &[
    ("001_initial", include_str!("migrations/001_initial.sql")),
    ("002_elements", include_str!("migrations/002_elements.sql")),
    ("003_relationships", include_str!("migrations/003_relationships.sql")),
    ("004_diagrams", include_str!("migrations/004_diagrams.sql")),
];

/// Get the complete schema as a single SQL string.
pub fn full_schema() -> String {
    MIGRATIONS
        .iter()
        .map(|(_, sql)| *sql)
        .collect::<Vec<_>>()
        .join("\n\n")
}
