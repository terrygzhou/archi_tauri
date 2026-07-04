//! LLM integration commands.
//!
//! Provides commands for configuring LLM providers and using LLMs to
//! map applications to ArchiMate capabilities.

use reqwest::Client;

use crate::{AppError, AppResult, LlmError};

/// Configuration for an LLM provider.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LlmProviderConfig {
    pub provider: String,
    pub model: String,
    pub api_key: String,
    pub base_url: Option<String>,
    pub max_tokens: Option<usize>,
    pub temperature: Option<f64>,
}

/// Result from an LLM mapping request.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LlmMappingResult {
    pub capabilities: Vec<CapabilityMapping>,
    pub confidence: f64,
    pub raw_response: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CapabilityMapping {
    pub application: String,
    pub capability: String,
    pub rationale: String,
}

/// Configure or update an LLM provider.
#[tauri::command]
pub async fn configure_provider(config: LlmProviderConfig) -> AppResult<()> {
    // Validate the config
    if config.provider.is_empty() {
        return Err(AppError::Validation(
            "provider name is required".into(),
        ));
    }
    if config.api_key.is_empty() {
        return Err(AppError::Validation(
            "API key is required".into(),
        ));
    }

    // Store API key in system keyring
    let service = format!("archi_desktop/llm_{}", config.provider);
    match keytar::set_password(&service, &config.provider, &config.api_key) {
        Ok(()) => tracing::info!(provider = %config.provider, "LLM provider configured"),
        Err(e) => tracing::warn!(error = %e, "failed to store API key in keyring"),
    }

    Ok(())
}

/// Use the LLM to map applications to ArchiMate capabilities.
#[tauri::command]
pub async fn map_to_capabilities(
    provider: String,
    api_key: String,
    model: String,
    applications: Vec<String>,
    existing_model: Option<String>,
) -> AppResult<LlmMappingResult> {
    let client = Client::new();

    let system_prompt = format!(
        "You are an ArchiMate modeling assistant. Map the following applications to ArchiMate \
         Business Capabilities. For each application, identify the primary business capability \
         it supports and provide a brief rationale.{}",
        existing_model.as_deref()
            .map(|m| format!("\nExisting model context: {m}"))
            .unwrap_or_default()
    );

    let user_prompt = format!("Applications to map:\n{}\n\nRespond as JSON: {{\"capabilities\":[],\"confidence\":0.0}}",
        applications.iter().map(|a| format!("- {a}")).collect::<Vec<_>>().join("\n")
    );

    let response = client
        .post(format!(
            "https://api.openai.com/v1/chat/completions"
        ))
        .header("Authorization", format!("Bearer {api_key}"))
        .json(&serde_json::json!({
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 2000,
        }))
        .send()
        .await
        .map_err(|e| LlmError::Network(e))?;

    let status = response.status();
    let body = response.text().await
        .map_err(|e| LlmError::ApiError {
            status: status.as_u16(),
            detail: e.to_string(),
        })?;

    if !status.is_success() {
        return Err(LlmError::ApiError {
            status: status.as_u16(),
            detail: body.clone(),
        }.into());
    }

    // Parse response
    let parsed: LlmMappingResult = serde_json::from_str(&body)
        .unwrap_or_else(|_| LlmMappingResult {
            capabilities: Vec::new(),
            confidence: 0.0,
            raw_response: body.clone(),
        });

    Ok(parsed)
}

/// Generate a description for a model element using the LLM.
#[tauri::command]
pub async fn generate_description(
    provider: String,
    api_key: String,
    model: String,
    element_name: String,
    element_type: String,
    context: Option<String>,
) -> AppResult<String> {
    let client = Client::new();

    let prompt = format!(
        "Generate a concise description for an ArchiMate {} element named '{}'.{}" ,
        element_type,
        element_name,
        context.as_deref()
            .map(|c| format!(" Context: {c}"))
            .unwrap_or_default()
    );

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {api_key}"))
        .json(&serde_json::json!({
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 200,
        }))
        .send()
        .await
        .map_err(|e| LlmError::Network(e))?;

    let status = response.status().as_u16();
    let body = response.text().await
        .map_err(|e| LlmError::ApiError {
            status,
            detail: e.to_string(),
        })?;

    // Extract the generated text
    Ok(body)
}
