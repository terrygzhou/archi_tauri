import { Model, ArchiMateElement, Relationship, Diagram, Folder } from '../types/domain';
import { STORAGE_KEYS } from '../utils/constants';
import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Storage service — Tauri IPC bridge for SQLite operations
// ============================================================================

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rowsAffected?: number;
}

export interface QueryParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  where?: Record<string, unknown>;
}

export class StorageService {
  /**
   * Initialize the database connection
   */
  async init(): Promise<boolean> {
    try {
      await invoke('init_database');
      return true;
    } catch (error) {
      console.error('[StorageService] Database init failed:', error);
      return false;
    }
  }

  /**
   * Run database migrations
   */
  async migrate(): Promise<boolean> {
    try {
      await invoke('run_migrations');
      return true;
    } catch (error) {
      console.error('[StorageService] Migration failed:', error);
      return false;
    }
  }

  // ---- Model CRUD ----

  /**
   * Save a model to SQLite
   */
  async saveModel(model: Model): Promise<StorageResult<Model>> {
    try {
      const saved = await invoke<Model>('db_save_model', { model });
      return { success: true, data: saved };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Load a model by ID
   */
  async loadModel(id: string): Promise<StorageResult<Model>> {
    try {
      const model = await invoke<Model>('db_load_model', { id });
      return { success: true, data: model };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(id: string): Promise<StorageResult<void>> {
    try {
      await invoke('db_delete_model', { id });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * List all models
   */
  async listModels(params?: QueryParams): Promise<StorageResult<Model[]>> {
    try {
      const models = await invoke<Model[]>('db_list_models', { params });
      return { success: true, data: models };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // ---- Element CRUD ----

  /**
   * Save an element
   */
  async saveElement(element: ArchiMateElement): Promise<StorageResult<ArchiMateElement>> {
    try {
      const saved = await invoke<ArchiMateElement>('db_save_element', { element });
      return { success: true, data: saved };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Get an element by ID
   */
  async getElement(id: string): Promise<StorageResult<ArchiMateElement>> {
    try {
      const element = await invoke<ArchiMateElement>('db_get_element', { id });
      return { success: true, data: element };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * List elements with pagination
   */
  async listElements(modelId: string, params?: QueryParams): Promise<StorageResult<ArchiMateElement[]>> {
    try {
      const elements = await invoke<ArchiMateElement[]>('db_list_elements', { modelId, params });
      return { success: true, data: elements };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Delete an element
   */
  async deleteElement(id: string): Promise<StorageResult<void>> {
    try {
      await invoke('db_delete_element', { id });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // ---- Relationship CRUD ----

  /**
   * Save a relationship
   */
  async saveRelationship(relationship: Relationship): Promise<StorageResult<Relationship>> {
    try {
      const saved = await invoke<Relationship>('db_save_relationship', { relationship });
      return { success: true, data: saved };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * List relationships for a model
   */
  async listRelationships(modelId: string): Promise<StorageResult<Relationship[]>> {
    try {
      const relationships = await invoke<Relationship[]>('db_list_relationships', { modelId });
      return { success: true, data: relationships };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Delete a relationship
   */
  async deleteRelationship(id: string): Promise<StorageResult<void>> {
    try {
      await invoke('db_delete_relationship', { id });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // ---- Diagram CRUD ----

  /**
   * Save a diagram
   */
  async saveDiagram(diagram: Diagram): Promise<StorageResult<Diagram>> {
    try {
      const saved = await invoke<Diagram>('db_save_diagram', { diagram });
      return { success: true, data: saved };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * List diagrams for a model
   */
  async listDiagrams(modelId: string): Promise<StorageResult<Diagram[]>> {
    try {
      const diagrams = await invoke<Diagram[]>('db_list_diagrams', { modelId });
      return { success: true, data: diagrams };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // ---- Preferences ----

  /**
   * Save a preference
   */
  async setPreference(key: string, value: unknown): Promise<boolean> {
    try {
      await invoke('db_set_preference', { key, value: JSON.stringify(value) });
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to save preference:', error);
      return false;
    }
  }

  /**
   * Get a preference
   */
  async getPreference<T>(key: string): Promise<T | null> {
    try {
      const value = await invoke<string>('db_get_preference', { key });
      return JSON.parse(value);
    } catch (error) {
      console.error('[StorageService] Failed to get preference:', error);
      return null;
    }
  }

  /**
   * Delete a preference
   */
  async deletePreference(key: string): Promise<boolean> {
    try {
      await invoke('db_delete_preference', { key });
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to delete preference:', error);
      return false;
    }
  }

  /**
   * Clear the database (reset)
   */
  async clear(): Promise<boolean> {
    try {
      await invoke('db_clear');
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to clear database:', error);
      return false;
    }
  }

  /**
   * Database statistics
   */
  async getStats(): Promise<StorageResult<Record<string, number>>> {
    try {
      const stats = await invoke<Record<string, number>>('db_stats');
      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}

// ============================================================================
// Singleton instance
// ============================================================================
export const storageService = new StorageService();
