use serde::Serialize;

/// Top-level error type for the Archi application.
/// All internal error types convert to this, and Tauri commands return `Result<T, AppError>`.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("database error: {0}")]
    Database(#[from] DatabaseError),

    #[error("file I/O error: {0}")]
    FileIo(#[from] std::io::Error),

    #[error("model error: {0}")]
    Model(#[from] ModelError),

    #[error("serialization error: {0}")]
    Serialization(#[from] SerializationError),

    #[error("LLM error: {0}")]
    Llm(#[from] LlmError),

    #[error("authentication error: {0}")]
    Authentication(#[from] AuthenticationError),

    #[error("command error: {0}")]
    Command(String),

    #[error("not found: {0}")]
    NotFound(String),

    #[error("validation error: {0}")]
    Validation(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<&str> for AppError {
    fn from(msg: &str) -> Self {
        AppError::Command(msg.into())
    }
}

impl From<String> for AppError {
    fn from(msg: String) -> Self {
        AppError::Command(msg)
    }
}

// ── Sub-error types ──────────────────────────────────────────────────────────

#[derive(Debug, thiserror::Error)]
pub enum DatabaseError {
    #[error("connection failed: {0}")]
    Connection(String),

    #[error("query failed: {0}")]
    Query(String),

    #[error("migration failed: {0}")]
    Migration(String),

    #[error("not found: {0}")]
    NotFound(String),

    #[error("constraint violation: {0}")]
    Constraint(String),
}

impl From<sqlx::Error> for DatabaseError {
    fn from(e: sqlx::Error) -> Self {
        match e {
            sqlx::Error::RowNotFound => DatabaseError::NotFound("row not found".into()),
            _ => DatabaseError::Query(e.to_string()),
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ModelError {
    #[error("duplicate element: {0}")]
    Duplicate(String),

    #[error("orphan reference: {0}")]
    OrphanReference(String),

    #[error("invalid model state: {0}")]
    InvalidState(String),

    #[error("circular reference detected")]
    CircularReference,
}

#[derive(Debug, thiserror::Error)]
pub enum SerializationError {
    #[error("invalid .archi format: {0}")]
    InvalidArchi(String),

    #[error("invalid XML: {0}")]
    InvalidXml(String),

    #[error("unsupported version: {0}")]
    UnsupportedVersion(String),

    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),
}

impl From<reqwest::Error> for SerializationError {
    fn from(e: reqwest::Error) -> Self {
        SerializationError::InvalidArchi(e.to_string())
    }
}

#[derive(Debug, thiserror::Error)]
pub enum LlmError {
    #[error("provider not configured")]
    NotConfigured,

    #[error("API error: {status} - {detail}")]
    ApiError { status: u16, detail: String },

    #[error("rate limited: retry after {seconds}s")]
    RateLimited { seconds: u64 },

    #[error("network error: {0}")]
    Network(#[from] reqwest::Error),

    #[error("timeout after {seconds}s")]
    Timeout { seconds: u64 },
}

#[derive(Debug, thiserror::Error)]
pub enum AuthenticationError {
    #[error("keyring operation failed: {0}")]
    Keyring(String),

    #[error("credentials not found")]
    NotFound,

    #[error("invalid credentials")]
    Invalid,
}

// ── Result type alias ────────────────────────────────────────────────────────

pub type AppResult<T> = Result<T, AppError>;
