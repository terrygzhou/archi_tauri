//! Top-level ArchiMate model.
//!
//! A Model represents a complete ArchiMate architecture model, containing
//! elements, relationships, and diagrams.

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

use super::{
    diagram::Diagram,
    element::{Element, ElementType},
    relationship::Relationship,
};

/// A complete ArchiMate model.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Model {
    /// Unique identifier.
    pub id: String,

    /// Model name.
    pub name: String,

    /// Optional description.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Author of the model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,

    /// ArchiMate version (e.g., "3.1").
    #[serde(default = "default_version")]
    pub version: String,

    /// Elements in this model.
    #[serde(default)]
    pub elements: Vec<Element>,

    /// Relationships in this model.
    #[serde(default)]
    pub relationships: Vec<Relationship>,

    /// Diagrams in this model.
    #[serde(default)]
    pub diagrams: Vec<Diagram>,

    /// Creation timestamp.
    pub created_at: DateTime<Utc>,

    /// Last update timestamp.
    pub updated_at: DateTime<Utc>,
}

fn default_version() -> String {
    "3.1".to_string()
}

impl Model {
    /// Create a new empty model.
    pub fn new() -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name: "Untitled Model".to_string(),
            description: None,
            author: None,
            version: "3.1".to_string(),
            elements: Vec::new(),
            relationships: Vec::new(),
            diagrams: Vec::new(),
            created_at: now,
            updated_at: now,
        }
    }

    /// Create a model with a specific name.
    pub fn with_name(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            ..Self::new()
        }
    }

    /// Add an element to the model.
    pub fn add_element(&mut self, element: Element) {
        self.elements.push(element);
        self.updated_at = Utc::now();
    }

    /// Add a relationship to the model.
    pub fn add_relationship(&mut self, relationship: Relationship) {
        self.relationships.push(relationship);
        self.updated_at = Utc::now();
    }

    /// Add a diagram to the model.
    pub fn add_diagram(&mut self, diagram: Diagram) {
        self.diagrams.push(diagram);
        self.updated_at = Utc::now();
    }

    /// Get an element by ID.
    pub fn get_element(&self, id: &str) -> Option<&Element> {
        self.elements.iter().find(|e| e.id == id)
    }

    /// Get a relationship by ID.
    pub fn get_relationship(&self, id: &str) -> Option<&Relationship> {
        self.relationships.iter().find(|r| r.id == id)
    }

    /// Get a diagram by ID.
    pub fn get_diagram(&self, id: &str) -> Option<&Diagram> {
        self.diagrams.iter().find(|d| d.id == id)
    }

    /// Remove an element by ID. Returns true if the element existed.
    pub fn remove_element(&mut self, id: &str) -> bool {
        let had = self.elements.iter().any(|e| e.id == id);
        self.elements.retain(|e| e.id != id);
        if had {
            self.updated_at = Utc::now();
        }
        had
    }

    /// Count elements by type.
    pub fn element_counts(&self) -> std::collections::HashMap<ElementType, usize> {
        let mut counts = std::collections::HashMap::new();
        for elem in &self.elements {
            *counts.entry(elem.element_type.clone()).or_insert(0) += 1;
        }
        counts
    }

    /// Validate the model for common issues.
    pub fn validate(&self) -> Vec<String> {
        let mut issues = Vec::new();

        // Check for duplicate names within the same type
        let mut name_type_pairs = Vec::new();
        for elem in &self.elements {
            name_type_pairs.push((elem.name.as_str(), &elem.element_type));
        }
        // (simple duplicate check — could be more sophisticated)

        // Check relationships reference valid elements
        for rel in &self.relationships {
            if !self.elements.iter().any(|e| e.id == rel.source_id) {
                issues.push(format!(
                    "Relationship '{}' references unknown source element '{}'",
                    rel.id, rel.source_id
                ));
            }
            if !self.elements.iter().any(|e| e.id == rel.target_id) {
                issues.push(format!(
                    "Relationship '{}' references unknown target element '{}'",
                    rel.id, rel.target_id
                ));
            }
        }

        // Check diagram elements reference valid model elements
        for diagram in &self.diagrams {
            for de in &diagram.elements {
                if !self.elements.iter().any(|e| e.id == de.element_id) {
                    issues.push(format!(
                        "Diagram '{}' references unknown element '{}'",
                        diagram.name, de.element_id
                    ));
                }
            }
        }

        issues
    }
}
