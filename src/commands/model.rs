//! Model CRUD commands.
//!
//! Provides Tauri commands for creating, reading, updating, and deleting
//! ArchiMate models stored in the SQLite database.

use crate::db::connection::get_db;
use crate::models::diagram::{Diagram, DiagramConnection, DiagramElement};
use crate::models::Model;
use crate::{AppError, AppResult, DatabaseError};
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

// ── Helper: convert sqlx error to AppError ──────────────────────────────────────
fn db_err(e: sqlx::Error, ctx: &str) -> AppError {
    AppError::Database(DatabaseError::Query(format!("{ctx}: {e}")))
}

// ── Model commands ────────────────────────────────────────────────────────────

/// Create a new model and persist it to the database.
#[tauri::command]
pub async fn create_model(
    name: String,
    description: Option<String>,
    author: Option<String>,
) -> AppResult<Model> {
    let db = get_db();

    let model_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    sqlx::query(
        "INSERT INTO models (id, name, description, author, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(&model_id)
    .bind(&name)
    .bind(description.as_deref())
    .bind(author.as_deref())
    .bind(chrono::DateTime::<chrono::Utc>::from(now))
    .bind(chrono::DateTime::<chrono::Utc>::from(now))
    .execute(&db)
    .await
    .map_err(|e| db_err(e, "create model"))?;

    Ok(Model {
        id: model_id,
        name,
        description: None,
        author: None,
        elements: Vec::new(),
        relationships: Vec::new(),
        diagrams: Vec::new(),
        created_at: now,
        updated_at: now,
        version: "3.1".to_string(),
    })
}

/// Retrieve a model by ID.
#[tauri::command]
pub async fn get_model(id: String) -> AppResult<Model> {
    let db = get_db();

    let row = sqlx::query(
        "SELECT id, name, description, author, created_at, updated_at
         FROM models WHERE id = $1",
    )
    .bind(&id)
    .fetch_optional(&db)
    .await
    .map_err(|e| db_err(e, "get model"))?
    .ok_or_else(|| AppError::NotFound(format!("model {id} not found")))?;

    let name: String = row.get(1);
    let description: Option<String> = row.get(2);
    let author: Option<String> = row.get(3);
    let created_at: chrono::DateTime<chrono::Utc> = row.get(4);
    let updated_at: chrono::DateTime<chrono::Utc> = row.get(5);

    Ok(Model {
        id: id.clone(),
        name,
        description,
        author,
        elements: Vec::new(),
        relationships: Vec::new(),
        diagrams: Vec::new(),
        created_at,
        updated_at,
        version: "3.1".to_string(),
    })
}

/// Update an existing model.
#[tauri::command]
pub async fn update_model(
    id: String,
    name: Option<String>,
    description: Option<String>,
    author: Option<String>,
) -> AppResult<Model> {
    let db = get_db();

    // Verify the model exists first
    let _existing = sqlx::query_scalar::<_, String>("SELECT id FROM models WHERE id = $1")
        .bind(&id)
        .fetch_optional(&db)
        .await
        .map_err(|e| db_err(e, "check model"))?
        .ok_or_else(|| AppError::NotFound(format!("model {id} not found")))?;

    let updated_at = chrono::Utc::now();

    let (name, description, author) = {
        let current = sqlx::query(
            "SELECT name, description, author FROM models WHERE id = $1",
        )
        .bind(&id)
        .fetch_one(&db)
        .await
        .map_err(|e| db_err(e, "fetch current model"))?;

        let cur_name: String = current.get(0);
        let cur_desc: Option<String> = current.get(1);
        let cur_author: Option<String> = current.get(2);

        (
            name.unwrap_or(cur_name),
            description.or(cur_desc),
            author.or(cur_author),
        )
    };

    sqlx::query(
        "UPDATE models SET name = $1, description = $2, author = $3, updated_at = $4 WHERE id = $5",
    )
    .bind(&name)
    .bind(description.as_deref())
    .bind(author.as_deref())
    .bind(chrono::DateTime::<chrono::Utc>::from(updated_at))
    .bind(&id)
    .execute(&db)
    .await
    .map_err(|e| db_err(e, "update model"))?;

    get_model(id).await
}

/// Delete a model and all its associated data.
#[tauri::command]
pub async fn delete_model(id: String) -> AppResult<bool> {
    let db = get_db();

    let rows = sqlx::query("DELETE FROM models WHERE id = $1")
        .bind(&id)
        .execute(&db)
        .await
        .map_err(|e| db_err(e, "delete model"))?
        .rows_affected();

    Ok(rows > 0)
}

/// List all models.
#[tauri::command]
pub async fn list_models() -> AppResult<Vec<Model>> {
    let db = get_db();

    let rows = sqlx::query(
        "SELECT id, name, description, author, created_at, updated_at
         FROM models ORDER BY updated_at DESC",
    )
    .fetch_all(&db)
    .await
    .map_err(|e| db_err(e, "list models"))?;

    let models: Vec<Model> = rows
        .iter()
        .map(|row| {
            let id: String = row.get(0);
            let name: String = row.get(1);
            let description: Option<String> = row.get(2);
            let author: Option<String> = row.get(3);
            let created_at: chrono::DateTime<chrono::Utc> = row.get(4);
            let updated_at: chrono::DateTime<chrono::Utc> = row.get(5);

            Model {
                id,
                name,
                description,
                author,
                elements: Vec::new(),
                relationships: Vec::new(),
                diagrams: Vec::new(),
                created_at,
                updated_at,
                version: "3.1".to_string(),
            }
        })
        .collect();

    Ok(models)
}

/// Search models by keyword in name or description.
#[tauri::command]
pub async fn search_models(query: String) -> AppResult<Vec<Model>> {
    let db = get_db();

    let pattern = format!( "%{query}%");

    let rows = sqlx::query(
        "SELECT id, name, description, author, created_at, updated_at
         FROM models
         WHERE name LIKE $1 OR (description LIKE $1 AND description IS NOT NULL)
         ORDER BY name ASC",
    )
    .bind(&pattern)
    .fetch_all(&db)
    .await
    .map_err(|e| db_err(e, "search models"))?;

    let models: Vec<Model> = rows
        .iter()
        .map(|row| {
            let id: String = row.get(0);
            let name: String = row.get(1);
            let description: Option<String> = row.get(2);
            let author: Option<String> = row.get(3);
            let created_at: chrono::DateTime<chrono::Utc> = row.get(4);
            let updated_at: chrono::DateTime<chrono::Utc> = row.get(5);

            Model {
                id,
                name,
                description,
                author,
                elements: Vec::new(),
                relationships: Vec::new(),
                diagrams: Vec::new(),
                created_at,
                updated_at,
                version: "3.1".to_string(),
            }
        })
        .collect();

    Ok(models)
}

// ── Diagram commands ─────────────────────────────────────────────────────────

/// Internal helper: fetch a diagram with all its elements and connections.
async fn fetch_diagram_full(db: &SqlitePool, diagram_id: &str) -> AppResult<Diagram> {
    // Fetch the diagram row
    let diagram_row = sqlx::query(
        "SELECT id, model_id, name, width, height, grid_size, layout, created_at, modified_at
         FROM diagrams WHERE id = $1",
    )
    .bind(diagram_id)
    .fetch_one(db)
    .await
    .map_err(|e| db_err(e, "fetch diagram"))?;

    let id: String = diagram_row.get(0);
    let model_id: String = diagram_row.get(1);
    let name: String = diagram_row.get(2);
    let width: f64 = diagram_row.get(3);
    let height: f64 = diagram_row.get(4);
    let grid_size: f64 = diagram_row.get(5);
    let layout_str: String = diagram_row.get(6);
    let created_at: chrono::DateTime<chrono::Utc> = diagram_row.get(7);
    let modified_at: chrono::DateTime<chrono::Utc> = diagram_row.get(8);

    let layout: serde_json::Value =
        serde_json::from_str(&layout_str).unwrap_or_else(|_| serde_json::json!({}));

    // Fetch diagram elements
    let elements_rows = sqlx::query(
        "SELECT id, diagram_id, element_id, x, y, width, height, z_index, locked, opacity
         FROM diagram_elements WHERE diagram_id = $1 ORDER BY z_index ASC",
    )
    .bind(diagram_id)
    .fetch_all(db)
    .await
    .map_err(|e| db_err(e, "fetch diagram elements"))?;

    let elements: Vec<DiagramElement> = elements_rows
        .iter()
        .map(|r| DiagramElement {
            id: r.get(0),
            diagram_id: r.get(1),
            element_id: r.get(2),
            x: r.get(3),
            y: r.get(4),
            width: r.get(5),
            height: r.get(6),
            z_index: r.get(7),
            locked: r.get::<Option<i32>, _>(8).unwrap_or(0) != 0,
            opacity: r.get(9),
        })
        .collect();

    // Fetch diagram connections
    let connections_rows = sqlx::query(
        "SELECT id, diagram_id, source_id, target_id, relationship_type, style, route
         FROM diagram_connections WHERE diagram_id = $1",
    )
    .bind(diagram_id)
    .fetch_all(db)
    .await
    .map_err(|e| db_err(e, "fetch diagram connections"))?;

    let connections: Vec<DiagramConnection> = connections_rows
        .iter()
        .map(|r| {
            let style_str: String = r.get(5);
            let route_str: String = r.get(6);
            DiagramConnection {
                id: r.get(0),
                diagram_id: r.get(1),
                source_id: r.get(2),
                target_id: r.get(3),
                relationship_type: r.get(4),
                style: serde_json::from_str(&style_str).unwrap_or_else(|_| serde_json::json!({})),
                route: serde_json::from_str(&route_str).unwrap_or_default(),
            }
        })
        .collect();

    Ok(Diagram {
        id,
        model_id,
        name,
        width,
        height,
        grid_size,
        layout,
        elements,
        connections,
        created_at,
        modified_at,
    })
}

/// Create a new diagram in the given model.
#[tauri::command]
pub async fn create_diagram(
    model_id: String,
    name: String,
    width: f64,
    height: f64,
    grid_size: Option<f64>,
) -> AppResult<Diagram> {
    let db = get_db();

    // Verify model exists
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM models WHERE id = $1")
        .bind(&model_id)
        .fetch_one(&db)
        .await
        .map_err(|e| db_err(e, "check model"))?;
    if exists == 0 {
        return Err(AppError::NotFound(format!("model {model_id} not found")));
    }

    let diagram_id = Uuid::new_v4().to_string();
    let grid_size = grid_size.unwrap_or(20.0);
    let now = chrono::Utc::now();
    let layout = serde_json::json!({});

    sqlx::query(
        "INSERT INTO diagrams (id, model_id, name, width, height, grid_size, layout, created_at, modified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    )
    .bind(&diagram_id)
    .bind(&model_id)
    .bind(&name)
    .bind(width)
    .bind(height)
    .bind(grid_size)
    .bind(&layout.to_string())
    .bind(chrono::DateTime::<chrono::Utc>::from(now))
    .bind(chrono::DateTime::<chrono::Utc>::from(now))
    .execute(&db)
    .await
    .map_err(|e| db_err(e, "create diagram"))?;

    fetch_diagram_full(&db, &diagram_id).await
}

/// Retrieve a diagram by ID with all elements and connections.
#[tauri::command]
pub async fn get_diagram(id: String) -> AppResult<Diagram> {
    let db = get_db();
    fetch_diagram_full(&db, &id).await
}

/// Update an existing diagram.
#[tauri::command]
pub async fn update_diagram(
    id: String,
    name: Option<String>,
    width: Option<f64>,
    height: Option<f64>,
    grid_size: Option<f64>,
    layout: Option<serde_json::Value>,
) -> AppResult<Diagram> {
    let db = get_db();

    // Verify diagram exists and get current values
    let current_row = sqlx::query(
        "SELECT id, model_id, name, width, height, grid_size, layout FROM diagrams WHERE id = $1",
    )
    .bind(&id)
    .fetch_one(&db)
    .await
    .map_err(|e| db_err(e, "fetch diagram for update"))?;

    let current_name: String = current_row.get(2);
    let current_width: f64 = current_row.get(3);
    let current_height: f64 = current_row.get(4);
    let current_grid_size: f64 = current_row.get(5);
    let current_layout_str: String = current_row.get(6);

    let name = name.unwrap_or(current_name);
    let width = width.unwrap_or(current_width);
    let height = height.unwrap_or(current_height);
    let grid_size = grid_size.unwrap_or(current_grid_size);
    let layout_str = match layout {
        Some(v) => v.to_string(),
        None => current_layout_str,
    };

    let modified_at = chrono::Utc::now();

    sqlx::query(
        "UPDATE diagrams SET name = $1, width = $2, height = $3, grid_size = $4, layout = $5, modified_at = $6 WHERE id = $7",
    )
    .bind(&name)
    .bind(width)
    .bind(height)
    .bind(grid_size)
    .bind(&layout_str)
    .bind(chrono::DateTime::<chrono::Utc>::from(modified_at))
    .bind(&id)
    .execute(&db)
    .await
    .map_err(|e| db_err(e, "update diagram"))?;

    fetch_diagram_full(&db, &id).await
}

/// Delete a diagram and all its elements/connections (cascade).
#[tauri::command]
pub async fn delete_diagram(id: String) -> AppResult<bool> {
    let db = get_db();

    let rows = sqlx::query("DELETE FROM diagrams WHERE id = $1")
        .bind(&id)
        .execute(&db)
        .await
        .map_err(|e| db_err(e, "delete diagram"))?
        .rows_affected();

    Ok(rows > 0)
}

/// List all diagrams for a given model.
#[tauri::command]
pub async fn list_diagrams(model_id: String) -> AppResult<Vec<Diagram>> {
    let db = get_db();

    let rows = sqlx::query(
        "SELECT id, model_id, name, width, height, grid_size, layout, created_at, modified_at
         FROM diagrams WHERE model_id = $1 ORDER BY created_at DESC",
    )
    .bind(&model_id)
    .fetch_all(&db)
    .await
    .map_err(|e| db_err(e, "list diagrams"))?;

    let mut diagrams = Vec::new();
    for row in rows {
        let id: String = row.get(0);
        diagrams.push(fetch_diagram_full(&db, &id).await?);
    }

    Ok(diagrams)
}

/// Add an element to a diagram at a specific position.
#[tauri::command]
pub async fn add_element_to_diagram(
    diagram_id: String,
    element_id: String,
    x: f64,
    y: f64,
) -> AppResult<DiagramElement> {
    let db = get_db();

    // Verify diagram exists
    let diagram = sqlx::query("SELECT id, model_id FROM diagrams WHERE id = $1")
        .bind(&diagram_id)
        .fetch_one(&db)
        .await
        .map_err(|e| db_err(e, "fetch diagram"))?;
    let model_id: String = diagram.get(1);

    // Verify element exists and belongs to the same model
    let element = sqlx::query("SELECT id, model_id FROM elements WHERE id = $1")
        .bind(&element_id)
        .fetch_optional(&db)
        .await
        .map_err(|e| db_err(e, "fetch element"))?;

    match element {
        Some(row) => {
            let eid: String = row.get(0);
            let elem_model: String = row.get(1);
            if eid != element_id {
                return Err(AppError::NotFound(format!("element {element_id} not found")));
            }
            if elem_model != model_id {
                return Err(AppError::Validation(
                    "element belongs to a different model".into(),
                ));
            }
        }
        None => {
            return Err(AppError::NotFound(format!("element {element_id} not found")));
        }
    }

    let entry_id = Uuid::new_v4().to_string();

    // Get the next z_index
    let next_z: i32 = sqlx::query_scalar::<_, i32>(
        "SELECT COALESCE(MAX(z_index), -1) + 1 FROM diagram_elements WHERE diagram_id = $1",
    )
    .bind(&diagram_id)
    .fetch_one(&db)
    .await
    .map_err(|e| db_err(e, "fetch max z_index"))?;

    // Insert or update (upsert via conflict)
    sqlx::query(
        "INSERT INTO diagram_elements (id, diagram_id, element_id, x, y, z_index, locked, opacity)
         VALUES ($1, $2, $3, $4, $5, $6, 0, 1.0)
         ON CONFLICT(diagram_id, element_id) DO UPDATE
         SET id = $1, x = $4, y = $5, z_index = $6, modified_at = datetime('now')",
    )
    .bind(&entry_id)
    .bind(&diagram_id)
    .bind(&element_id)
    .bind(x)
    .bind(y)
    .bind(next_z)
    .execute(&db)
    .await
    .map_err(|e| db_err(e, "add element to diagram"))?;

    // Update diagram's modified_at
    let modified_at = chrono::Utc::now();
    sqlx::query("UPDATE diagrams SET modified_at = $1 WHERE id = $2")
        .bind(chrono::DateTime::<chrono::Utc>::from(modified_at))
        .bind(&diagram_id)
        .execute(&db)
        .await
        .map_err(|e| db_err(e, "update diagram timestamp"))?;

    Ok(DiagramElement {
        id: entry_id,
        diagram_id,
        element_id,
        x,
        y,
        width: 100.0,
        height: 50.0,
        z_index: next_z,
        locked: false,
        opacity: 1.0,
    })
}

/// Remove an element from a diagram.
#[tauri::command]
pub async fn remove_element_from_diagram(
    diagram_id: String,
    element_id: String,
) -> AppResult<bool> {
    let db = get_db();

    // Verify diagram exists
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM diagrams WHERE id = $1")
        .bind(&diagram_id)
        .fetch_one(&db)
        .await
        .map_err(|e| db_err(e, "check diagram"))?;
    if exists == 0 {
        return Err(AppError::NotFound(format!("diagram {diagram_id} not found")));
    }

    let rows = sqlx::query(
        "DELETE FROM diagram_elements WHERE diagram_id = $1 AND element_id = $2",
    )
    .bind(&diagram_id)
    .bind(&element_id)
    .execute(&db)
    .await
    .map_err(|e| db_err(e, "remove element from diagram"))?
    .rows_affected();

    // Also remove any connections involving this element in this diagram
    sqlx::query(
        "DELETE FROM diagram_connections WHERE diagram_id = $1 AND (source_id = $2 OR target_id = $2)",
    )
    .bind(&diagram_id)
    .bind(&element_id)
    .execute(&db)
    .await
    .map_err(|e| db_err(e, "cleanup connections"))?;

    if rows > 0 {
        let modified_at = chrono::Utc::now();
        sqlx::query("UPDATE diagrams SET modified_at = $1 WHERE id = $2")
            .bind(chrono::DateTime::<chrono::Utc>::from(modified_at))
            .bind(&diagram_id)
            .execute(&db)
            .await
            .map_err(|e| db_err(e, "update diagram timestamp"))?;
    }

    Ok(rows > 0)
}

/// Add a connection between two elements in a diagram.
#[tauri::command]
pub async fn add_connection_to_diagram(
    diagram_id: String,
    source_id: String,
    target_id: String,
    relationship_type: String,
) -> AppResult<DiagramConnection> {
    let db = get_db();

    // Verify diagram exists
    let diagram = sqlx::query("SELECT id, model_id FROM diagrams WHERE id = $1")
        .bind(&diagram_id)
        .fetch_one(&db)
        .await
        .map_err(|e| db_err(e, "fetch diagram"))?;
    let model_id: String = diagram.get(1);

    // Verify both elements exist and belong to the same model
    let ids_to_check: Vec<&str> = vec![&source_id, &target_id];
    for elem_id_str in &ids_to_check {
        let elem_id = *elem_id_str;
        let elem = sqlx::query("SELECT id, model_id FROM elements WHERE id = $1")
            .bind(elem_id)
            .fetch_optional(&db)
            .await
            .map_err(|e| db_err(e, "fetch element"))?;
        match elem {
            Some(row) => {
                let eid: String = row.get(0);
                let emodel: String = row.get(1);
                if eid != elem_id {
                    return Err(AppError::NotFound(format!("element {elem_id} not found")));
                }
                if emodel != model_id {
                    return Err(AppError::Validation(
                        "element belongs to a different model".into(),
                    ));
                }
            }
            None => {
                return Err(AppError::NotFound(format!("element {elem_id} not found")));
            }
        }
    }

    // Verify elements are placed in this diagram
    for elem_id_str in &ids_to_check {
        let elem_id = *elem_id_str;
        let exists = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM diagram_elements WHERE diagram_id = $1 AND element_id = $2",
        )
        .bind(&diagram_id)
        .bind(elem_id)
        .fetch_one(&db)
        .await
        .map_err(|e| db_err(e, "check element in diagram"))?;
        if exists == 0 {
            return Err(AppError::Validation(format!(
                "element {elem_id} is not in diagram {diagram_id}"
            )));
        }
    }

    let connection_id = Uuid::new_v4().to_string();
    let style = serde_json::json!({});
    let route = Vec::<[f64; 2]>::new();

    sqlx::query(
        "INSERT INTO diagram_connections (id, diagram_id, source_id, target_id, relationship_type, style, route)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(diagram_id, source_id, target_id) DO UPDATE
         SET id = $1, relationship_type = $5, style = $6, route = $7",
    )
    .bind(&connection_id)
    .bind(&diagram_id)
    .bind(&source_id)
    .bind(&target_id)
    .bind(&relationship_type)
    .bind(&style.to_string())
    .bind(&serde_json::to_string(&route).unwrap())
    .execute(&db)
    .await
    .map_err(|e| db_err(e, "add connection"))?;

    // Update diagram's modified_at
    let modified_at = chrono::Utc::now();
    sqlx::query("UPDATE diagrams SET modified_at = $1 WHERE id = $2")
        .bind(chrono::DateTime::<chrono::Utc>::from(modified_at))
        .bind(&diagram_id)
        .execute(&db)
        .await
        .map_err(|e| db_err(e, "update diagram timestamp"))?;

    Ok(DiagramConnection {
        id: connection_id,
        diagram_id,
        source_id,
        target_id,
        relationship_type,
        style: serde_json::json!({}),
        route: Vec::new(),
    })
}

/// Remove a connection from a diagram.
#[tauri::command]
pub async fn remove_connection_from_diagram(
    diagram_id: String,
    connection_id: String,
) -> AppResult<bool> {
    let db = get_db();

    // Verify diagram exists
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM diagrams WHERE id = $1")
        .bind(&diagram_id)
        .fetch_one(&db)
        .await
        .map_err(|e| db_err(e, "check diagram"))?;
    if exists == 0 {
        return Err(AppError::NotFound(format!("diagram {diagram_id} not found")));
    }

    let rows = sqlx::query(
        "DELETE FROM diagram_connections WHERE id = $1 AND diagram_id = $2",
    )
    .bind(&connection_id)
    .bind(&diagram_id)
    .execute(&db)
    .await
    .map_err(|e| db_err(e, "remove connection"))?
    .rows_affected();

    if rows > 0 {
        let modified_at = chrono::Utc::now();
        sqlx::query("UPDATE diagrams SET modified_at = $1 WHERE id = $2")
            .bind(chrono::DateTime::<chrono::Utc>::from(modified_at))
            .bind(&diagram_id)
            .execute(&db)
            .await
            .map_err(|e| db_err(e, "update diagram timestamp"))?;
    }

    Ok(rows > 0)
}

// ── SVG/PNG export helpers ────────────────────────────────────────────────────

/// Build an SVG string from a diagram's elements and connections.
async fn build_diagram_svg(db: &SqlitePool, diagram_id: &str) -> AppResult<String> {
    // Fetch the diagram
    let diagram_row = sqlx::query(
        "SELECT id, model_id, name, width, height, grid_size, layout FROM diagrams WHERE id = $1",
    )
    .bind(diagram_id)
    .fetch_one(db)
    .await
    .map_err(|e| db_err(e, "fetch diagram for SVG"))?;

    let d_name: String = diagram_row.get(2);
    let d_width: f64 = diagram_row.get(3);
    let d_height: f64 = diagram_row.get(4);
    let grid_size: f64 = diagram_row.get(5);

    // Fetch elements with their names and types
    let elems = sqlx::query(
        "SELECT de.id, de.element_id, e.name, e.element_type, de.x, de.y, de.width, de.height, de.z_index, de.locked, de.opacity
         FROM diagram_elements de
         JOIN elements e ON de.element_id = e.id
         WHERE de.diagram_id = $1
         ORDER BY de.z_index ASC",
    )
    .bind(diagram_id)
    .fetch_all(db)
    .await
    .map_err(|e| db_err(e, "fetch elements for SVG"))?;

    // Fetch connections
    let conns = sqlx::query(
        "SELECT dc.id, dc.source_id, dc.target_id, dc.relationship_type, dc.style, dc.route
         FROM diagram_connections dc
         WHERE dc.diagram_id = $1",
    )
    .bind(diagram_id)
    .fetch_all(db)
    .await
    .map_err(|e| db_err(e, "fetch connections for SVG"))?;

    // Helper: get a layer color for an element type
    let layer_color = |element_type: &str| -> String {
        match element_type {
            t if t.starts_with("Business") => "#4A90D9",
            t if t.starts_with("Application") => "#27AE60",
            t if t.starts_with("Technology") => "#8E44AD",
            t if t.starts_with("Physical") => "#F39C12",
            t if t.starts_with("Plateau") || t.starts_with("WorkPackage") || t.starts_with("CourseOfAction") || t.starts_with("Gap") => "#E74C3C",
            _ => "#95A5A6",
        }
        .to_string()
    };

    // Helper: get arrowhead marker style based on relationship type
    let arrow_style = |rel_type: &str| -> &'static str {
        match rel_type {
            "composition" => "marker-end=\"url(#arrow-filled)\"",
            "aggregation" => "marker-end=\"url(#arrow-open)\"",
            "flow" => "marker-end=\"url(#arrow-filled)\"",
            "triggers" => "marker-end=\"url(#arrow-filled)\"",
            "realization" => "marker-end=\"url(#arrow-realization)\"",
            _ => "",
        }
    };

    // Build SVG header
    let w = d_width as u32;
    let h = d_height as u32;
    let gs = grid_size as u32;
    let mut svg = format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"{w}\" height=\"{h}\" viewBox=\"0 0 {w} {h}\">"
    );
    svg.push('\n');
    svg.push_str("  <defs>\n");
    svg.push_str(&format!(
        "    <pattern id=\"grid\" width=\"{gs}\" height=\"{gs}\" patternUnits=\"userSpaceOnUse\">\n"
    ));
    svg.push_str(&format!(
        "      <path d=\"M {gs} 0 L 0 0 L 0 {gs}\" fill=\"none\" stroke=\"#e0e0e0\" stroke-width=\"0.5\"/>\n"
    ));
    svg.push_str("    </pattern>\n");
    svg.push_str(
        "    <marker id=\"arrow-filled\" markerWidth=\"10\" markerHeight=\"7\" refX=\"9\" refY=\"3.5\" orient=\"auto\" markerUnits=\"strokeWidth\">\n",
    );
    svg.push_str("      <polygon points=\"0 0, 10 3.5, 0 7\" fill=\"#555\"/>\n");
    svg.push_str("    </marker>\n");
    svg.push_str(
        "    <marker id=\"arrow-open\" markerWidth=\"10\" markerHeight=\"7\" refX=\"9\" refY=\"3.5\" orient=\"auto\" markerUnits=\"strokeWidth\">\n",
    );
    svg.push_str(
        "      <polyline points=\"0 0, 10 3.5, 0 7\" fill=\"none\" stroke=\"#555\" stroke-width=\"1.5\"/>\n",
    );
    svg.push_str("    </polyline>\n");
    svg.push_str(
        "    <marker id=\"arrow-realization\" markerWidth=\"10\" markerHeight=\"7\" refX=\"9\" refY=\"3.5\" orient=\"auto\" markerUnits=\"strokeWidth\">\n",
    );
    svg.push_str(
        "      <line x1=\"0\" y1=\"0\" x2=\"10\" y2=\"3.5\" stroke=\"#555\" stroke-width=\"1.5\"/>\n",
    );
    svg.push_str(
        "      <line x1=\"0\" y1=\"7\" x2=\"10\" y2=\"3.5\" stroke=\"#555\" stroke-width=\"1.5\"/>\n",
    );
    svg.push_str("    </marker>\n");
    svg.push_str("  </defs>\n");

    // Background with grid
    svg.push_str(&format!("  <rect width=\"{w}\" height=\"{h}\" fill=\"#fafafa\"/>\n"));
    svg.push_str(&format!("  <rect width=\"{w}\" height=\"{h}\" fill=\"url(#grid)\"/>\n"));

    // Element lookup map for connection routing
    let elem_positions: std::collections::HashMap<String, (f64, f64, f64, f64)> = elems
        .iter()
        .map(|r| {
            let eid: String = r.get(1);
            let ex: f64 = r.get(4);
            let ey: f64 = r.get(5);
            let ew: f64 = r.get(6);
            let eh: f64 = r.get(7);
            (eid, (ex, ey, ew, eh))
        })
        .collect();

    // Render connections first (behind elements)
    for conn in &conns {
        let src_id: String = conn.get(1);
        let tgt_id: String = conn.get(2);
        let rel_type: String = conn.get(3);
        let route_str: String = conn.get(5);
        let style_str: String = conn.get(4);

        let style: serde_json::Value =
            serde_json::from_str(&style_str).unwrap_or_else(|_| serde_json::json!({}));

        // Parse custom stroke from style
        let stroke = style
            .get("stroke")
            .and_then(|v| v.as_str())
            .unwrap_or("#555");
        let stroke_width = style
            .get("strokeWidth")
            .and_then(|v| v.as_f64())
            .unwrap_or(2.0);

        let arrow = arrow_style(&rel_type);

        // Try to use route waypoints if available
        let route: Vec<[f64; 2]> =
            serde_json::from_str(&route_str).unwrap_or_default();

        if !route.is_empty() {
            // Use route waypoints
            let points: String = route
                .iter()
                .map(|p| format!("{} {}" ,p[0], p[1]))
                .collect::<Vec<_>>()
                .join(" ");
            svg.push_str(&format!(
                r#"<polyline points="{points}" fill="none" stroke="{stroke}" stroke-width="{sw}" {arrow}/>"#,
                sw = stroke_width,
            ));
            svg.push('\n');
        } else {
            // Draw line between element centers
            if let Some((sx, sy, ew, eh)) = elem_positions.get(&src_id) {
                if let Some((tx, ty, tw, th)) = elem_positions.get(&tgt_id) {
                    let mid_x = sx + ew / 2.0;
                    let mid_y = sy + eh / 2.0;
                    let end_x = tx + tw / 2.0;
                    let end_y = ty + th / 2.0;
                    svg.push_str(&format!(
                        r#"<line x1="{mx1}" y1="{my1}" x2="{mx2}" y2="{my2}" stroke="{stroke}" stroke-width="{sw}" {arrow}/>"#,
                        mx1 = mid_x,
                        my1 = mid_y,
                        mx2 = end_x,
                        my2 = end_y,
                        sw = stroke_width,
                    ));
                    svg.push('\n');
                }
            }
        }
    }

    // Render elements
    for elem in &elems {
        let element_id: String = elem.get(1);
        let name: String = elem.get(2);
        let element_type: String = elem.get(3);
        let x: f64 = elem.get(4);
        let y: f64 = elem.get(5);
        let ew: f64 = elem.get(6);
        let eh: f64 = elem.get(7);
        let locked: i32 = elem.get(9);
        let opacity: f64 = elem.get(10);

        let color = layer_color(&element_type);
        let lock_marker = if locked != 0 { " \u{1F512}" } else { "" };
        let escaped_name = name.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;");
        let cx = x + ew / 2.0;
        let cy = y + eh / 2.0;
        let comment = format!("<!-- element: {element_id} -->");

        svg.push_str("  <g opacity=\"");
        svg.push_str(&opacity.to_string());
        svg.push_str("\">\n");
        svg.push_str("    <rect x=\"");
        svg.push_str(&x.to_string());
        svg.push_str("\" y=\"");
        svg.push_str(&y.to_string());
        svg.push_str("\" width=\"");
        svg.push_str(&(ew as i32).to_string());
        svg.push_str("\" height=\"");
        svg.push_str(&(eh as i32).to_string());
        svg.push_str("\" rx=\"5\" ry=\"5\" fill=\"");
        svg.push_str(&color);
        svg.push_str("\" stroke=\"#333\" stroke-width=\"1.5\"/>\n");
        svg.push_str("    <text x=\"");
        svg.push_str(&cx.to_string());
        svg.push_str("\" y=\"");
        svg.push_str(&cy.to_string());
        svg.push_str("\" text-anchor=\"middle\" dominant-baseline=\"middle\" fill=\"#fff\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"500\">");
        svg.push_str(&escaped_name);
        svg.push_str(lock_marker);
        svg.push_str(&comment);
        svg.push_str("</text>\n");
        svg.push_str("  </g>\n");
    }

    // Add diagram title
    let escaped_title = d_name
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;");
    svg.push_str("  <text x=\"10\" y=\"20\" fill=\"#333\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"600\">");
    svg.push_str(&escaped_title);
    svg.push_str("</text>\n");

    svg.push_str("</svg>\n");

    Ok(svg)
}

/// Export a diagram as SVG.
#[tauri::command]
pub async fn export_diagram_svg(diagram_id: String) -> AppResult<String> {
    let db = get_db();
    build_diagram_svg(&db, &diagram_id).await
}

/// Export a diagram as PNG.
#[tauri::command]
pub async fn export_diagram_png(diagram_id: String) -> AppResult<Vec<u8>> {
    let db = get_db();
    let svg = build_diagram_svg(&db, &diagram_id).await?;

    // Parse SVG with usvg
    let opts = usvg::Options::default();
    let tree = usvg::Tree::from_str(&svg, &opts)
        .map_err(|e| AppError::Command(format!("Failed to parse SVG: {e}")))?;

    // Render to PNG bytes
    let size = tree.size();
    let width = size.width() as u32 + 1;
    let height = size.height() as u32 + 1;

    // Render using resvg
    let mut pixmap = tiny_skia::Pixmap::new(width, height)
        .ok_or_else(|| AppError::Command("Failed to create pixmap".into()))?;

    let mut pm = pixmap.as_mut();
    resvg::render(&tree, tiny_skia::Transform::default(), &mut pm);

    let png_bytes = pixmap
        .encode_png()
        .map_err(|e| AppError::Command(format!("PNG encoding failed: {e}")))?;

    Ok(png_bytes)
}
