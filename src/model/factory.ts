/**
 * Model Factory — Creates and manipulates ArchiMate model entities.
 * Mirrors Archi's ArchiMateFactoryImpl in the Java codebase.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ArchiMateElement,
  Relationship,
  Diagram,
  Model,
  ArchiMateElementSchema,
  RelationshipSchema,
  DiagramSchema,
  ModelSchema,
} from '../types/domain';
import {
  ArchiMateElementType,
  ArchiMateLayer,
  TYPE_LAYER_MAP,
} from '../types/archimate';
import {
  RelationshipType,
  relationshipTypes,
} from '../types/relationships';

// ── Element Factory ──────────────────────────────────────────────────────────

export class ElementFactory {
  /**
   * Create an ArchiMate element with proper layer assignment.
   */
  static create(
    type: ArchiMateElementType,
    name: string,
    options: {
      modelId?: string;
      documentation?: string;
      tags?: string[];
      stereotypes?: string[];
      properties?: Record<string, string>;
      userProperties?: Record<string, string>;
      folderId?: string | null;
      createdBy?: string;
    } = {},
  ): ArchiMateElement {
    const layer = this.getElementLayer(type);
    const now = new Date().toISOString();
    const id = uuidv4();

    const element: ArchiMateElement = {
      id,
      type,
      name,
      modelId: options.modelId,
      documentation: options.documentation || '',
      tags: options.tags || [],
      stereotypes: options.stereotypes || [],
      properties: options.properties || {},
      userProperties: options.userProperties || {},
      layer,
      folderId: options.folderId ?? undefined,
      created: now,
      modified: now,
    };

    // Validate through Zod
    const result = ArchiMateElementSchema.safeParse(element);
    if (!result.success) {
      throw new Error(`Invalid element: ${result.error.message}`);
    }

    return result.data;
  }

  /**
   * Get the ArchiMate layer for a given element type.
   */
  static getElementLayer(type: ArchiMateElementType): ArchiMateLayer {
    return TYPE_LAYER_MAP[type] || 'other';
  }

  /**
   * Duplicate an element with a new UUID and name suffix.
   */
  static duplicate(element: ArchiMateElement): ArchiMateElement {
    const now = new Date().toISOString();
    return {
      ...element,
      id: uuidv4(),
      name: `${element.name} (copy)`,
      created: now,
      modified: now,
    };
  }
}

// ── Relationship Factory ────────────────────────────────────────────────────

export class RelationshipFactory {
  /**
   * Create a relationship between two elements.
   */
  static create(
    type: RelationshipType,
    sourceId: string,
    targetId: string,
    options: {
      modelId?: string;
      name?: string;
      documentation?: string;
      accessType?: string;
    } = {},
  ): Relationship {
    const now = new Date().toISOString();
    const id = uuidv4();

    const rel: Relationship = {
      id,
      type,
      sourceId,
      targetId,
      modelId: options.modelId,
      name: options.name || '',
      documentation: options.documentation || '',
      accessType: options.accessType as any,
    };

    const result = RelationshipSchema.safeParse(rel);
    if (!result.success) {
      throw new Error(`Invalid relationship: ${result.error.message}`);
    }

    return result.data;
  }
}

// ── Diagram Factory ──────────────────────────────────────────────────────────

export class DiagramFactory {
  static create(
    name: string,
    modelId: string,
    options: {
      width?: number;
      height?: number;
      gridSize?: number;
      layout?: string;
    } = {},
  ): Diagram {
    const now = new Date().toISOString();
    const id = uuidv4();

    const diagram: Diagram = {
      id,
      name,
      modelId,
      gridSize: options.gridSize ?? 10,
      gridVisible: true,
      gridSnap: true,
      backgroundColor: '#FFFFFF',
      width: options.width ?? 1920,
      height: options.height ?? 1080,
      elements: [],
      connections: [],
      created: now,
      modified: now,
    };

    const result = DiagramSchema.safeParse(diagram);
    if (!result.success) {
      throw new Error(`Invalid diagram: ${result.error.message}`);
    }

    return result.data;
  }
}

// ── Model Factory ─────────────────────────────────────────────────────────────

export class ModelFactory {
  /**
   * Create a new ArchiMate model.
   */
  static create(
    name: string,
    options: {
      version?: string;
      archimateVersion?: string;
      description?: string;
      createdBy?: string;
    } = {},
  ): Model {
    const now = new Date().toISOString();
    const id = uuidv4();

    const model: Model = {
      id,
      name,
      version: options.version || '1.0.0',
      archimateVersion: options.archimateVersion || '3.2',
      description: options.description || '',
      elements: [],
      relationships: [],
      diagrams: [],
      folders: [],
      created: now,
      modified: now,
    };

    const result = ModelSchema.safeParse(model);
    if (!result.success) {
      throw new Error(`Invalid model: ${result.error.message}`);
    }

    return result.data;
  }

  /**
   * Add an element to a model.
   */
  static addElement(model: Model, element: ArchiMateElement): Model {
    return {
      ...model,
      elements: [...model.elements, element],
      modified: new Date().toISOString(),
    };
  }

  /**
   * Remove an element and all relationships referencing it.
   */
  static removeElement(model: Model, elementId: string): Model {
    return {
      ...model,
      elements: model.elements.filter(e => e.id !== elementId),
      relationships: model.relationships.filter(
        r => r.sourceId !== elementId && r.targetId !== elementId,
      ),
      modified: new Date().toISOString(),
    };
  }

  /**
   * Add a relationship to a model.
   */
  static addRelationship(model: Model, relationship: Relationship): Model {
    return {
      ...model,
      relationships: [...model.relationships, relationship],
      modified: new Date().toISOString(),
    };
  }

  /**
   * Remove a relationship from a model.
   */
  static removeRelationship(model: Model, relationshipId: string): Model {
    return {
      ...model,
      relationships: model.relationships.filter(r => r.id !== relationshipId),
      modified: new Date().toISOString(),
    };
  }

  /**
   * Add a diagram to a model.
   */
  static addDiagram(model: Model, diagram: Diagram): Model {
    return {
      ...model,
      diagrams: [...model.diagrams, diagram],
      modified: new Date().toISOString(),
    };
  }

  /**
   * Remove a diagram from a model.
   */
  static removeDiagram(model: Model, diagramId: string): Model {
    return {
      ...model,
      diagrams: model.diagrams.filter(d => d.id !== diagramId),
      modified: new Date().toISOString(),
    };
  }

  /**
   * Get an element by ID.
   */
  static getElement(model: Model, elementId: string): ArchiMateElement | undefined {
    return model.elements.find(e => e.id === elementId);
  }

  /**
   * Get a relationship by ID.
   */
  static getRelationship(model: Model, relationshipId: string): Relationship | undefined {
    return model.relationships.find(r => r.id === relationshipId);
  }

  /**
   * Find all relationships involving an element.
   */
  static findRelationships(model: Model, elementId: string): Relationship[] {
    return model.relationships.filter(
      r => r.sourceId === elementId || r.targetId === elementId,
    );
  }

  /**
   * Duplicate an element in a model.
   */
  static duplicateElement(model: Model, elementId: string): Model {
    const source = model.elements.find(e => e.id === elementId);
    if (!source) return model;

    const dup = ElementFactory.duplicate(source);
    return ModelFactory.addElement(model, dup);
  }

  /**
   * Update an element in a model.
   */
  static updateElement(
    model: Model,
    elementId: string,
    updates: Partial<ArchiMateElement>,
  ): Model {
    return {
      ...model,
      elements: model.elements.map(e =>
        e.id === elementId
          ? { ...e, ...updates, modified: new Date().toISOString() }
          : e,
      ),
      modified: new Date().toISOString(),
    };
  }
}
