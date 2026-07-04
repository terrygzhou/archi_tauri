//! ArchiMate relationship model.
//!
//! Represents connections between ArchiMate elements, including
//! association, aggregation, composition, specialization, and more.

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Types of ArchiMate relationships.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum RelationshipType {
    Association,
    Aggregation,
    Composition,
    Specialization,
    Serving,
    Realization,
    Assignment,
    Access,
    Triggers,
    Influence,
    Flow,
    Communication,
}

impl std::fmt::Display for RelationshipType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}

impl Default for RelationshipType {
    fn default() -> Self {
        RelationshipType::Association
    }
}

/// A relationship connecting two elements.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relationship {
    /// Unique identifier.
    pub id: String,

    /// ID of the model this relationship belongs to.
    pub model_id: String,

    /// Source element ID.
    pub source_id: String,

    /// Target element ID.
    pub target_id: String,

    /// Type of relationship.
    #[serde(rename = "type")]
    pub relationship_type: RelationshipType,

    /// Optional description.
    pub description: Option<String>,

    /// Custom properties.
    #[serde(default)]
    pub properties: serde_json::Map<String, serde_json::Value>,

    /// Creation timestamp.
    pub created_at: DateTime<Utc>,

    /// Last update timestamp.
    pub updated_at: DateTime<Utc>,
}

impl Relationship {
    /// Create a new relationship between two elements.
    pub fn new(
        model_id: impl Into<String>,
        source_id: impl Into<String>,
        target_id: impl Into<String>,
        relationship_type: RelationshipType,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            model_id: model_id.into(),
            source_id: source_id.into(),
            target_id: target_id.into(),
            relationship_type,
            description: None,
            properties: serde_json::Map::new(),
            created_at: now,
            updated_at: now,
        }
    }
}
