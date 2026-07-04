//! Database connection management.
//!
//! Provides a lazily-initialized SQLite connection pool using sqlx.
//! The database file lives in the application's data directory.

use once_cell::sync::Lazy;
use sqlx::SqlitePool;

static DB_POOL: Lazy<SqlitePool> = Lazy::new(init_pool);

fn init_pool() -> SqlitePool {
    let db_path = db_path();
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).expect("failed to create data dir");
    }

    let url = format!("sqlite://{}", db_path.display());
    tracing::info!(db_path = %db_path.display(), "initializing SQLite connection pool");

    // `connect_lazy` defers the actual connection until first query — which
    // will run inside a Tauri async command on the Tokio runtime.
    SqlitePool::connect_lazy(&url).expect("failed to create SQLite pool")
}

/// Get the database connection pool.
pub fn get_db() -> SqlitePool {
    DB_POOL.clone()
}

/// Return the path where the application database is stored.
pub fn db_path() -> std::path::PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("archi_desktop")
        .join("archi.db")
}
