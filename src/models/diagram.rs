//! Diagram model.
//!
//! Represents a visual diagram in an ArchiMate model, including layout
//! data, element positions, and visual properties.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Position and appearance of an element in a diagram.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagramElement {
    /// Unique identifier for this diagram element entry.
    pub id: String,

    /// ID of the diagram this element belongs to.
    #[serde(rename = "diagramId")]
    pub diagram_id: String,

    /// ID of the model element displayed in this diagram.
    #[serde(rename = "elementId")]
    pub element_id: String,

    /// X position (pixels from diagram origin).
    pub x: f64,

    /// Y position (pixels from diagram origin).
    pub y: f64,

    /// Element width in diagram.
    pub width: f64,

    /// Element height in diagram.
    pub height: f64,

    /// Z-index for layering.
    #[serde(rename = "zIndex")]
    pub z_index: i32,

    /// Whether the element is locked (cannot be moved/resized).
    pub locked: bool,

    /// Opacity (0.0 to 1.0).
    pub opacity: f64,
}

/// A connection between two elements in a diagram.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagramConnection {
    /// Unique identifier for this connection.
    pub id: String,

    /// ID of the diagram this connection belongs to.
    #[serde(rename = "diagramId")]
    pub diagram_id: String,

    /// ID of the source element.
    #[serde(rename = "sourceId")]
    pub source_id: String,

    /// ID of the target element.
    #[serde(rename = "targetId")]
    pub target_id: String,

    /// Type of relationship (e.g., "association", "aggregation", "composition").
    #[serde(rename = "relationshipType")]
    pub relationship_type: String,

    /// Visual style for the connection (JSON object with stroke, arrowhead, etc.).
    #[serde(default)]
    pub style: serde_json::Value,

    /// Route waypoints for the connection line (array of [x, y] pairs).
    #[serde(default)]
    pub route: Vec<[f64; 2]>,
}

/// A visual diagram within an ArchiMate model.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Diagram {
    /// Unique identifier.
    pub id: String,

    /// ID of the model this diagram belongs to.
    #[serde(rename = "modelId")]
    pub model_id: String,

    /// Diagram name.
    pub name: String,

    /// Diagram canvas width.
    pub width: f64,

    /// Diagram canvas height.
    pub height: f64,

    /// Grid size for snapping.
    #[serde(rename = "gridSize")]
    pub grid_size: f64,

    /// Layout configuration (JSON blob for editor-specific settings).
    #[serde(default)]
    pub layout: serde_json::Value,

    /// Element positions in this diagram.
    #[serde(default)]
    pub elements: Vec<DiagramElement>,

    /// Connections in this diagram.
    #[serde(default)]
    pub connections: Vec<DiagramConnection>,

    /// Creation timestamp.
    #[serde(rename = "created")]
    pub created_at: DateTime<Utc>,

    /// Last update timestamp.
    #[serde(rename = "modified")]
    pub modified_at: DateTime<Utc>,
}

impl Diagram {
    /// Create a new empty diagram.
    pub fn new(model_id: impl Into<String>, name: impl Into<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            model_id: model_id.into(),
            name: name.into(),
            width: 1920.0,
            height: 1080.0,
            grid_size: 20.0,
            layout: serde_json::json!({}),
            elements: Vec::new(),
            connections: Vec::new(),
            created_at: now,
            modified_at: now,
        }
    }
}
