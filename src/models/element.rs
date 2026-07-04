//! ArchiMate element model.
//!
//! Represents a single element in an ArchiMate model (e.g., Business Process,
//! Application Component, etc.). Follows the 92 element types defined by
//! the Open Group Architecture Framework.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// The type of ArchiMate element.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum ElementType {
    // ── Business Layer ───────────────────────────────────────────────
    BusinessActor,
    BusinessRole,
    BusinessProcess,
    BusinessService,
    BusinessInteraction,
    BusinessEvent,
    BusinessRule,
    BusinessObject,
    BusinessCollaboration,
    Course,
    Outcome,

    // ── Application Layer ────────────────────────────────────────────
    ApplicationComponent,
    ApplicationFunction,
    ApplicationInterface,
    ApplicationInteraction,
    ApplicationService,
    ApplicationCollaboration,
    ApplicationEvent,
    ApplicationMaterial,

    // ── Technology Layer ────────────────────────────────────────────
    TechnologyComponent,
    TechnologyFunction,
    TechnologyInterface,
    TechnologyInteraction,
    TechnologyService,
    TechnologyCollaboration,
    TechnologyEvent,
    TechnologyMaterial,
    Device,
    SystemSoftware,

    // ── Physical Layer ──────────────────────────────────────────────
    PhysicalLocation,
    PhysicalRealization,

    // ── Implementation & Change Layer ───────────────────────────────
    Plateau,
    CourseOfAction,
    WorkPackage,
    Gap,

    // ── Generic ──────────────────────────────────────────────────────
    Grouping,
    Assignment,
}

impl std::fmt::Display for ElementType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}

impl Default for ElementType {
    fn default() -> Self {
        ElementType::BusinessProcess
    }
}

/// A single ArchiMate element within a model.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Element {
    /// Unique identifier.
    pub id: String,

    /// Human-readable name.
    pub name: String,

    /// Type of ArchiMate element.
    #[serde(rename = "type")]
    pub element_type: ElementType,

    /// Optional description.
    pub description: Option<String>,

    /// Applied stereotype (for custom element types).
    pub stereotype: Option<String>,

    /// Tags for classification and filtering.
    #[serde(default)]
    pub tags: Vec<String>,

    /// Custom key-value properties.
    #[serde(default)]
    pub custom_properties: serde_json::Map<String, serde_json::Value>,

    /// Creation timestamp.
    pub created_at: DateTime<Utc>,

    /// Last update timestamp.
    pub updated_at: DateTime<Utc>,
}

impl Element {
    /// Create a new element with the given name and type.
    pub fn new(name: impl Into<String>, element_type: ElementType) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name: name.into(),
            element_type,
            description: None,
            stereotype: None,
            tags: Vec::new(),
            custom_properties: serde_json::Map::new(),
            created_at: now,
            updated_at: now,
        }
    }

    /// Update the element's name and return self.
    pub fn with_name(mut self, name: impl Into<String>) -> Self {
        self.name = name.into();
        self.updated_at = Utc::now();
        self
    }

    /// Add a tag to the element.
    pub fn with_tag(mut self, tag: impl Into<String>) -> Self {
        self.tags.push(tag.into());
        self.updated_at = Utc::now();
        self
    }

    /// Set a custom property.
    pub fn with_property(mut self, key: impl Into<String>, value: serde_json::Value) -> Self {
        self.custom_properties.insert(key.into(), value);
        self.updated_at = Utc::now();
        self
    }
}
