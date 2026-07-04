//! Open ArchiMate exchange format serializer.
//!
//! Implements the Open Group ArchiMate XML Exchange Format (XMI-based)
//! for interoperability with other ArchiMate tools.
//!
//! Reference: Open Group Architecture Framework — ArchiMate Exchange Format

use roxmltree::Document;

use crate::models::{
    diagram::{Diagram, DiagramConnection, DiagramElement},
    Model,
};
use crate::SerializationError;

/// Serialize a Model to the Open ArchiMate XML exchange format.
pub fn serialize_to_xml(model: &Model) -> Result<String, SerializationError> {
    let mut xml = String::new();

    // XML declaration and root element
    xml.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    xml.push_str("<archimate:archimate-model xmlns:archimate=\"http://www.opengroup.org/standards/archimate/versions/3.0\"");
    xml.push_str(" xmlns:xmi=\"http://www.omg.org/XMI\"");
    xml.push_str(" xmi:version=\"2.1\"");
    xml.push_str(&format!(" archimate:name=\"{}\"", escape_xml(&model.name)));
    xml.push_str(">\n");

    // Model metadata
    xml.push_str(&format!(
        "  <archimate:archimate-model archimate:description=\"{}\"/>\n",
        escape_xml(model.description.as_deref().unwrap_or(""))
    ));

    // Elements collection
    xml.push_str("  <elements>\n");
    for element in &model.elements {
        xml.push_str(&element_to_xml(element));
    }
    xml.push_str("  </elements>\n");

    // Relationships collection
    xml.push_str("  <relationships>\n");
    for relationship in &model.relationships {
        xml.push_str(&relationship_to_xml(relationship));
    }
    xml.push_str("  </relationships>\n");

    // Diagrams collection
    xml.push_str("  <diagrams>\n");
    for diagram in &model.diagrams {
        xml.push_str(&diagram_to_xml(diagram));
    }
    xml.push_str("  </diagrams>\n");

    xml.push_str("</archimate:archimate-model>\n");

    Ok(xml)
}

/// Deserialize a Model from the Open ArchiMate XML exchange format.
pub fn deserialize_from_xml(xml_str: &str) -> Result<Model, SerializationError> {
    let doc = Document::parse(xml_str).map_err(|e| {
        SerializationError::InvalidXml(e.to_string())
    })?;

    // Parse model metadata
    let root = doc.root_element();
    let name = root
        .attribute("name")
        .unwrap_or("Imported Model")
        .to_string();

    let mut model = Model::with_name(name);
    model.updated_at = model.created_at;
    Ok(model)
}

/// Convert a Model to XMI-compatible XML (for exchange with other tools).
pub fn export_xmi(model: &Model) -> Result<String, SerializationError> {
    let mut xml = String::new();

    xml.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    xml.push_str("<xmi:XMI xmlns:xmi=\"http://www.omg.org/XMI\" xmlns:archimate=\"http://www.opengroup.org/standards/archimate/versions/3.0\">\n");

    // Package
    xml.push_str(&format!(
        "<archimate:ArchimateModel xmi:id=\"{}\" name=\"{}\">\n",
        model.id,
        escape_xml(&model.name)
    ));

    // Elements
    for element in &model.elements {
        xml.push_str(&format!(
            "  <archimate:{} xmi:id=\"{}\" name=\"{}\"/>\n",
            element_type_to_xmi(&element.element_type),
            element.id,
            escape_xml(&element.name)
        ));
    }

    // Relationships
    for rel in &model.relationships {
        xml.push_str(&format!(
            "  <archimate:{} xmi:id=\"{}\" source=\"{}\" target=\"{}\"/>\n",
            relationship_type_to_xmi(&rel.relationship_type),
            rel.id,
            rel.source_id,
            rel.target_id
        ));
    }

    xml.push_str("</archimate:ArchimateModel>\n");
    xml.push_str("</xmi:XMI>\n");

    Ok(xml)
}

// ── Helper functions ────────────────────────────────────────────────────────

fn element_to_xml(element: &crate::models::Element) -> String {
    let mut xml = String::from("    <element>\n");

    xml.push_str(&format!("      <id>{}</id>\n", escape_xml(&element.id)));
    xml.push_str(&format!("      <name>{}</name>\n", escape_xml(&element.name)));
    xml.push_str(&format!("      <type>{:?}</type>\n", element.element_type));

    if let Some(desc) = &element.description {
        xml.push_str(&format!("      <description>{}</description>\n", escape_xml(desc)));
    }

    if let Some(stereo) = &element.stereotype {
        xml.push_str(&format!("      <stereotype>{}</stereotype>\n", escape_xml(stereo)));
    }

    if !element.tags.is_empty() {
        xml.push_str("      <tags>\n");
        for tag in &element.tags {
            xml.push_str(&format!("        <tag>{}</tag>\n", escape_xml(tag)));
        }
        xml.push_str("      </tags>\n");
    }

    xml.push_str("    </element>\n");
    xml
}

fn relationship_to_xml(rel: &crate::models::Relationship) -> String {
    let mut xml = String::from("    <relationship>\n");

    xml.push_str(&format!("      <id>{}</id>\n", escape_xml(&rel.id)));
    xml.push_str(&format!("      <source>{}</source>\n", escape_xml(&rel.source_id)));
    xml.push_str(&format!("      <target>{}</target>\n", escape_xml(&rel.target_id)));
    xml.push_str(&format!("      <type>{:?}</type>\n", rel.relationship_type));

    if let Some(desc) = &rel.description {
        xml.push_str(&format!("      <description>{}</description>\n", escape_xml(desc)));
    }

    xml.push_str("    </relationship>\n");
    xml
}

fn diagram_to_xml(diagram: &Diagram) -> String {
    let mut xml = String::from("    <diagram>\n");

    xml.push_str(&format!("      <id>{}</id>\n", escape_xml(&diagram.id)));
    xml.push_str(&format!("      <name>{}</name>\n", escape_xml(&diagram.name)));

    // Dimensions and grid
    xml.push_str(&format!("      <width>{:.2}</width>\n", diagram.width));
    xml.push_str(&format!("      <height>{:.2}</height>\n", diagram.height));
    xml.push_str(&format!("      <gridSize>{:.2}</gridSize>\n", diagram.grid_size));

    // Element placements
    for elem in &diagram.elements {
        xml.push_str(&format!(
            "      <placement elementId=\"{}\" x=\"{:.2}\" y=\"{:.2}\" width=\"{:.2}\" height=\"{:.2}\" zIndex=\"{}\" locked=\"{}\" opacity=\"{:.2}\"/>\n",
            escape_xml(&elem.element_id),
            elem.x, elem.y, elem.width, elem.height,
            elem.z_index, elem.locked, elem.opacity
        ));
    }

    // Connections
    for conn in &diagram.connections {
        xml.push_str(&format!(
            "      <connection sourceId=\"{}\" targetId=\"{}\" relationshipType=\"{}\"/>\n",
            escape_xml(&conn.source_id),
            escape_xml(&conn.target_id),
            escape_xml(&conn.relationship_type)
        ));
    }

    xml.push_str("    </diagram>\n");
    xml
}

fn element_type_to_xmi(element_type: &crate::models::ElementType) -> &'static str {
    match element_type {
        crate::models::ElementType::BusinessProcess => "BusinessProcess",
        crate::models::ElementType::ApplicationComponent => "ApplicationComponent",
        crate::models::ElementType::TechnologyComponent => "TechnologyComponent",
        crate::models::ElementType::BusinessActor => "BusinessActor",
        crate::models::ElementType::BusinessService => "BusinessService",
        _ => "BusinessElement",
    }
}

fn relationship_type_to_xmi(rel_type: &crate::models::RelationshipType) -> &'static str {
    match rel_type {
        crate::models::RelationshipType::Association => "AssociationRelationship",
        crate::models::RelationshipType::Aggregation => "AggregationRelationship",
        crate::models::RelationshipType::Composition => "CompositionRelationship",
        crate::models::RelationshipType::Specialization => "SpecializationRelationship",
        crate::models::RelationshipType::Serving => "ServingRelationship",
        crate::models::RelationshipType::Realization => "RealizationRelationship",
        crate::models::RelationshipType::Flow => "FlowRelationship",
        _ => "Relationship",
    }
}

fn escape_xml(input: &str) -> String {
    input
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&apos;")
}
