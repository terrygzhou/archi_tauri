//! Database connection management.
//!
//! Provides a lazily-initialized SQLite connection pool using sqlx.
//! The database file lives in the application's data directory.

use sqlx::SqlitePool;

use crate::DatabaseError;

static mut DB_POOL: Option<SqlitePool> = None;

/// Initialize the database connection pool.
///
/// Must be called once during application startup before any commands
/// that access the database. Creates the database file and its parent
/// directory if they don't exist.
pub fn init_db() -> Result<(), DatabaseError> {
    // Ensure parent directories exist
    let db_path = db_path();
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| DatabaseError::Connection(format!("create data dir: {e}")))?;
    }

    let url = format!("sqlite://{}", db_path.display());
    tracing::info!(db_path = %db_path.display(), "initializing SQLite connection pool");

    let pool = SqlitePool::connect_lazy(&url).map_err(|e| DatabaseError::Connection(format!("lazy pool init: {e}")))?;
    unsafe {
        DB_POOL = Some(pool);
    }

    Ok(())
}

/// Get the database connection pool.
///
/// # Panics
/// Panics if the database has not been initialized (call `init_db` first).
pub fn get_db() -> SqlitePool {
    unsafe {
        DB_POOL
            .as_ref()
            .expect("database not initialized; call init_db() first")
            .clone()
    }
}

/// Return the path where the application database is stored.
pub fn db_path() -> std::path::PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("archi_desktop")
        .join("archi.db")
}
