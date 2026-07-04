import {
  Model,
  ArchiMateElement,
  Relationship,
  Diagram,
  Folder,
} from '../types/domain';
import { ArchiMateElementType } from '../types/archimate';
import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Model service — Tauri IPC bridge for model operations
// ============================================================================

export interface ModelServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ModelService {
  /**
   * Create a new model
   */
  async createModel(name: string = 'Untitled Model'): Promise<ModelServiceResult<Model>> {
    try {
      const model = await invoke<Model>('create_model', { name });
      return { success: true, data: model };
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
  async loadModel(id: string): Promise<ModelServiceResult<Model>> {
    try {
      const model = await invoke<Model>('load_model', { id });
      return { success: true, data: model };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Save a model
   */
  async saveModel(model: Model): Promise<ModelServiceResult<Model>> {
    try {
      const saved = await invoke<Model>('save_model', { model });
      return { success: true, data: saved };
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
  async deleteModel(id: string): Promise<ModelServiceResult<void>> {
    try {
      await invoke('delete_model', { id });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // ---- Element operations ----

  /**
   * Add an element to a model
   */
  async addElement(modelId: string, type: ArchiMateElementType, name: string): Promise<ModelServiceResult<ArchiMateElement>> {
    try {
      const element = await invoke<ArchiMateElement>('add_element', { modelId, type, name });
      return { success: true, data: element };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Update an element
   */
  async updateElement(id: string, updates: Partial<ArchiMateElement>): Promise<ModelServiceResult<ArchiMateElement>> {
    try {
      const element = await invoke<ArchiMateElement>('update_element', { id, updates });
      return { success: true, data: element };
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
  async deleteElement(id: string): Promise<ModelServiceResult<void>> {
    try {
      await invoke('delete_element', { id });
      return { success: true };
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
  async getElement(id: string): Promise<ModelServiceResult<ArchiMateElement>> {
    try {
      const element = await invoke<ArchiMateElement>('get_element', { id });
      return { success: true, data: element };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Search elements
   */
  async searchElements(modelId: string, query: string): Promise<ModelServiceResult<ArchiMateElement[]>> {
    try {
      const elements = await invoke<ArchiMateElement[]>('search_elements', { modelId, query });
      return { success: true, data: elements };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // ---- Relationship operations ----

  /**
   * Add a relationship
   */
  async addRelationship(relationship: Relationship): Promise<ModelServiceResult<Relationship>> {
    try {
      const result = await invoke<Relationship>('add_relationship', { relationship });
      return { success: true, data: result };
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
  async deleteRelationship(id: string): Promise<ModelServiceResult<void>> {
    try {
      await invoke('delete_relationship', { id });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // ---- Diagram operations ----

  /**
   * Add a diagram to a model
   */
  async addDiagram(modelId: string, diagram: Diagram): Promise<ModelServiceResult<Diagram>> {
    try {
      const result = await invoke<Diagram>('add_diagram', { modelId, diagram });
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Update a diagram
   */
  async updateDiagram(id: string, diagram: Diagram): Promise<ModelServiceResult<Diagram>> {
    try {
      const result = await invoke<Diagram>('update_diagram', { id, diagram });
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Delete a diagram
   */
  async deleteDiagram(id: string): Promise<ModelServiceResult<void>> {
    try {
      await invoke('delete_diagram', { id });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // ---- Folder operations ----

  /**
   * Add a folder
   */
  async addFolder(folder: Folder): Promise<ModelServiceResult<Folder>> {
    try {
      const result = await invoke<Folder>('add_folder', { folder });
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Delete a folder
   */
  async deleteFolder(id: string): Promise<ModelServiceResult<void>> {
    try {
      await invoke('delete_folder', { id });
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
  async listModels(): Promise<ModelServiceResult<Model[]>> {
    try {
      const models = await invoke<Model[]>('list_models');
      return { success: true, data: models };
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
export const modelService = new ModelService();
