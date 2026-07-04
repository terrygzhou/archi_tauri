//! `.archi` file format serializer.
//!
//! The `.archi` format is a JSON-based interchange format used by Archi Desktop
//! for saving and loading complete ArchiMate models.

use crate::models::model::Model;
use crate::SerializationError;

/// Serializer for the `.archi` file format.
///
/// Provides static methods for serializing models to and from the `.archi` format.
pub struct ArchiSerializer;

impl ArchiSerializer {
    /// Serialize a Model to the `.archi` JSON format.
    ///
    /// The output is a pretty-printed JSON representation containing the full model
    /// including elements, relationships, and diagram layouts.
    pub fn serialize(model: &Model) -> Result<String, SerializationError> {
        serde_json::to_string_pretty(model).map_err(Into::into)
    }

    /// Deserialize a `.archi` JSON string into a Model.
    ///
    /// Validates the JSON structure and performs basic sanity checks
    /// on the model data.
    pub fn deserialize(content: &str) -> Result<Model, SerializationError> {
        // Basic format validation
        let trimmed = content.trim();
        if trimmed.is_empty() {
            return Err(SerializationError::InvalidArchi("empty file".into()));
        }

        // Try parsing as Model directly
        let model: Model = serde_json::from_str(trimmed)?;

        // Validate model integrity
        let issues = model.validate();
        if !issues.is_empty() {
            tracing::warn!(
                model_id = %model.id,
                issue_count = issues.len(),
                "loaded model with validation warnings"
            );
        }

        Ok(model)
    }
}
