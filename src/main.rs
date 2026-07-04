//! Archi Desktop — Tauri backend entry point.
//!
//! This crate provides the Rust backend for the Archi Desktop application,
//! a desktop tool for ArchiMate modeling built with Tauri 2.

// ── Module declarations ──────────────────────────────────────────────────────

mod error;
mod commands;
mod db;
mod models;
mod serializer;

pub use error::*;

// ── Re-exports for Tauri command handlers ────────────────────────────────────

pub use commands::file as file_commands;
pub use commands::llm as llm_commands;
pub use commands::model as model_commands;
pub use commands::storage as storage_commands;

// ── Tauri application setup ─────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    // Initialize tracing for structured logging
    tracing_subscriber::fmt()
        .with_target(false)
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    // Database is initialized lazily via `once_cell::sync::Lazy`
    // (see `db::connection::DB_POOL`) — no explicit init needed here.

    tauri::Builder::default()
        .setup(|_app| {
            tracing::info!("Archi Desktop starting up");
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // ── File commands ─────────────────────────────────────────────
            file_commands::open_file,
            file_commands::save_file,
            file_commands::new_file,
            file_commands::export_model,

            // ── Model CRUD commands ───────────────────────────────────────
            model_commands::create_model,
            model_commands::get_model,
            model_commands::update_model,
            model_commands::delete_model,
            model_commands::list_models,
            model_commands::search_models,

            // ── Diagram commands ──────────────────────────────────────
            model_commands::create_diagram,
            model_commands::get_diagram,
            model_commands::update_diagram,
            model_commands::delete_diagram,
            model_commands::list_diagrams,
            model_commands::add_element_to_diagram,
            model_commands::remove_element_from_diagram,
            model_commands::add_connection_to_diagram,
            model_commands::remove_connection_from_diagram,
            model_commands::export_diagram_svg,
            model_commands::export_diagram_png,

            // ── LLM commands ─────────────────────────────────────────────
            llm_commands::configure_provider,
            llm_commands::map_to_capabilities,
            llm_commands::generate_description,

            // ── Storage commands ─────────────────────────────────────────
            storage_commands::run_migrations,
            storage_commands::get_db_info,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Archi Desktop");
}
