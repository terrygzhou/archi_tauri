//! Storage commands.
//!
//! Handles database migrations and storage-related operations.

use crate::db::connection::get_db;
use crate::{AppError, AppResult, DatabaseError};

fn db_err(e: sqlx::Error, ctx: &str) -> AppError {
    AppError::Database(DatabaseError::Query(format!("{ctx}: {e}")))
}

/// Run all pending database migrations.
#[tauri::command]
pub async fn run_migrations() -> AppResult<Vec<String>> {
    let mut migrations = Vec::new();
    let db = get_db();

    // Run built-in migrations
    let migration_files = [
        ("001_initial", include_str!("../db/migrations/001_initial.sql")),
        ("002_elements", include_str!("../db/migrations/002_elements.sql")),
        ("003_relationships", include_str!("../db/migrations/003_relationships.sql")),
        ("004_diagrams", include_str!("../db/migrations/004_diagrams.sql")),
    ];

    // Track which migrations have been applied
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
    )
    .execute(&db)
    .await
    .map_err(|e| db_err(e, "create migrations table"))?;

    for (name, sql) in &migration_files {
        let existing = sqlx::query_scalar::<_, Option<String>>(
            "SELECT name FROM migrations WHERE name = $1",
        )
        .bind(name)
        .fetch_optional(&db)
        .await
        .map_err(|e| db_err(e, "check migration"))?;

        if existing.is_none() {
            // Apply migration
            sqlx::query(sql)
                .execute(&db)
                .await
                .map_err(|e| db_err(e, &format!("apply migration {name}")))?;

            sqlx::query("INSERT INTO migrations (name) VALUES ($1)")
                .bind(name)
                .execute(&db)
                .await
                .map_err(|e| db_err(e, &format!("record migration {name}")))?;

            migrations.push(name.to_string());
            tracing::info!(migration = %name, "migration applied");
        }
    }

    Ok(migrations)
}

/// Get database connection info and statistics.
#[tauri::command]
pub async fn get_db_info() -> AppResult<serde_json::Value> {
    let db = get_db();

    // Count records in each table
    let model_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM models")
        .fetch_one(&db)
        .await
        .unwrap_or(0);

    let element_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM elements")
        .fetch_one(&db)
        .await
        .unwrap_or(0);

    let relationship_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM relationships")
            .fetch_one(&db)
            .await
            .unwrap_or(0);

    let diagram_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM diagrams")
        .fetch_one(&db)
        .await
        .unwrap_or(0);

    // Get the database path from the connection string
    let db_path_str = crate::db::connection::db_path().display().to_string();

    Ok(serde_json::json!({
        "db_path": db_path_str,
        "models": model_count,
        "elements": element_count,
        "relationships": relationship_count,
        "diagrams": diagram_count,
    }))
}
