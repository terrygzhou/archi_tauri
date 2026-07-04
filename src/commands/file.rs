//! File I/O operations: open, save, new, and export `.archi` files.
use std::path::PathBuf;

use tauri::command;

use crate::models::model::Model;
use crate::serializer::archi_format::ArchiSerializer;
use crate::{AppError, AppResult};

/// Open an existing `.archi` file and return the parsed model.
#[command]
pub async fn open_file(path: String) -> AppResult<Model> {
    let abs_path = PathBuf::from(&path);

    // Validate extension
    if abs_path.extension().map(|e| e == "archi").unwrap_or(false) {
        return Err(AppError::Validation(
            "file must have .archi extension".into(),
        ));
    }

    // Read and parse the file
    let content = tokio::fs::read_to_string(&abs_path).await
        .map_err(|e| AppError::FileIo(e))?;

    // Open archi file via the serializer
    let model = ArchiSerializer::deserialize(&content)?;

    Ok(model)
}

/// Save a model to disk as a `.archi` file.
#[command]
pub async fn save_file(path: String, model: Model) -> AppResult<()> {
    let abs_path = PathBuf::from(&path);

    // Serialize model to JSON (.archi format)
    let serialized = ArchiSerializer::serialize(&model)?;

    tokio::fs::write(&abs_path, &serialized).await
        .map_err(|e| AppError::FileIo(e))?;

    Ok(())
}

/// Create a new empty `.archi` model.
#[command]
pub async fn new_file() -> AppResult<Model> {
    Ok(Model::new())
}

/// Export model content as raw JSON for external consumption.
#[command]
pub async fn export_model(model: Model) -> AppResult<String> {
    let content = ArchiSerializer::serialize(&model)?;
    Ok(content)
}

/// Application data directory utilities.
pub fn data_dir() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("archi_desktop")
}
